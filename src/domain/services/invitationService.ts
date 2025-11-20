import { getSupabaseClient } from '../../lib/supabase';
import { 
  Invitation, 
  CreateInvitationRequest, 
  AcceptInvitationRequest, 
  AcceptInvitationResponse,
  UserRole,
  BuildingCfoAssignment
} from '../../types/user';
import { Building } from '../../types/edificio';
import { UserService } from './userService';
import { EmailService } from './emailService';

export class InvitationService {
  private userService = new UserService();
  private emailService = new EmailService();

  private getSupabase() {
    return getSupabaseClient();
  }

  /**
   * Crea una invitación y envía el email
   */
  async createInvitation(data: CreateInvitationRequest, invitedByAuthId: string): Promise<Invitation> {
    // Todos los usuarios pueden enviar invitaciones
    const invitedByUser = await this.userService.getUserByAuthId(invitedByAuthId);
    if (!invitedByUser) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar que el email no esté ya registrado (solo para nuevas invitaciones)
    const existingUser = await this.userService.getUserByEmail(data.email);
    if (existingUser) {
      // Si el usuario existe, verificar que tenga el rol correcto
      if (existingUser.role.name !== data.role) {
        throw new Error(`El usuario existe pero tiene el rol ${existingUser.role.name}, no ${data.role}`);
      }
      // Si el usuario existe y tiene el rol correcto, continuar con la invitación
    }

    // Verificar que no haya una invitación pendiente para este email y edificio
    const existingInvitation = await this.getPendingInvitation(data.email, data.buildingId);
    if (existingInvitation) {
      throw new Error('Ya existe una invitación pendiente para este email en este edificio');
    }

    try {
      // Crear la invitación usando la función de la base de datos
      const { data: invitationId, error } = await this.getSupabase().rpc('create_invitation', {
        p_email: data.email,
        p_role_name: data.role,
        p_building_id: data.buildingId,
        p_invited_by: invitedByUser.id
      });

      if (error) {
        throw new Error(`Error al crear invitación: ${error.message}`);
      }

      // Obtener la invitación completa con relaciones
      const invitation = await this.getInvitationById(invitationId);
      if (!invitation) {
        console.error('Error: No se pudo obtener la invitación creada con ID:', invitationId);
        throw new Error('Error al obtener la invitación creada');
      }

      // Obtener información del edificio
      const building = await this.getBuildingForInvitation(data.buildingId);
      if (!building) {
        throw new Error('Edificio no encontrado');
      }

      // Enviar email de invitación
      console.log('🚀 InvitationService: Llamando a emailService.sendInvitationEmail...');
      console.log('📧 Email destino:', invitation.email);
      console.log('🏢 Building:', building.name);
      console.log('👤 Invitado por:', invitedByUser.fullName);
      
      await this.emailService.sendInvitationEmail(invitation, building, invitedByUser);
      
      console.log('✅ InvitationService: Email enviado exitosamente');

      return invitation;
    } catch (error) {
      console.error('Error en createInvitation:', error);
      throw error;
    }
  }

  /**
   * Acepta una invitación y crea el usuario
   */
  async acceptInvitation(data: AcceptInvitationRequest, userAuthId: string): Promise<AcceptInvitationResponse> {
    try {
      // Usar la función de la base de datos para aceptar la invitación
      const { data: result, error } = await this.getSupabase().rpc('accept_invitation', {
        p_token: data.token,
        p_user_id: userAuthId,
        p_full_name: data.fullName || null
      });

      if (error) {
        throw new Error(`Error al aceptar invitación: ${error.message}`);
      }

      // Obtener información del edificio para el email de bienvenida
      const building = await this.getBuildingForInvitation(result.building_id);
      if (building) {
        // Enviar email de bienvenida (no crítico, no lanzar error si falla)
        try {
          await this.emailService.sendWelcomeEmail(
            result.email,
            data.fullName || 'Usuario',
            result.role === 'tecnico' ? 'Técnico' : 
            result.role === 'cfo' ? 'CFO' : 'Propietario',
            building.name
          );
        } catch (emailError) {
          console.error('Error enviando email de bienvenida:', emailError);
        }
      }

      return result;
    } catch (error) {
      console.error('Error en acceptInvitation:', error);
      throw error;
    }
  }

  /**
   * Obtiene una invitación por token
   */
  async getInvitationByToken(token: string): Promise<Invitation | null> {
    const { data, error } = await this.getSupabase()
      .from('invitations')
      .select(`
        *,
        role:roles(*),
        building:buildings(id, name, address),
        invited_by_user:users!invited_by(*)
      `)
      .eq('token', token)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw new Error(`Error al obtener invitación: ${error.message}`);
    }

