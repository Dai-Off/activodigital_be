import { getSupabaseClient } from "../../lib/supabase";
import type {
  DataRoomProcessingJob,
  CreateDataRoomJobInput,
  DataRoomJobStatus,
} from "../../types/dataRoomProcessingJob";

export class DataRoomProcessingJobService {
  private getSupabase() {
    return getSupabaseClient();
  }

  async create(input: CreateDataRoomJobInput): Promise<DataRoomProcessingJob> {
    const { data, error } = await this.getSupabase()
      .from("data_room_processing_jobs")
      .insert({
        user_id: input.user_id,
        building_id: input.building_id,
        checklist_id: input.checklist_id,
        temp_storage_path: input.temp_storage_path,
        file_name: input.file_name,
        mime_type: input.mime_type,
        status: "queued",
      })
      .select()
      .single();

    if (error)
      throw new Error(`Error al crear job de Data Room: ${error.message}`);
    return this.mapRow(data);
  }

  async getById(id: string): Promise<DataRoomProcessingJob | null> {
    const { data, error } = await this.getSupabase()
      .from("data_room_processing_jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error al obtener job de Data Room: ${error.message}`);
    }
    return this.mapRow(data);
  }

  async setStatus(
    id: string,
    status: DataRoomJobStatus,
    data?: { error_message?: string },
  ): Promise<void> {
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (data?.error_message !== undefined)
      updates.error_message = data.error_message;

    const { error } = await this.getSupabase()
      .from("data_room_processing_jobs")
      .update(updates)
      .eq("id", id);

    if (error)
      throw new Error(`Error al actualizar estado del job: ${error.message}`);
  }

  /**
   * Actualiza el checklist_id de un job (usado tras la auto-clasificación por IA).
   */
  async setChecklistId(id: string, checklistId: string): Promise<void> {
    const { error } = await this.getSupabase()
      .from("data_room_processing_jobs")
      .update({
        checklist_id: checklistId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error)
      throw new Error(
        `Error al actualizar checklist_id del job: ${error.message}`,
      );
  }

  /**
   * Obtiene todos los jobs de un edificio, ordenados por fecha de creación descendente.
   */
  async getByBuildingId(buildingId: string): Promise<DataRoomProcessingJob[]> {
    const { data, error } = await this.getSupabase()
      .from("data_room_processing_jobs")
      .select("*")
      .eq("building_id", buildingId)
      .order("created_at", { ascending: false });

    if (error)
      throw new Error(`Error al obtener jobs del edificio: ${error.message}`);
    return (data || []).map((row: any) => this.mapRow(row));
  }

  private mapRow(row: any): DataRoomProcessingJob {
    return {
      id: row.id,
      user_id: row.user_id,
      building_id: row.building_id,
      checklist_id: row.checklist_id,
      temp_storage_path: row.temp_storage_path,
      file_name: row.file_name,
      mime_type: row.mime_type,
      status: row.status,
      error_message: row.error_message ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
