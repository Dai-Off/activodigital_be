import { ProcessingJobRecord } from "./processing";

export type DataRoomJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'rejected';

export interface DataRoomProcessingJob extends ProcessingJobRecord {
  id: string;
  user_id: string;
  building_id: string;
  checklist_id: string;
  temp_storage_path: string;
  status: DataRoomJobStatus;
  file_name: string;
  mime_type: string;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDataRoomJobInput {
  user_id: string;
  building_id: string;
  checklist_id: string;
  temp_storage_path: string;
  file_name: string;
  mime_type: string;
}
