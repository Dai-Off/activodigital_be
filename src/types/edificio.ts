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
  ownerId?: string; // ID del usuario propietario (tenedor)
  
  // Nuevos campos financieros
  rehabilitationCost?: number; // Coste de Rehabilitación (por defecto 0)
  potentialValue?: number;     // Valor potencial (por defecto 0)
  
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
  images?: BuildingImage[];
  
  // Nuevos campos financieros opcionales
  rehabilitationCost?: number; // Coste de Rehabilitación
  potentialValue?: number;     // Valor potencial
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
