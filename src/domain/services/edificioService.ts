import { getSupabaseClient } from '../../lib/supabase';
import { 
  Building, 
  CreateBuildingRequest, 
  UpdateBuildingRequest, 
  BuildingStatus,
  BuildingImage,
  ValidateAssignmentsResponse,
  ValidationResult
} from '../../types/edificio';
import { UserService } from './userService';
import { InvitationService } from './invitationService';
import { UserRole } from '../../types/user';

export class BuildingService {
  private userService = new UserService();
  private invitationService = new InvitationService();

  getSupabase() {
    return getSupabaseClient();
  }

  async createBuilding(data: CreateBuildingRequest, userAuthId: string): Promise<Building> {
    // Verificar que el usuario sea propietario
    const user = await this.userService.getUserByAuthId(userAuthId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    if (user.role.name !== UserRole.PROPIETARIO) {
      throw new Error('Solo los propietarios pueden crear edificios');
    }

    const buildingData = {
      name: data.name,
      address: data.address,
      cadastral_reference: data.cadastralReference,
      construction_year: data.constructionYear,
      typology: data.typology,
      num_floors: data.numFloors,
      num_units: data.numUnits,
      lat: data.lat,
      lng: data.lng,
      images: data.images || [],
      status: BuildingStatus.DRAFT,
      price: data.price,
      technician_email: data.technicianEmail,
      cfo_email: data.cfoEmail,
      owner_id: user.id,
      user_id: userAuthId, // Mantener por compatibilidad
      // Campos financieros con valores por defecto
      rehabilitation_cost: data.rehabilitationCost || 0,
      potential_value: data.potentialValue || 0
    };

    const { data: building, error } = await this.getSupabase()
      .from('buildings')
      .insert(buildingData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear edificio: ${error.message}`);
    }

    // Si se especificó un email de técnico, intentar asignarlo o enviar invitación
    if (data.technicianEmail) {
      try {
        await this.handleTechnicianAssignment(building.id, data.technicianEmail, userAuthId);
      } catch (error) {
        // Si falla la asignación/invitación, eliminar el edificio creado
        await this.getSupabase()
          .from('buildings')
          .delete()
          .eq('id', building.id);
        
        throw new Error(`Error al asignar técnico: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

    // Si se especificó un email de CFO, enviar invitación
    if (data.cfoEmail) {
      try {
        await this.handleCfoInvitation(building.id, data.cfoEmail, userAuthId);
      } catch (error) {
        // Si falla la invitación CFO, no eliminar el edificio (es menos crítico)
        throw new Error(`Error al invitar CFO: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

    return this.mapToBuilding(building);
  }

  async getBuildingById(id: string, userAuthId?: string): Promise<Building | null> {
    // Si se proporciona userAuthId, verificar acceso
    if (userAuthId) {
      const hasAccess = await this.userHasAccessToBuilding(userAuthId, id);
      if (!hasAccess) {
        return null; // Usuario no tiene acceso
      }
    }

    const { data, error } = await this.getSupabase()
      .from('buildings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw new Error(`Error al obtener edificio: ${error.message}`);
    }

    return this.mapToBuilding(data);
  }

  async getBuildingsByUser(userAuthId: string): Promise<Building[]> {
    const user = await this.userService.getUserByAuthId(userAuthId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    let query;
    if (user.role.name === UserRole.PROPIETARIO) {
      // Los propietarios ven sus propios edificios
      query = this.getSupabase()
        .from('buildings')
        .select('*')
        .eq('owner_id', user.id);
    } else if (user.role.name === UserRole.TECNICO) {
      // Los técnicos ven edificios asignados
      const assignedBuildingIds = await this.userService.getTechnicianBuildings(userAuthId);
      if (assignedBuildingIds.length === 0) {
        return []; // No tiene edificios asignados
      }
      
      query = this.getSupabase()
        .from('buildings')
        .select('*')
        .in('id', assignedBuildingIds);
    } else if (user.role.name === UserRole.CFO) {
      // Los CFOs ven edificios asignados
      const assignedBuildingIds = await this.userService.getCfoBuildings(userAuthId);
      if (assignedBuildingIds.length === 0) {
        return []; // No tiene edificios asignados
      }
      
      query = this.getSupabase()
        .from('buildings')
        .select('*')
        .in('id', assignedBuildingIds);
    } else {
      throw new Error('Rol no autorizado');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener edificios: ${error.message}`);
    }

    return data.map(this.mapToBuilding);
  }

  async updateBuilding(id: string, data: UpdateBuildingRequest, userAuthId: string): Promise<Building> {
    // Verificar que el usuario tenga permisos para actualizar el edificio
    const canUpdate = await this.userCanUpdateBuilding(userAuthId, id);
    if (!canUpdate) {
      throw new Error('No tienes permisos para actualizar este edificio');
    }

    // Mapear campos camelCase a snake_case
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.cadastralReference !== undefined) updateData.cadastral_reference = data.cadastralReference;
    if (data.constructionYear !== undefined) updateData.construction_year = data.constructionYear;
    if (data.typology !== undefined) updateData.typology = data.typology;
    if (data.numFloors !== undefined) updateData.num_floors = data.numFloors;
    if (data.numUnits !== undefined) updateData.num_units = data.numUnits;
    if (data.lat !== undefined) updateData.lat = data.lat;
    if (data.lng !== undefined) updateData.lng = data.lng;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.technicianEmail !== undefined) updateData.technician_email = data.technicianEmail;
    if (data.cfoEmail !== undefined) updateData.cfo_email = data.cfoEmail;
    // Campos financieros
    if (data.rehabilitationCost !== undefined) updateData.rehabilitation_cost = data.rehabilitationCost;
    if (data.potentialValue !== undefined) updateData.potential_value = data.potentialValue;

    const { data: building, error } = await this.getSupabase()
      .from('buildings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar edificio: ${error.message}`);
    }

    return this.mapToBuilding(building);
  }

  async deleteBuilding(id: string, userAuthId: string): Promise<void> {
    // Solo los propietarios pueden eliminar edificios
    const isOwner = await this.userService.isOwnerOfBuilding(userAuthId, id);
    if (!isOwner) {
      throw new Error('Solo el propietario puede eliminar el edificio');
    }

    const { error } = await this.getSupabase()
      .from('buildings')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar edificio: ${error.message}`);
    }
  }

  async updateStatus(id: string, status: BuildingStatus, userAuthId: string): Promise<Building> {
    return this.updateBuilding(id, { status }, userAuthId);
  }

  async addImage(buildingId: string, image: BuildingImage, userAuthId: string): Promise<Building> {
    // Primero obtenemos el edificio actual
    const building = await this.getBuildingById(buildingId, userAuthId);
    if (!building) {
      throw new Error('Edificio no encontrado');
    }

    // Agregamos la nueva imagen
    const newImages = [...building.images, image];

    return this.updateBuilding(buildingId, { images: newImages }, userAuthId);
  }

  async removeImage(buildingId: string, imageId: string, userAuthId: string): Promise<Building> {
    // Primero obtenemos el edificio actual
    const building = await this.getBuildingById(buildingId, userAuthId);
    if (!building) {
      throw new Error('Edificio no encontrado');
    }

    // Removemos la imagen
    const newImages = building.images.filter(img => img.id !== imageId);

    return this.updateBuilding(buildingId, { images: newImages }, userAuthId);
  }

  async setMainImage(buildingId: string, imageId: string, userAuthId: string): Promise<Building> {
    // Primero obtenemos el edificio actual
    const building = await this.getBuildingById(buildingId, userAuthId);
    if (!building) {
      throw new Error('Edificio no encontrado');
    }

    // Actualizamos las imágenes para que solo una sea principal
    const newImages = building.images.map(img => ({
      ...img,
      isMain: img.id === imageId
    }));

    return this.updateBuilding(buildingId, { images: newImages }, userAuthId);
  }

  // Método para verificar si un edificio tiene libro digital
  async hasDigitalBook(buildingId: string, userAuthId: string): Promise<boolean> {
    // Verificar acceso al edificio
    const hasAccess = await this.userHasAccessToBuilding(userAuthId, buildingId);
    if (!hasAccess) {
      return false;
    }

    const { data, error } = await this.getSupabase()
      .from('digital_books')
      .select('id')
      .eq('building_id', buildingId)
      .single();

    return !error && !!data;
  }

  // Método para obtener edificio con su libro digital
  async getBuildingWithBook(buildingId: string, userAuthId: string): Promise<Building & { digitalBook?: any }> {
    const building = await this.getBuildingById(buildingId, userAuthId);
    if (!building) {
      throw new Error('Edificio no encontrado');
    }

    // Obtener el libro digital asociado
    const { data: book } = await this.getSupabase()
      .from('digital_books')
      .select('*')
      .eq('building_id', buildingId)
      .single();

    return {
      ...building,
      digitalBook: book || null
    };
  }

  // Métodos auxiliares para verificar permisos
  public async userHasAccessToBuilding(userAuthId: string, buildingId: string): Promise<boolean> {
    const user = await this.userService.getUserByAuthId(userAuthId);
    if (!user) return false;

    if (user.role.name === UserRole.PROPIETARIO) {
      // Los propietarios tienen acceso a sus propios edificios
      return await this.userService.isOwnerOfBuilding(userAuthId, buildingId);
    } else if (user.role.name === UserRole.TECNICO) {
      // Los técnicos tienen acceso a edificios asignados
      return await this.userService.technicianHasAccessToBuilding(userAuthId, buildingId);
    } else if (user.role.name === UserRole.CFO) {
      // Los CFOs tienen acceso a edificios asignados
      return await this.cfoHasAccessToBuilding(userAuthId, buildingId);
    }

    return false;
  }

  private async userCanUpdateBuilding(userAuthId: string, buildingId: string): Promise<boolean> {
    const user = await this.userService.getUserByAuthId(userAuthId);
    if (!user) return false;

    if (user.role.name === UserRole.PROPIETARIO) {
      // Los propietarios pueden actualizar sus propios edificios
      return await this.userService.isOwnerOfBuilding(userAuthId, buildingId);
    } else if (user.role.name === UserRole.TECNICO) {
      // Los técnicos pueden actualizar solo algunos campos de edificios asignados
      return await this.userService.technicianHasAccessToBuilding(userAuthId, buildingId);
    } else if (user.role.name === UserRole.CFO) {
      // Los CFOs pueden actualizar campos financieros de edificios asignados
      return await this.cfoHasAccessToBuilding(userAuthId, buildingId);
    }

    return false;
  }

  /**
   * Maneja la asignación de técnico: si existe, lo asigna; si no, envía invitación
   */
  private async handleTechnicianAssignment(buildingId: string, technicianEmail: string, userAuthId: string): Promise<void> {
    console.log(`\n🔍 ASIGNACIÓN TÉCNICO - Email: ${technicianEmail} | Building: ${buildingId}`);
    
    // Primero verificar si el usuario ya existe
    const existingTechnician = await this.userService.getUserByEmail(technicianEmail);
    
    if (existingTechnician) {
      console.log(`✅ Usuario existe - Rol: ${existingTechnician.role.name} | ID: ${existingTechnician.id}`);
    } else {
      console.log(`❌ Usuario NO existe - Creando invitación de registro`);
    }
    
    if (existingTechnician) {
      // Si existe y es técnico, asignarlo directamente
      if (existingTechnician.role.name === UserRole.TECNICO) {
        console.log(`📧 Enviando EMAIL DE ASIGNACIÓN para técnico existente`);
        
        // Enviar email de notificación de asignación directamente
        const assignedByUser = await this.userService.getUserByAuthId(userAuthId);
        const building = await this.getBuildingById(buildingId);
        
        if (assignedByUser && building) {
          try {
            // PRIMERO: Crear la asignación en la base de datos
            console.log(`🏢 CREANDO ASIGNACIÓN en BD para técnico existente`);
            await this.assignTechnicianToBuilding(buildingId, existingTechnician.userId, userAuthId);
            console.log(`✅ ASIGNACIÓN CREADA en BD exitosamente`);
            
            // SEGUNDO: Enviar email de notificación
            console.log(`📧 Enviando EMAIL DE ASIGNACIÓN para técnico existente`);
            await this.sendAssignmentNotificationEmail(existingTechnician, building, assignedByUser);
            console.log(`✅ EMAIL DE ASIGNACIÓN enviado exitosamente`);
          } catch (error) {
            console.error(`❌ Error en asignación:`, error);
            throw error; // Re-lanzar el error para que se maneje apropiadamente
          }
        }
      } else {
        console.log('❌ User exists but is not a technician');
        throw new Error('El usuario existe pero no es un técnico');
      }
    } else {
      // Si no existe, enviar invitación
      console.log(`📧 Creando INVITACIÓN DE REGISTRO para usuario nuevo`);
      
      await this.invitationService.createInvitation({
        email: technicianEmail,
        role: UserRole.TECNICO,
        buildingId: buildingId
      }, userAuthId);
      
      console.log(`✅ INVITACIÓN DE REGISTRO creada exitosamente`);
    }
  }

  /**
   * Maneja la invitación de CFO
   */
  private async handleCfoInvitation(buildingId: string, cfoEmail: string, userAuthId: string): Promise<void> {
    // Verificar si el usuario ya existe
    const existingCfo = await this.userService.getUserByEmail(cfoEmail);
    
    if (existingCfo) {
      // Si existe y es CFO, asignarlo directamente
      if (existingCfo.role.name === UserRole.CFO) {
        await this.assignCfoToBuilding(buildingId, existingCfo.id, userAuthId);
      } else {
        throw new Error('El usuario existe pero no es un CFO');
      }
    } else {
      // Si no existe, enviar invitación
      await this.invitationService.createInvitation({
        email: cfoEmail,
        role: UserRole.CFO,
        buildingId: buildingId
      }, userAuthId);
    }
  }

  /**
   * Obtiene el propietario de un edificio
   */
  async getBuildingOwner(buildingId: string): Promise<any> {
    const { data, error } = await this.getSupabase()
      .from('buildings')
      .select(`
        id,
        owner:users!owner_id(
          id,
          user_id,
          email,
          full_name,
          role_id
        )
      `)
      .eq('id', buildingId)
      .single();

    if (error || !data) {
      throw new Error('Edificio no encontrado');
    }

    return data.owner;
  }

  /**
   * Verifica si un CFO tiene acceso a un edificio
   */
  private async cfoHasAccessToBuilding(cfoAuthId: string, buildingId: string): Promise<boolean> {
    const user = await this.userService.getUserByAuthId(cfoAuthId);
    if (!user) return false;

    const { data, error } = await this.getSupabase()
      .from('building_cfo_assignments')
      .select('id')
      .eq('building_id', buildingId)
      .eq('cfo_id', user.id)
      .eq('status', 'active')
      .single();

    return !error && !!data;
  }

  /**
   * Asigna un técnico a un edificio
   */
  async assignTechnicianToBuilding(buildingId: string, technicianAuthId: string, assignedByUserId: string): Promise<void> {
    const technician = await this.userService.getUserByAuthId(technicianAuthId);
    if (!technician) {
      throw new Error('Técnico no encontrado');
    }

    if (technician.role.name !== UserRole.TECNICO) {
      throw new Error('El usuario no es un técnico');
    }

    // Verificar que el técnico no esté ya asignado a este edificio
    const existingAssignment = await this.getSupabase()
      .from('building_technician_assignments')
      .select('id')
      .eq('building_id', buildingId)
      .eq('technician_id', technician.id)
      .eq('status', 'active')
      .single();

    if (existingAssignment.data) {
      throw new Error('El técnico ya está asignado a este edificio');
    }

    const assignedByUser = await this.userService.getUserByAuthId(assignedByUserId);
    if (!assignedByUser) {
      throw new Error('Usuario asignador no encontrado');
    }

    const assignmentData = {
      building_id: buildingId,
      technician_id: technician.id,
      assigned_by: assignedByUser.id,
      status: 'active'
    };

    const { error } = await this.getSupabase()
      .from('building_technician_assignments')
      .insert(assignmentData);

    if (error) {
      throw new Error(`Error al asignar técnico: ${error.message}`);
    }
  }

  /**
   * Asigna un CFO a un edificio
   */
  async assignCfoToBuilding(buildingId: string, cfoId: string, assignedByUserId: string): Promise<void> {
    const assignedByUser = await this.userService.getUserByAuthId(assignedByUserId);
    if (!assignedByUser) {
      throw new Error('Usuario asignador no encontrado');
    }

    const assignmentData = {
      building_id: buildingId,
      cfo_id: cfoId,
      assigned_by: assignedByUser.id,
      status: 'active'
    };

    const { error } = await this.getSupabase()
      .from('building_cfo_assignments')
      .insert(assignmentData);

    if (error) {
      throw new Error(`Error al asignar CFO: ${error.message}`);
    }
  }

  /**
   * Envía un email de notificación cuando se asigna un técnico existente a un nuevo edificio
   */
  private async sendAssignmentNotificationEmail(technician: any, building: Building, assignedByUser: any): Promise<void> {
    const emailService = new (await import('./emailService')).EmailService();
    
    // Usar el método de notificación de asignación
    await emailService.sendAssignmentNotificationEmail(technician, building, assignedByUser);
  }

  /**
   * Valida las asignaciones de técnico y CFO antes de crear el edificio
   */
  async validateUserAssignments(
    technicianEmail?: string, 
    cfoEmail?: string, 
    userAuthId?: string
  ): Promise<ValidateAssignmentsResponse> {
    const technicianValidation: ValidationResult = { isValid: true, errors: {} };
    const cfoValidation: ValidationResult = { isValid: true, errors: {} };

    // Validar técnico si se proporciona
    if (technicianEmail) {
      const technicianResult = await this.validateTechnicianEmail(technicianEmail, cfoEmail);
      if (!technicianResult.isValid) {
        technicianValidation.isValid = false;
        technicianValidation.errors.technician = technicianResult.error;
      }
    }

    // Validar CFO si se proporciona
    if (cfoEmail) {
      const cfoResult = await this.validateCfoEmail(cfoEmail, technicianEmail);
      if (!cfoResult.isValid) {
        cfoValidation.isValid = false;
        cfoValidation.errors.cfo = cfoResult.error;
      }
    }

    const overallValid = technicianValidation.isValid && cfoValidation.isValid;

    return {
      technicianValidation,
      cfoValidation,
      overallValid
    };
  }

  /**
   * Valida si un email de técnico es válido para asignación
   */
  private async validateTechnicianEmail(technicianEmail: string, cfoEmail?: string): Promise<{ isValid: boolean; error?: string }> {
    // Verificar si el email ya existe
    const existingUser = await this.userService.getUserByEmail(technicianEmail);
    
    if (existingUser) {
      // Si existe, verificar el rol
      if (existingUser.role.name === UserRole.PROPIETARIO) {
        return { 
          isValid: false, 
          error: 'Este email corresponde a un usuario propietario. Los propietarios no pueden ser asignados como técnicos.' 
        };
      }
      
      if (existingUser.role.name === UserRole.CFO) {
        return { 
          isValid: false, 
          error: 'Este email corresponde a un usuario CFO. Un usuario no puede tener roles múltiples (CFO y técnico).' 
        };
      }
      
      if (existingUser.role.name === UserRole.TECNICO) {
        // Es técnico válido
        return { isValid: true };
      }
      
      if (existingUser.role.name === UserRole.ADMINISTRADOR) {
        return { 
          isValid: false, 
          error: 'Este email corresponde a un usuario administrador. Los administradores no pueden ser asignados como técnicos.' 
        };
      }
    }

    // Si no existe, es válido (se enviará invitación)
    return { isValid: true };
  }

  /**
   * Valida si un email de CFO es válido para asignación
   */
  private async validateCfoEmail(cfoEmail: string, technicianEmail?: string): Promise<{ isValid: boolean; error?: string }> {
    // Verificar si es el mismo email que el técnico
    if (technicianEmail && cfoEmail === technicianEmail) {
      return { 
        isValid: false, 
        error: 'El CFO y el técnico no pueden ser la misma persona.' 
      };
    }

    // Verificar si el email ya existe
    const existingUser = await this.userService.getUserByEmail(cfoEmail);
    
    if (existingUser) {
      // Si existe, verificar el rol
      if (existingUser.role.name === UserRole.PROPIETARIO) {
        return { 
          isValid: false, 
          error: 'Este email corresponde a un usuario propietario. Los propietarios no pueden ser asignados como CFO.' 
        };
      }
      
      if (existingUser.role.name === UserRole.TECNICO) {
        return { 
          isValid: false, 
          error: 'Este email corresponde a un usuario técnico. Un usuario no puede tener roles múltiples (técnico y CFO).' 
        };
      }
      
      if (existingUser.role.name === UserRole.CFO) {
        // Es CFO válido
        return { isValid: true };
      }
      
      if (existingUser.role.name === UserRole.ADMINISTRADOR) {
        return { 
          isValid: false, 
          error: 'Este email corresponde a un usuario administrador. Los administradores no pueden ser asignados como CFO.' 
        };
      }
    }

    // Si no existe, es válido (se enviará invitación)
    return { isValid: true };
  }

  private mapToBuilding(data: any): Building {
    return {
      id: data.id,
      name: data.name,
      address: data.address,
      cadastralReference: data.cadastral_reference || data.cadastralReference,
      constructionYear: data.construction_year || data.constructionYear,
      typology: data.typology,
      numFloors: data.num_floors || data.numFloors,
      numUnits: data.num_units || data.numUnits,
      lat: data.lat,
      lng: data.lng,
      images: (data.images || []).map((img: any) => ({
        id: img.id,
        url: img.url,
        title: img.title,
        filename: img.filename || img.title,
        isMain: img.isMain,
        uploadedAt: img.uploadedAt || new Date().toISOString()
      })),
      status: data.status,
      price: data.price,
      technicianEmail: data.technician_email,
      cfoEmail: data.cfo_email,
      ownerId: data.owner_id,
      // Campos financieros
      rehabilitationCost: data.rehabilitation_cost || 0,
      potentialValue: data.potential_value || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      userId: data.user_id // Mantener por compatibilidad
    };
  }
}
