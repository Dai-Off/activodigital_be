// Tipos para Certificados Energéticos

export enum EnergyCertificateKind {
  BUILDING = 'building',
  DWELLING = 'dwelling',
  COMMERCIAL_UNIT = 'commercial_unit'
}

export enum EnergyRatingLetter {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G',
  ND = 'ND'
}

export enum AIExtractionStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  EXTRACTED = 'extracted',
  REVIEWED = 'reviewed',
  CONFIRMED = 'confirmed',
  FAILED = 'failed'
}

// Documento de certificado energético
export interface EnergyCertificateDocument {
  id: string;
  buildingId: string;
  kind: EnergyCertificateKind;
  filename: string;
  url: string;
  mimeType: string;
  uploadedAt: string; // Se almacena como string pero se puede convertir a Date
  userId: string;
}

// Datos extraídos por IA
export interface AIExtractedEnergyCertificateData {
  rating: {
    value: EnergyRatingLetter | null;
    confidence: number;
    source?: string;
    suggestions?: EnergyRatingLetter[];
  };
  primaryEnergyKwhPerM2Year: {
    value: number | null;
    confidence: number;
    source?: string;
    suggestions?: number[];
  };
  emissionsKgCo2PerM2Year: {
    value: number | null;
    confidence: number;
    source?: string;
    suggestions?: number[];
  };
  certificateNumber: {
    value: string | null;
    confidence: number;
    source?: string;
    suggestions?: string[];
  };
  scope: {
    value: EnergyCertificateKind | null;
    confidence: number;
    source?: string;
    suggestions?: EnergyCertificateKind[];
  };
  issuerName: {
    value: string | null;
    confidence: number;
    source?: string;
    suggestions?: string[];
  };
  issueDate: {
    value: string | null;
    confidence: number;
    source?: string;
    suggestions?: string[];
  };
  expiryDate: {
    value: string | null;
    confidence: number;
    source?: string;
    suggestions?: string[];
  };
  propertyReference: {
    value: string | null;
    confidence: number;
    source?: string;
    suggestions?: string[];
  };
  notes?: {
    value: string | null;
    confidence: number;
    source?: string;
    suggestions?: string[];
  };
}

// Datos editables por el técnico
export interface EnergyCertificateReviewData {
  rating?: EnergyRatingLetter;
  primaryEnergyKwhPerM2Year?: number;
  emissionsKgCo2PerM2Year?: number;
  certificateNumber?: string;
  scope?: EnergyCertificateKind;
  issuerName?: string;
  issueDate?: string; // ISO date
  expiryDate?: string; // ISO date
  propertyReference?: string;
  notes?: string;
}

// Sesión de subida de certificado energético
export interface EnergyCertificateSession {
  id: string;
  buildingId: string;
  kind: EnergyCertificateKind;
  status: AIExtractionStatus;
  documents: string[]; // Array de IDs de documentos
  extractedData?: AIExtractedEnergyCertificateData;
  editedData?: EnergyCertificateReviewData;
  reviewerUserId?: string;
  errorMessage?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Certificado energético confirmado
export interface EnergyCertificate {
  id: string;
  buildingId: string;
  kind: EnergyCertificateKind;
  rating: EnergyRatingLetter;
  primaryEnergyKwhPerM2Year: number;
  emissionsKgCo2PerM2Year: number;
  certificateNumber: string;
  scope: EnergyCertificateKind;
  issuerName: string;
  issueDate: string; // ISO date
  expiryDate: string; // ISO date
  propertyReference?: string;
  notes?: string;
  sourceDocumentUrl?: string; // URL del documento original del certificado
  sourceSessionId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// DTOs para requests

export interface CreateEnergyCertificateSessionRequest {
  buildingId: string;
  kind: EnergyCertificateKind;
  documents: Omit<EnergyCertificateDocument, 'id' | 'userId'>[];
}

export interface UpdateEnergyCertificateSessionRequest {
  status?: AIExtractionStatus;
  extractedData?: AIExtractedEnergyCertificateData;
  editedData?: EnergyCertificateReviewData;
  errorMessage?: string;
}

export interface ConfirmEnergyCertificateRequest {
  sessionId: string;
  finalData: EnergyCertificateReviewData;
}

export interface GetEnergyCertificatesResponse {
  sessions: EnergyCertificateSession[];
  certificates: EnergyCertificate[];
}
