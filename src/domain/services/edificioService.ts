import { getSupabaseClient } from '../../lib/supabase';
import { 
  Building, 
  CreateBuildingRequest, 
  UpdateBuildingRequest, 
  BuildingStatus,
  BuildingImage 
} from '../../types/edificio';
import { UserService } from './userService';
import { UserRole } from '../../types/user';

export class BuildingService {
  private userService = new UserService();

  private getSupabase() {
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

    // Si se especificó un email de técnico, asignarlo al edificio
    if (data.technicianEmail) {
      try {
        await this.userService.assignTechnicianToBuilding(
          building.id,
          data.technicianEmail,
          userAuthId
        );
      } catch (error) {
        // Si falla la asignación, eliminar el edificio creado
        await this.getSupabase()
          .from('buildings')
          .delete()
          .eq('id', building.id);
        
        throw new Error(`Error al asignar técnico: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
  private async userHasAccessToBuilding(userAuthId: string, buildingId: string): Promise<boolean> {
    const user = await this.userService.getUserByAuthId(userAuthId);
    if (!user) return false;

    if (user.role.name === UserRole.PROPIETARIO) {
      // Los propietarios tienen acceso a sus propios edificios
      return await this.userService.isOwnerOfBuilding(userAuthId, buildingId);
    } else if (user.role.name === UserRole.TECNICO) {
      // Los técnicos tienen acceso a edificios asignados
      return await this.userService.technicianHasAccessToBuilding(userAuthId, buildingId);
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
    }

    return false;
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
