// Tipos para la auditoría técnica de edificios

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
}

export interface TechnicalAuditResult {
  completionPercentage: number; // 0-100
  tasks: TechnicalTask[];
  energyImprovements: EnergyImprovement[];
  potentialSavingsKwhPerM2: number; // kWh/m²·año potencial de ahorro total
  summary: {
    totalTasks: number;
    highPriorityTasks: number;
    mediumPriorityTasks: number;
    lowPriorityTasks: number;
    recommendedImprovements: number;
  };
}

export interface TechnicalAuditResponse {
  data: TechnicalAuditResult;
  message?: string;
}

