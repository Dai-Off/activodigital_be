import { Request, Response } from 'express';
import { 
  signUpUser, 
  signInUser, 
  getProfileByUserId, 
  signUpUserWithInvitation, 
  validateInvitation 
} from '../../domain/services/authService';
import { UserService } from '../../domain/services/userService';
import { BuildingService } from '../../domain/services/edificioService';
import { UserRole } from '../../types/user';

export const signupController = async (req: Request, res: Response) => {
  try {
    const { email, password, full_name } = req.body ?? {};
    
    // Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'email and password are required' 
      });
    }

    // Forzar rol por defecto a administrador (con compatibilidad en servicio)
    const forcedRole = UserRole.ADMINISTRADOR;

    const result = await signUpUser({ 
      email, 
      password, 
      fullName: full_name, 
      role: forcedRole 
    });
    
    // Transformar la respuesta para que coincida con lo que espera el frontend
    return res.status(201).json({
      access_token: result.access_token,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.userProfile.fullName,
        role: {
          name: result.userProfile.role?.name ?? null
        }
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const result = await signInUser({ email, password });
    
    // Procesar asignaciones pendientes después del login exitoso
    try {
      const userService = new UserService();
      const user = await userService.getUserByEmail(email);
      
      if (user) {
        // Buscar invitaciones pendientes para este usuario
        const { getSupabaseClient } = await import('../../lib/supabase');
        const supabase = getSupabaseClient();
        
        const { data: pendingInvitations } = await supabase
          .from('invitations')
          .select('building_id, role:roles(name)')
          .eq('email', email)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString());

        // Procesar cada invitación pendiente
        if (pendingInvitations && pendingInvitations.length > 0) {
          const buildingService = new BuildingService();
          
          for (const invitation of pendingInvitations) {
            try {
              // Verificar si ya tiene acceso al edificio
              const hasAccess = await buildingService.userHasAccessToBuilding(user.userId, invitation.building_id);
              
              if (!hasAccess) {
                // Obtener información del edificio y su propietario
                const { data: buildingWithOwner } = await supabase
                  .from('buildings')
                  .select(`
                    id,
                    owner_id,
                    owner:users!owner_id(
                      id,
                      user_id,
                      email,
                      full_name
                    )
                  `)
                  .eq('id', invitation.building_id)
                  .single();

                if (buildingWithOwner && buildingWithOwner.owner) {
                  const owner = buildingWithOwner.owner;
                  
                  // Crear asignación según el rol
                  const roleName = (invitation.role as any)?.name;
                  if (roleName === 'tecnico') {
                    const ownerUserId = (owner as any)?.user_id;
                    await buildingService.assignTechnicianToBuilding(invitation.building_id, user.userId, ownerUserId);
                  } else if (roleName === 'cfo') {
                    const ownerUserId = (owner as any)?.user_id;
                    await buildingService.assignCfoToBuilding(invitation.building_id, user.id, ownerUserId);
                  } else if (roleName === 'propietario') {
                    const ownerUserId = (owner as any)?.user_id;
                    await buildingService.assignPropietarioToBuilding(invitation.building_id, user.id, ownerUserId);
                  }
                  
                  console.log(`✅ Asignación automática completada para ${email} en edificio ${invitation.building_id}`);
                }
              }
            } catch (assignmentError) {
              console.error(`Error procesando asignación para ${email}:`, assignmentError);
              // No fallar el login por errores de asignación
            }
          }
        }
      }
    } catch (assignmentError) {
      console.error('Error procesando asignaciones pendientes:', assignmentError);
      // No fallar el login por errores de asignación
    }
    
    // Transformar la respuesta para que coincida con el formato esperado por el frontend
    return res.status(200).json({
      access_token: result.access_token,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.userProfile.fullName,
        role: {
          name: result.userProfile.role?.name ?? null
        }
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(401).json({ error: message });
  }
};

export const meController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const profile = await getProfileByUserId(userId);
    return res.status(200).json(profile);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

export const logoutController = async (_req: Request, res: Response) => {
  // Backend stateless: el frontend debe borrar tokens. Devolvemos 200 para UX simple.
  return res.status(200).json({ ok: true });
};

/**
 * Registro con invitación
 * POST /api/auth/register-with-invitation
 */
export const signupWithInvitationController = async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, invitation_token } = req.body ?? {};
    
    // Validar campos requeridos
    if (!email || !password || !invitation_token) {
      return res.status(400).json({ 
        error: 'email, password e invitation_token son requeridos' 
      });
    }

    // Decodificar el token si viene URL-encoded
    const decodedToken = decodeURIComponent(invitation_token);
    console.log('Token de registro original:', invitation_token);
    console.log('Token de registro decodificado:', decodedToken);

    // Primero validar la invitación
    const invitation = await validateInvitation(decodedToken);
    if (!invitation) {
      return res.status(400).json({ 
        error: 'Invitación no válida o expirada' 
      });
    }

    // Verificar que el email coincida con la invitación
    if (invitation.email !== email) {
      return res.status(400).json({ 
        error: 'El email debe coincidir con la invitación' 
      });
    }

    // Determinar el rol basado en la invitación
    const role = invitation.role?.name === 'tecnico' ? UserRole.TECNICO : 
                 invitation.role?.name === 'cfo' ? UserRole.CFO : UserRole.PROPIETARIO;

    const result = await signUpUserWithInvitation({ 
      email, 
      password, 
      fullName: full_name, 
      role,
      invitationToken: decodedToken
    });
    
    // Transformar la respuesta para que coincida con lo que espera el frontend
    return res.status(201).json({
      access_token: result.access_token,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.userProfile.fullName,
        role: {
          name: result.userProfile.role?.name ?? null
        }
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

/**
 * Validar invitación
 * GET /api/auth/validate-invitation/:token
 */
export const autoAcceptController = async (req: Request, res: Response) => {
  try {
    const { email, building } = req.query;
    
    if (!email || !building) {
      return res.status(400).json({ error: 'Email y building requeridos' });
    }

    const decodedEmail = decodeURIComponent(email as string);
    const buildingId = building as string;

    // Verificar que el usuario existe
    const userService = new UserService();
    const user = await userService.getUserByEmail(decodedEmail);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar que el edificio existe
    const buildingService = new BuildingService();
    const buildingData = await buildingService.getBuildingById(buildingId);
    
    if (!buildingData) {
      return res.status(404).json({ error: 'Edificio no encontrado' });
    }

    // Verificar si ya tiene acceso al edificio
    const hasAccess = await buildingService.userHasAccessToBuilding(user.userId, buildingId);
    
    if (hasAccess) {
      return res.status(200).json({
        success: true,
        message: 'Ya tienes acceso a este edificio',
        redirect: '/activos',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role?.name
        },
        building: {
          id: buildingData.id,
          name: buildingData.name,
          address: buildingData.address
        }
      });
    }

    // Solo validar y retornar información para que el usuario vaya al login
    return res.status(200).json({
      success: true,
      message: 'Invitación válida. Por favor, inicia sesión para completar la asignación.',
      redirect: '/login',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role?.name
      },
      building: {
        id: buildingData.id,
        name: buildingData.name,
        address: buildingData.address
      }
    });

  } catch (error) {
    console.error('Error en autoAcceptController:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const acceptAssignmentController = async (req: Request, res: Response) => {
  try {
    const { email, building } = req.query;
    
    if (!email || !building) {
      return res.status(400).json({ error: 'Email y building requeridos' });
    }

    const decodedEmail = decodeURIComponent(email as string);
    const buildingId = building as string;

    // Verificar que el usuario existe
    const userService = new UserService();
    const user = await userService.getUserByEmail(decodedEmail);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar que el edificio existe
    const buildingService = new BuildingService();
    const buildingData = await buildingService.getBuildingById(buildingId);
    
    if (!buildingData) {
      return res.status(404).json({ error: 'Edificio no encontrado' });
    }

    // Verificar si ya tiene acceso al edificio
    const hasAccess = await buildingService.userHasAccessToBuilding(user.userId, buildingId);
    
    if (hasAccess) {
      return res.status(200).json({
        success: true,
        message: 'Ya tienes acceso a este edificio',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role?.name
        },
        building: {
          id: buildingData.id,
          name: buildingData.name,
          address: buildingData.address
        }
      });
    }

    // Retornar información para que el frontend muestre la página de aceptación
    return res.status(200).json({
      success: true,
      message: 'Asignación pendiente de aceptación',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role?.name
      },
      building: {
        id: buildingData.id,
        name: buildingData.name,
        address: buildingData.address
      }
    });

  } catch (error) {
    console.error('Error en acceptAssignmentController:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const validateInvitationController = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ 
        error: 'Token de invitación requerido' 
      });
    }

    // Decodificar el token que viene URL-encoded
    const decodedToken = decodeURIComponent(token);
    console.log('Token original:', token);
    console.log('Token decodificado:', decodedToken);

    const invitation = await validateInvitation(decodedToken);
    
    if (!invitation) {
      return res.status(404).json({ 
        error: 'Invitación no encontrada o expirada' 
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Invitación ya fue utilizada o cancelada' 
      });
    }

    // Verificar que no haya expirado
    const now = new Date();
    const expiresAt = new Date(invitation.expiresAt);
    if (now > expiresAt) {
      return res.status(400).json({ 
        error: 'Invitación expirada' 
      });
    }

    return res.status(200).json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role?.name,
        buildingId: invitation.building?.id,
        buildingName: invitation.building?.name,
        invitedBy: invitation.invitedByUser?.fullName,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

