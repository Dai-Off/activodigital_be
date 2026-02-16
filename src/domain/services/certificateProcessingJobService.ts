import { getSupabaseClient } from '../../lib/supabase';
import type {
  CertificateProcessingJob,
  CreateCertificateJobInput,
  CertificateJobStatus,
} from '../../types/certificateProcessingJob';

export class CertificateProcessingJobService {
  private getSupabase() {
    return getSupabaseClient();
  }

  private tableName = 'invoice_processing_jobs';

  async create(input: CreateCertificateJobInput): Promise<CertificateProcessingJob> {
    const { data, error } = await this.getSupabase()
      .from(this.tableName)
      .insert({
        user_id: input.user_id,
        building_id: input.building_id,
        document_url: input.image_url,
        document_filename: input.document_filename,
        status: 'queued',
        job_type: 'certificate',
        storage_path: input.storage_path ?? null,
        storage_file_name: input.storage_file_name ?? null,
        file_size: input.file_size ?? null,
        mime_type: input.mime_type ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(`Error al crear job de certificado: ${error.message}`);
    return this.mapRow(data);
  }

  async getById(id: string): Promise<CertificateProcessingJob | null> {
    const { data, error } = await this.getSupabase()
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .eq('job_type', 'certificate')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error al obtener job: ${error.message}`);
    }
    return this.mapRow(data);
  }

  async getByIdForUser(id: string, userId: string): Promise<CertificateProcessingJob | null> {
    const { data, error } = await this.getSupabase()
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('job_type', 'certificate')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error al obtener job: ${error.message}`);
    }
    return this.mapRow(data);
  }

  async setStatus(
    id: string,
    status: CertificateJobStatus,
    data?: { extracted_data?: Record<string, unknown>; error_message?: string }
  ): Promise<void> {
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (data?.extracted_data !== undefined) updates.extracted_data = data.extracted_data;
    if (data?.error_message !== undefined) updates.error_message = data.error_message;

    const { error } = await this.getSupabase()
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .eq('job_type', 'certificate');

    if (error) throw new Error(`Error al actualizar job: ${error.message}`);
  }

  private mapRow(row: any): CertificateProcessingJob {
    return {
      id: row.id,
      user_id: row.user_id,
      building_id: row.building_id,
      image_url: row.document_url,
      document_filename: row.document_filename,
      status: row.status,
      extracted_data: row.extracted_data ?? null,
      error_message: row.error_message ?? null,
      storage_path: row.storage_path ?? null,
      storage_file_name: row.storage_file_name ?? null,
      file_size: row.file_size ?? null,
      mime_type: row.mime_type ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
