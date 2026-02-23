import { ProcessingJobRecord } from '../lib/processingQueueFactory';

export type InvoiceJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type ProcessingJobType = 'invoice' | 'certificate';

export interface InvoiceProcessingJob extends ProcessingJobRecord {
  id: string;
  user_id: string;
  building_id: string;
  document_url: string;
  document_filename: string;
  status: InvoiceJobStatus;
  job_type?: ProcessingJobType;
  extracted_data?: Record<string, unknown> | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceJobInput {
  user_id: string;
  building_id: string;
  document_url: string;
  document_filename: string;
}

export interface InvoiceJobPayload {
  jobId: string;
}
