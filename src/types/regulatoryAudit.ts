export type MevStatus = 'implementada' | 'parcial' | 'no_implementada';

export interface RegulatoryMev {
  id: string;
  code: string;
  title: string;
  description: string;
  status: MevStatus;
  current_state: string;
  potential_savings?: string;
  achieved_savings?: string;
  potential_co2_reduction?: string;
  achieved_co2_reduction?: string;
}

export interface RegulatoryCurrentState {
  energy_class: string;
  consumption_kwh_m2_year: number;
  emissions_kg_co2_m2_year: number;
  heating_demand?: number;
  cooling_demand?: number;
}

export interface RegulatoryTargetState {
  target_class: string;
  target_consumption: number;
  target_emissions: number;
}

export interface RegulatoryAuditSummary {
  normatives_compliant: number;
  normatives_total: number;
  mevs_implemented: number;
  mevs_total: number;
  certificates_active: number;
  certificates_total: number;
  pending_audits_count: number;
  pending_audits_text: string;
  mevs_partial: number;
  mevs_pending: number;
  total_potential_savings: string;
  total_potential_co2_reduction: string;
}

export interface RegulatoryCertificate {
  id: string;
  title: string;
  status: 'valid' | 'missing' | 'expired';
  description: string;
  uploaded_at?: string;
}

export interface RegulatoryNormative {
  id: string;
  title: string;
  description: string;
  status: 'compliant' | 'partial' | 'non_compliant';
  law_reference: string;
}

export interface RegulatoryAuditResult {
  buildingId: string;
  current_state: RegulatoryCurrentState;
  target_state: RegulatoryTargetState;
  gap_analysis: {
    consumption_gap: number;
    consumption_progress_percent: number;
    emissions_gap: number;
    emissions_progress_percent: number;
  };
  mevs: RegulatoryMev[];
  certificates: RegulatoryCertificate[];
  normatives: RegulatoryNormative[];
  summary: RegulatoryAuditSummary;
  calculatedAt: string;
}
