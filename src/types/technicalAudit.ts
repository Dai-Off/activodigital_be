// Tipos para la auditoría técnica de edificios

import { EsgResult } from '../domain/services/esgService';

export interface TechnicalTask {
  id: string;
  category: 'maintenance' | 'safety' | 'energy' | 'documentation' | 'compliance';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  relatedData?: string; // Campo relacionado que falta
}

export interface EnergyImprovement {
  id: string;
  type: 'insulation' | 'heating' | 'lighting' | 'windows' | 'renewable' | 'hvac';
  title: string;
  description: string;
  estimatedSavingsKwhPerM2: number; // kWh/m²·año ahorrados
  priority: 'high' | 'medium' | 'low';
  estimatedCost?: number; // Coste estimado en euros
  estimatedRoi?: number; // Años de retorno de inversión
  estimatedCo2Reduction?: number; // Reducción de emisiones kg CO2eq/m²·año
}

export interface TechnicalAuditResult {
  isComplete: boolean;
  missingData?: string[];
  completionPercentage: number; // 0-100
  tasks: TechnicalTask[];
  energyImprovements: EnergyImprovement[];
  potentialSavingsKwhPerM2: number; // kWh/m²·año potencial de ahorro total
  esgResult: EsgResult | null; // Resultado del cálculo ESG
  summary: {
    totalTasks: number;
    highPriorityTasks: number;
    mediumPriorityTasks: number;
    lowPriorityTasks: number;
    recommendedImprovements: number;
    totalInvestment?: number; // Inversión total estimada
    totalAnnualSavings?: number; // Ahorro anual estimado (€)
    totalCo2Reduction?: number; // Reducción CO2 total
    roiAggregated?: number; // ROI medio de todas las medidas
  };
}

export interface TechnicalAuditResponse {
  data: TechnicalAuditResult;
  message?: string;
}











