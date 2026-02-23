import type { ProcessingJobRecord } from './processing';

export type CertificateJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface CertificateProcessingJob extends ProcessingJobRecord {
  id: string;
  user_id: string;
  building_id: string;
  image_url: string;
  document_filename: string;
  status: CertificateJobStatus;
  extracted_data?: Record<string, unknown> | null;
  error_message?: string | null;
  storage_path?: string | null;
  storage_file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCertificateJobInput {
  user_id: string;
  building_id: string;
  image_url: string;
  document_filename: string;
  storage_path?: string;
  storage_file_name?: string;
  file_size?: number;
  mime_type?: string;
}

export interface CertificateJobPayload {
  jobId: string;
}
