export enum BookSource {
  MANUAL = 'manual',
  PDF = 'pdf'
}

export enum BookStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETE = 'complete'
}

export enum SectionType {
  GENERAL_DATA = 'general_data',
  CONSTRUCTION_FEATURES = 'construction_features',
  CERTIFICATES_AND_LICENSES = 'certificates_and_licenses',
  MAINTENANCE_AND_CONSERVATION = 'maintenance_and_conservation',
  FACILITIES_AND_CONSUMPTION = 'facilities_and_consumption',
  RENOVATIONS_AND_REHABILITATIONS = 'renovations_and_rehabilitations',
  SUSTAINABILITY_AND_ESG = 'sustainability_and_esg',
  ANNEX_DOCUMENTS = 'annex_documents'
}

export interface BookSection {
  id: string;
  type: SectionType;
  complete: boolean;
  content: Record<string, any>; // Contenido flexible para cada sección
}

export interface DigitalBook {
  id: string;
  buildingId: string;
  source: BookSource;
  status: BookStatus;
  progress: number; // 0-8
  sections: BookSection[];
  createdAt?: string;
  updatedAt?: string;
}

// DTOs para requests
export interface CreateDigitalBookRequest {
  buildingId: string;
  source: BookSource;
  sections?: BookSection[];
}

export interface UpdateDigitalBookRequest {
  status?: BookStatus;
  progress?: number;
  sections?: BookSection[];
}

export interface UpdateSectionRequest {
  content: Record<string, any>;
  complete?: boolean;
}
