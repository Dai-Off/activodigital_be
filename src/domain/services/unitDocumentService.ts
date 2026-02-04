import { getSupabaseClient } from "../../lib/supabase";
import {
  UnitDocument,
  CreateUnitDocumentRequest,
  UpdateUnitDocumentRequest,
} from "../../types/unitDocument";

export class UnitDocumentService {
  private getSupabase() {
    return getSupabaseClient();
  }

  async createUnitDocument(
    data: CreateUnitDocumentRequest,
    userAuthId: string
  ): Promise<UnitDocument> {
    const documentData = {
      building_id: data.building_id,
      unit_id: data.unit_id,
      file_name: data.file_name,
      file_size: data.file_size,
      mime_type: data.mime_type,
      storage_bucket: data.storage_bucket || 'unit-documents',
      storage_path: data.storage_path,
      storage_file_name: data.storage_file_name,
      category: data.category,
      expiration_date: data.expiration_date || null,
      uploaded_by: userAuthId,
    };

    const { data: document, error } = await this.getSupabase()
      .from("unit_documents")
      .insert(documentData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear documento de unidad: ${error.message}`);
    }

    return this.mapToUnitDocument(document);
  }

  async getUnitDocumentsByUnit(
    buildingId: string,
    unitId: string,
    category?: string
  ): Promise<UnitDocument[]> {
    let query = this.getSupabase()
      .from("unit_documents")
      .select("*")
      .eq("building_id", buildingId)
      .eq("unit_id", unitId);

    if (category) {
      query = query.eq("category", category);
    }

    query = query.order("uploaded_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener documentos de unidad: ${error.message}`);
    }

    return (data || []).map((doc) => this.mapToUnitDocument(doc));
  }

  async getUnitDocumentById(
    documentId: string
  ): Promise<UnitDocument | null> {
    const { data, error } = await this.getSupabase()
      .from("unit_documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Documento no encontrado
      }
      throw new Error(`Error al obtener documento: ${error.message}`);
    }

    return this.mapToUnitDocument(data);
  }

  async updateUnitDocument(
    documentId: string,
    data: UpdateUnitDocumentRequest,
    userAuthId: string
  ): Promise<UnitDocument> {
    const updateData: any = {};

    if (data.expiration_date !== undefined) updateData.expiration_date = data.expiration_date;
    if (data.category !== undefined) updateData.category = data.category;

    const { data: document, error } = await this.getSupabase()
      .from("unit_documents")
      .update(updateData)
      .eq("id", documentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar documento: ${error.message}`);
    }

    return this.mapToUnitDocument(document);
  }

  async deleteUnitDocument(
    documentId: string
  ): Promise<void> {
    const { error } = await this.getSupabase()
      .from("unit_documents")
      .delete()
      .eq("id", documentId);

    if (error) {
      throw new Error(`Error al eliminar documento: ${error.message}`);
    }
  }

  private mapToUnitDocument(dbDoc: any): UnitDocument {
    return {
      id: dbDoc.id,
      building_id: dbDoc.building_id,
      unit_id: dbDoc.unit_id,
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

