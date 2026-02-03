// Types para documentos de gestión de edificios (simplificado)

export interface BuildingDocument {
  id: string;
  building_id: string;
  
  // Información del archivo
  file_name: string;
  file_size: number; // bytes
  mime_type: string;
  
  // Información de almacenamiento
  storage_bucket: string;
  storage_path: string;
  storage_file_name: string;
  
  // Categorización
  category: string; // Valor: financial, contracts, maintenance, etc.
  
  // Vencimiento (campo principal para el cronjob)
  expiration_date?: string | null; // ISO date YYYY-MM-DD
  
  // Audit
  uploaded_by?: string | null;
  uploaded_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBuildingDocumentRequest {
  building_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_bucket?: string;
  storage_path: string;
  storage_file_name: string;
  category: string;
  expiration_date?: string | null;
  uploaded_by?: string | null;
}

export interface UpdateBuildingDocumentRequest {
  expiration_date?: string | null;
  category?: string;
}

