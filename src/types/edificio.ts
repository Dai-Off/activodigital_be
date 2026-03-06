export enum BuildingTypology {
  RESIDENTIAL = "residential",
  MIXED = "mixed",
  COMMERCIAL = "commercial",
}

export enum BuildingStatus {
  DRAFT = "draft",
  READY_BOOK = "ready_book",
  WITH_BOOK = "with_book",
}

export interface BuildingImage {
  id: string;
  url: string;
  title: string;
  filename: string;
  isMain: boolean;
  uploadedAt: string;
}

// Dirección estructurada del edificio. Este JSON se guarda en la columna address_data.
export interface BuildingAddressData {
  /** Dirección completa legible (por ejemplo, para mostrar en UI) */
  fullAddress: string;
  /** Provincia (ej: "Madrid") */
  province?: string;
  /** Municipio o ciudad (ej: "Madrid") */
  municipality?: string;
  /** Tipo de vía (ej: "Calle", "Avenida") */
  streetType?: string;
  /** Nombre de la vía (ej: "Gran Vía") */
  streetName?: string;
  /** Número de portal */
  number?: string;
  /** Escalera */
  stair?: string;
  /** Planta */
  floor?: string;
  /** Puerta */
  door?: string;
  /** Código postal */
  postalCode?: string;
  /** País (ej: "España") */
  country?: string;
  /** Campo libre para datos adicionales o raw del proveedor (Catastro, Nominatim, etc.) */
  extra?: Record<string, any>;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  // JSON estructurado con los datos de dirección (tabla buildings.address_data)
  addressData?: BuildingAddressData;
  cadastralReference?: string;
  constructionYear: number;
  typology: BuildingTypology;
  numFloors: number;
  numUnits?: number;
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
  potentialValue?: number; // Valor potencial (por defecto 0)

  // Metros cuadrados
  squareMeters?: number; // Superficie en metros cuadrados

  createdAt?: string;
  updatedAt?: string;
  userId?: string; // Mantener por compatibilidad temporal
  porcentBook?: number;
  deleted?: boolean;
  customData?: Record<string, any>;
}

export interface BuildingUnit {
  id: string;
  buildingId: string;
  name: string | null;
  identifier?: string | null;
  floor?: string | null;
  areaM2?: number | null;
  useType?: string | null;
  status?: string | null;
  rent?: number | null;
  tenant?: string | null;
  rooms?: number | null;
  baths?: number | null;
  rawData?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBuildingUnitRequest {
  id?: string;
  name: string | null;
  identifier?: string | null;
  floor?: string | null;
  areaM2?: number | null;
  useType?: string | null;
  status?: string | null;
  rent?: number | null;
  tenant?: string | null;
  rooms?: number | null;
  baths?: number | null;
  rawData?: any;
}

// DTOs para requests
export interface CreateBuildingRequest {
  name: string;
  address: string;
  // Dirección estructurada opcional al crear edificio
  addressData?: BuildingAddressData;
  cadastralReference?: string;
  constructionYear: number;
  typology: BuildingTypology;
  numFloors: number;
  numUnits?: number;
  lat: number;
  lng: number;
  price?: number;
  technicianEmail?: string;
  cfoEmail?: string;
  propietarioEmail?: string;
  images?: BuildingImage[];

  // Nuevos campos financieros opcionales
  rehabilitationCost?: number; // Coste de Rehabilitación
  potentialValue?: number; // Valor potencial
  squareMeters?: number; // Superficie en metros cuadrados
  customData?: Record<string, any>;
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