    return this.mapToInvitation(data);
  }

  /**
   * Obtiene una invitación por ID
   */
  async getInvitationById(id: string): Promise<Invitation | null> {
    try {
      const { data, error } = await this.getSupabase()
        .from('invitations')
        .select(`
          *,
          role:roles(*),
          building:buildings(id, name, address),
          invited_by_user:users!invited_by(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error obteniendo invitación por ID:', error);
        if (error.code === 'PGRST116') {
          return null; // No encontrado
        }
        throw new Error(`Error al obtener invitación: ${error.message}`);
      }

      return this.mapToInvitation(data);
    } catch (err) {
      console.error('Error en getInvitationById:', err);
      return null;
    }
  }

  /**
   * Obtiene invitaciones pendientes para un email y edificio
   */
  async getPendingInvitation(email: string, buildingId: string): Promise<Invitation | null> {
    const { data, error } = await this.getSupabase()
      .from('invitations')
      .select(`
        *,
        role:roles(*),
        building:buildings(id, name, address),
        invited_by_user:users!invited_by(*)
      `)
      .eq('email', email)
      .eq('building_id', buildingId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw new Error(`Error al obtener invitación pendiente: ${error.message}`);
    }

    return this.mapToInvitation(data);
  }

  /**
   * Obtiene todas las invitaciones enviadas por un usuario
   */
  async getInvitationsByUser(userAuthId: string): Promise<Invitation[]> {
    const user = await this.userService.getUserByAuthId(userAuthId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const { data, error } = await this.getSupabase()
      .from('invitations')
      .select(`
        *,
        role:roles(*),
        building:buildings(id, name, address),
        invited_by_user:users!invited_by(*)
      `)
      .eq('invited_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener invitaciones: ${error.message}`);
    }

    return data.map(this.mapToInvitation);
  }

  /**
   * Cancela una invitación
   */
  async cancelInvitation(invitationId: string, userAuthId: string): Promise<void> {
    const user = await this.userService.getUserByAuthId(userAuthId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const { error } = await this.getSupabase()
      .from('invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId)
      .eq('invited_by', user.id);

    if (error) {
      throw new Error(`Error al cancelar invitación: ${error.message}`);
    }
  }

  /**
   * Obtiene asignaciones CFO para un edificio
   */
  async getCfoAssignmentsForBuilding(buildingId: string): Promise<BuildingCfoAssignment[]> {
    const { data, error } = await this.getSupabase()
      .from('building_cfo_assignments')
      .select(`
        *,
        cfo:users!cfo_id(*),
        assigned_by_user:users!assigned_by(*)
      `)
      .eq('building_id', buildingId)
      .eq('status', 'active')
      .order('assigned_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener asignaciones CFO: ${error.message}`);
    }

    return data.map(this.mapToCfoAssignment);
  }

  /**
   * Obtiene asignaciones CFO para un usuario
   */
  async getCfoAssignmentsForUser(userAuthId: string): Promise<BuildingCfoAssignment[]> {
    const user = await this.userService.getUserByAuthId(userAuthId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const { data, error } = await this.getSupabase()
      .from('building_cfo_assignments')
      .select(`
        *,
        cfo:users!cfo_id(*),
        assigned_by_user:users!assigned_by(*)
      `)
      .eq('cfo_id', user.id)
      .eq('status', 'active')
      .order('assigned_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener asignaciones CFO: ${error.message}`);
    }

    return data.map(this.mapToCfoAssignment);
  }

  /**
   * Limpia invitaciones expiradas
   */
  async cleanupExpiredInvitations(): Promise<number> {
    const { data, error } = await this.getSupabase().rpc('cleanup_expired_invitations');
    
    if (error) {
      throw new Error(`Error al limpiar invitaciones expiradas: ${error.message}`);
    }

    return data || 0;
  }

  // Métodos auxiliares
  private async getBuildingForInvitation(buildingId: string): Promise<Building | null> {
    const { data, error } = await this.getSupabase()
      .from('buildings')
      .select('id, name, address')
      .eq('id', buildingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error al obtener edificio: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      address: data.address,
      cadastralReference: '',
      constructionYear: 0,
      typology: 'residential' as any,
      numFloors: 0,
      numUnits: 0,
      lat: 0,
      lng: 0,
      images: [],
      status: 'draft' as any
    };
  }

  private mapToInvitation(data: any): Invitation {
    return {
      id: data.id,
      email: data.email,
      roleId: data.role_id,
      buildingId: data.building_id,
      invitedBy: data.invited_by,
      token: data.token,
      status: data.status,
      expiresAt: data.expires_at,
      acceptedAt: data.accepted_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      role: data.role ? {
        id: data.role.id,
        name: data.role.name,
        description: data.role.description,
        createdAt: data.role.created_at,
        updatedAt: data.role.updated_at
      } : undefined,
      building: data.building ? {
        id: data.building.id,
        name: data.building.name,
        address: data.building.address
      } : undefined,
      invitedByUser: data.invited_by_user ? {
        id: data.invited_by_user.id,
        userId: data.invited_by_user.user_id,
        email: data.invited_by_user.email,
        fullName: data.invited_by_user.full_name,
        roleId: data.invited_by_user.role_id,
        createdAt: data.invited_by_user.created_at,
        updatedAt: data.invited_by_user.updated_at
      } : undefined
    };
  }

  private mapToCfoAssignment(data: any): BuildingCfoAssignment {
    return {
      id: data.id,
      buildingId: data.building_id,
      cfoId: data.cfo_id,
      assignedBy: data.assigned_by,
      assignedAt: data.assigned_at,
      status: data.status,
      cfo: data.cfo ? {
        id: data.cfo.id,
        userId: data.cfo.user_id,
        email: data.cfo.email,
        fullName: data.cfo.full_name,
        roleId: data.cfo.role_id,
        createdAt: data.cfo.created_at,
        updatedAt: data.cfo.updated_at
      } : undefined,
      assignedByUser: data.assigned_by_user ? {
        id: data.assigned_by_user.id,
        userId: data.assigned_by_user.user_id,
        email: data.assigned_by_user.email,
        fullName: data.assigned_by_user.full_name,
        roleId: data.assigned_by_user.role_id,
        createdAt: data.assigned_by_user.created_at,
        updatedAt: data.assigned_by_user.updated_at
      } : undefined
    };
  }
}