/**
 * Endpoint inteligente para manejar invitaciones - determina si redirigir a login o register
 * GET /api/auth/invitation/:token
 */
export const smartInvitationController = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ error: 'Token de invitación requerido' });
    }

    // Decodificar el token que viene URL-encoded
    const decodedToken = decodeURIComponent(token);
    console.log('Token de invitación recibido:', decodedToken);

    // Validar la invitación
    const invitation = await validateInvitation(decodedToken);
    
    if (!invitation) {
      return res.status(404).json({ 
        error: 'Invitación no encontrada o expirada' 
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Invitación ya fue utilizada o cancelada' 
      });
    }

    // Verificar que no haya expirado
    const now = new Date();
    const expiresAt = new Date(invitation.expiresAt);
    if (now > expiresAt) {
      return res.status(400).json({ 
        error: 'Invitación expirada' 
      });
    }

    // Verificar si el usuario ya existe
    const userService = new UserService();
    const existingUser = await userService.getUserByEmail(invitation.email);
    
    if (existingUser) {
      // Usuario existe - redirigir a login con información de la invitación
      return res.status(200).json({
        success: true,
        userExists: true,
        redirect: '/login',
        message: 'Usuario encontrado. Por favor, inicia sesión para completar la invitación.',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role?.name,
          buildingId: invitation.building?.id,
          buildingName: invitation.building?.name,
          invitedBy: invitation.invitedByUser?.fullName,
          expiresAt: invitation.expiresAt
        }
      });
    } else {
      // Usuario no existe - redirigir a registro con información de la invitación
      return res.status(200).json({
        success: true,
        userExists: false,
        redirect: '/register',
        message: 'Por favor, regístrate para completar la invitación.',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role?.name,
          buildingId: invitation.building?.id,
          buildingName: invitation.building?.name,
          invitedBy: invitation.invitedByUser?.fullName,
          expiresAt: invitation.expiresAt
        }
      });
    }

  } catch (error) {
    console.error('Error en smartInvitationController:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Procesar asignaciones pendientes después del login
 * POST /api/auth/process-pending-assignments
 */
export const processPendingAssignmentsController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { email, buildingId } = req.body;
    
    if (!email || !buildingId) {
      return res.status(400).json({ error: 'Email y buildingId requeridos' });
    }

    // Verificar que el usuario existe y obtener su información
    const userService = new UserService();
    const user = await userService.getUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar que el edificio existe
    const buildingService = new BuildingService();
    const buildingData = await buildingService.getBuildingById(buildingId);
    
    if (!buildingData) {
      return res.status(404).json({ error: 'Edificio no encontrado' });
    }

    // Verificar si ya tiene acceso al edificio
    const hasAccess = await buildingService.userHasAccessToBuilding(user.userId, buildingId);
    
    if (hasAccess) {
      return res.status(200).json({
        success: true,
        message: 'Ya tienes acceso a este edificio',
        building: {
          id: buildingData.id,
          name: buildingData.name,
          address: buildingData.address
        }
      });
    }

    // Procesar la asignación
    try {
      // Obtener información completa del edificio incluyendo el propietario
      const { getSupabaseClient } = await import('../../lib/supabase');
      const supabase = getSupabaseClient();
      
      const { data: buildingWithOwner, error: buildingError } = await supabase
        .from('buildings')
        .select(`
          id,
          owner_id,
          owner:users!owner_id(
            id,
            user_id,
            email,
            full_name
          )
        `)
        .eq('id', buildingId)
        .single();

      if (buildingError || !buildingWithOwner) {
        throw new Error('No se pudo obtener información del edificio');
      }

      const buildingOwner = buildingWithOwner.owner;
      if (!buildingOwner) {
        throw new Error('No se pudo determinar el propietario del edificio');
      }

      const owner = buildingOwner;
      
      // Crear una asignación directa para el usuario existente
      const userRoleName = (user.role as any)?.name;
      if (userRoleName === 'tecnico') {
        // Para técnicos, crear la relación building-technician
        const ownerUserId = (owner as any)?.user_id;
        await buildingService.assignTechnicianToBuilding(buildingId, user.userId, ownerUserId);
      } else if (userRoleName === 'cfo') {
        // Para CFOs, crear la asignación CFO
        const ownerUserId = (owner as any)?.user_id;
        await buildingService.assignCfoToBuilding(buildingId, user.id, ownerUserId);
      }

      return res.status(200).json({
        success: true,
        message: 'Asignación procesada exitosamente',
        building: {
          id: buildingData.id,
          name: buildingData.name,
          address: buildingData.address
        }
      });
    } catch (assignmentError) {
      console.error('Error al procesar asignación:', assignmentError);
      return res.status(500).json({
        error: 'Error al procesar la asignación',
        message: assignmentError instanceof Error ? assignmentError.message : 'Error desconocido'
      });
    }

  } catch (error) {
    console.error('Error en processPendingAssignmentsController:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};


