import { getSupabaseClient } from '../../lib/supabase';
import { 
  Building, 
  CreateBuildingRequest, 
  UpdateBuildingRequest, 
  BuildingStatus,
  BuildingImage 
} from '../../types/edificio';

export class BuildingService {
  private getSupabase() {
    return getSupabaseClient();
  }

  async createBuilding(data: CreateBuildingRequest, userId: string): Promise<Building> {
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
      user_id: userId
    };

    const { data: building, error } = await this.getSupabase()
      .from('buildings')
      .insert(buildingData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear edificio: ${error.message}`);
    }

    return this.mapToBuilding(building);
  }

  async getBuildingById(id: string, userId?: string): Promise<Building | null> {
    let query = this.getSupabase()
      .from('buildings')
      .select('*')
      .eq('id', id);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw new Error(`Error al obtener edificio: ${error.message}`);
    }

    return this.mapToBuilding(data);
  }

  async getBuildingsByUser(userId: string): Promise<Building[]> {
    const { data, error } = await this.getSupabase()
      .from('buildings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener edificios: ${error.message}`);
    }

    return data.map(this.mapToBuilding);
  }

  async updateBuilding(id: string, data: UpdateBuildingRequest, userId: string): Promise<Building> {
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

    const { data: building, error } = await this.getSupabase()
      .from('buildings')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar edificio: ${error.message}`);
    }

    return this.mapToBuilding(building);
  }

  async deleteBuilding(id: string, userId: string): Promise<void> {
    const { error } = await this.getSupabase()
      .from('buildings')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error al eliminar edificio: ${error.message}`);
    }
  }

  async updateStatus(id: string, status: BuildingStatus, userId: string): Promise<Building> {
    return this.updateBuilding(id, { status }, userId);
  }

  async addImage(buildingId: string, image: BuildingImage, userId: string): Promise<Building> {
    // Primero obtenemos el edificio actual
    const building = await this.getBuildingById(buildingId, userId);
    if (!building) {
      throw new Error('Edificio no encontrado');
    }

    // Agregamos la nueva imagen
    const newImages = [...building.images, image];

    return this.updateBuilding(buildingId, { images: newImages }, userId);
  }

  async removeImage(buildingId: string, imageId: string, userId: string): Promise<Building> {
    // Primero obtenemos el edificio actual
    const building = await this.getBuildingById(buildingId, userId);
    if (!building) {
      throw new Error('Edificio no encontrado');
    }

    // Removemos la imagen
    const newImages = building.images.filter(img => img.id !== imageId);

    return this.updateBuilding(buildingId, { images: newImages }, userId);
  }

  async setMainImage(buildingId: string, imageId: string, userId: string): Promise<Building> {
    // Primero obtenemos el edificio actual
    const building = await this.getBuildingById(buildingId, userId);
    if (!building) {
      throw new Error('Edificio no encontrado');
    }

    // Actualizamos las imágenes para que solo una sea principal
    const newImages = building.images.map(img => ({
      ...img,
      isMain: img.id === imageId
    }));

    return this.updateBuilding(buildingId, { images: newImages }, userId);
  }

  // Método para verificar si un edificio tiene libro digital
  async hasDigitalBook(buildingId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.getSupabase()
      .from('digital_books')
      .select('id')
      .eq('building_id', buildingId)
      .eq('user_id', userId)
      .single();

    return !error && !!data;
  }

  // Método para obtener edificio con su libro digital
  async getBuildingWithBook(buildingId: string, userId: string): Promise<Building & { digitalBook?: any }> {
    const building = await this.getBuildingById(buildingId, userId);
    if (!building) {
      throw new Error('Edificio no encontrado');
    }

    // Obtener el libro digital asociado
    const { data: book } = await this.getSupabase()
      .from('digital_books')
      .select('*')
      .eq('building_id', buildingId)
      .eq('user_id', userId)
      .single();

    return {
      ...building,
      digitalBook: book || null
    };
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
      images: data.images || [],
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      userId: data.user_id
    };
  }
}
