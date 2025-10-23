export enum BuildingTypology {
  RESIDENTIAL = 'residential',
  MIXED = 'mixed',
  COMMERCIAL = 'commercial'
}

export enum BuildingStatus {
  DRAFT = 'draft',
  READY_BOOK = 'ready_book',
  WITH_BOOK = 'with_book'
}

export interface BuildingImage {
  id: string;
  url: string;
  title: string;
  filename: string;
  isMain: boolean;
  uploadedAt: string;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  cadastralReference: string;
  constructionYear: number;
  typology: BuildingTypology;
  numFloors: number;
  numUnits: number;
  lat: number;
  lng: number;
  images: BuildingImage[];
  status: BuildingStatus;
  price?: number;
  technicianEmail?: string;
  cfoEmail?: string;
  ownerId?: string; // ID del usuario propietario
  
  // Nuevos campos financieros
  rehabilitationCost?: number; // Coste de Rehabilitación (por defecto 0)
  potentialValue?: number;     // Valor potencial (por defecto 0)
  
  // Metros cuadrados
  squareMeters?: number; // Superficie en metros cuadrados
  
  createdAt?: string;
  updatedAt?: string;
  userId?: string; // Mantener por compatibilidad temporal
}

// DTOs para requests
export interface CreateBuildingRequest {
  name: string;
  address: string;
  cadastralReference: string;
  constructionYear: number;
  typology: BuildingTypology;
  numFloors: number;
  numUnits: number;
  lat: number;
  lng: number;
  price?: number;
  technicianEmail?: string;
  cfoEmail?: string;
  propietarioEmail?: string;
  images?: BuildingImage[];
  
  // Nuevos campos financieros opcionales
  rehabilitationCost?: number; // Coste de Rehabilitación
  potentialValue?: number;     // Valor potencial
  squareMeters?: number;       // Superficie en metros cuadrados
}

export interface UpdateBuildingRequest extends Partial<CreateBuildingRequest> {
  status?: BuildingStatus;
}

// DTOs para gestión de imágenes
export interface UploadImagesRequest {
  images: BuildingImage[];
}

export interface SetMainImageRequest {
  imageId: string;
}

// DTOs para validación de asignaciones
export interface ValidateAssignmentsRequest {
  technicianEmail?: string;
  cfoEmail?: string;
  propietarioEmail?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: {
    technician?: string;
    cfo?: string;
    propietario?: string;
  };
}

export interface ValidateAssignmentsResponse {
  technicianValidation: ValidationResult;
  cfoValidation: ValidationResult;
  propietarioValidation?: ValidationResult;
  overallValid: boolean;
}
