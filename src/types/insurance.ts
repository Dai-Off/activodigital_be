// types/insurance.ts

export interface InsurancePolicy {
  id: string;
  buildingId: string;
  policyNumber: string;
  status: "active" | "expired" | "canceled" | "pending"; // Puedes ampliar esto
  coverageType: string;
  insurer: string; // O insurerId si usas la tabla relacional
  issueDate: string; // ISO Date string
  expirationDate: string; // ISO Date string
  coverageDetails: any; // jsonb en la DB, any o interfaz específica aquí
  annualPremium: number;
  documentUrl?: string;
  createdAt: string;
}

export interface CreateInsuranceRequest {
  buildingId: string;
  policyNumber: string;
  status: string;
  coverageType: string;
  insurer: string;
  issueDate: string;
  expirationDate: string;
  coverageDetails: any;
  annualPremium: number;
  documentUrl?: string;
}

export interface UpdateInsuranceRequest
  extends Partial<CreateInsuranceRequest> {}

export interface InsuranceFilters {
  status?: string;
  limit?: number;
  offset?: number;
}
