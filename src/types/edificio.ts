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
  isMain: boolean;
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
  ownerId?: string; // ID del usuario propietario (tenedor)
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
  images?: BuildingImage[];
}

export interface UpdateBuildingRequest extends Partial<CreateBuildingRequest> {
  status?: BuildingStatus;
}
