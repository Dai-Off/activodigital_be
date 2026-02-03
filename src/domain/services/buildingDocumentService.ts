import { getSupabaseClient } from "../../lib/supabase";
import {
  BuildingDocument,
  CreateBuildingDocumentRequest,
  UpdateBuildingDocumentRequest,
} from "../../types/buildingDocument";

export class BuildingDocumentService {
  private getSupabase() {
    return getSupabaseClient();
  }

  async createBuildingDocument(
    data: CreateBuildingDocumentRequest,
    userAuthId: string
  ): Promise<BuildingDocument> {
    const documentData = {
      building_id: data.building_id,
      file_name: data.file_name,
      file_size: data.file_size,
      mime_type: data.mime_type,
      storage_bucket: data.storage_bucket || 'building-documents',
      storage_path: data.storage_path,
      storage_file_name: data.storage_file_name,
      category: data.category,
      expiration_date: data.expiration_date || null,
      uploaded_by: userAuthId,
    };

    const { data: document, error } = await this.getSupabase()
      .from("building_documents")
      .insert(documentData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear documento de edificio: ${error.message}`);
    }

    return this.mapToBuildingDocument(document);
  }

  async getBuildingDocumentsByBuilding(
    buildingId: string,
    category?: string
  ): Promise<BuildingDocument[]> {
    let query = this.getSupabase()
      .from("building_documents")
      .select("*")
      .eq("building_id", buildingId);

    if (category) {
      query = query.eq("category", category);
    }

    query = query.order("uploaded_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener documentos de edificio: ${error.message}`);
    }

    return (data || []).map((doc) => this.mapToBuildingDocument(doc));
  }

  async getBuildingDocumentById(
    documentId: string
  ): Promise<BuildingDocument | null> {
    const { data, error } = await this.getSupabase()
      .from("building_documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Documento no encontrado
      }
      throw new Error(`Error al obtener documento: ${error.message}`);
    }

    return this.mapToBuildingDocument(data);
  }

  async updateBuildingDocument(
    documentId: string,
    data: UpdateBuildingDocumentRequest,
    userAuthId: string
  ): Promise<BuildingDocument> {
    const updateData: any = {};

    if (data.expiration_date !== undefined) updateData.expiration_date = data.expiration_date;
    if (data.category !== undefined) updateData.category = data.category;

    const { data: document, error } = await this.getSupabase()
      .from("building_documents")
      .update(updateData)
      .eq("id", documentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar documento: ${error.message}`);
    }

    return this.mapToBuildingDocument(document);
  }

  async deleteBuildingDocument(
    documentId: string
  ): Promise<void> {
    const { error } = await this.getSupabase()
      .from("building_documents")
      .delete()
      .eq("id", documentId);

    if (error) {
      throw new Error(`Error al eliminar documento: ${error.message}`);
    }
  }

  private mapToBuildingDocument(dbDoc: any): BuildingDocument {
    return {
      id: dbDoc.id,
      building_id: dbDoc.building_id,
      file_name: dbDoc.file_name,
      file_size: dbDoc.file_size,
      mime_type: dbDoc.mime_type,
      storage_bucket: dbDoc.storage_bucket,
      storage_path: dbDoc.storage_path,
      storage_file_name: dbDoc.storage_file_name,
      category: dbDoc.category,
      expiration_date: dbDoc.expiration_date ? new Date(dbDoc.expiration_date).toISOString().split('T')[0] : null,
      uploaded_by: dbDoc.uploaded_by,
      uploaded_at: dbDoc.uploaded_at,
      created_at: dbDoc.created_at,
      updated_at: dbDoc.updated_at,
    };
  }
}

