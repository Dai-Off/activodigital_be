// Tipos para la auditoría financiera de edificios

export interface CurrentFinancialState {
  marketValue: number; // Valor actual del activo (EUR)
  roiPct: number | null; // ROI actual (%)
  noi: number | null; // Net Operating Income anual (EUR)
  capRatePct: number | null; // Cap Rate (%)
  
  // Métricas secundarias para la UI
  squareMeters: number | null;
  pricePerSqm: number | null;
  rentPerSqmPerMonth: number | null;
  occupancyPct: number | null;
}

export interface ImprovementCost {
  category: string; // Categoría de mejora (energética, estructural, etc.)
  description: string;
  estimatedCost: number; // Coste estimado (EUR)
}

export interface PostImprovementScenario {
  totalInvestment: number; // Inversión total necesaria (EUR)
  investmentBreakdown: ImprovementCost[]; // Desglose de la inversión
  
  // Revalorización
  revaluationPct: number; // Porcentaje de revalorización estimado (%)
  futureValue: number; // Valor futuro estimado del activo (EUR)
  valueIncrease: number; // Incremento de valor (EUR)
  
  // Retorno
  paybackMonths: number | null; // Periodo de recuperación (meses)
  netProfit: number; // Ganancia neta = valor futuro - valor actual - inversión (EUR)
  projectRoiPct: number | null; // ROI del proyecto = (ganancia neta / inversión) * 100 (%)
  
  // Mejoras operativas
  annualEnergySavings: number; // Ahorros energéticos anuales (EUR)
  noiIncrease: number; // Incremento del NOI (EUR)
  newCapRatePct: number | null; // Nuevo Cap Rate tras mejoras (%)
}

export interface InvestmentScenario {
  id: number;
  name: string;
  description: string;
  investment: number;
  futureValue: number;
  annualSavings: number;
  epbdClass: string;
  roiPct: number | null;
  paybackYears: number | null;
  isOptimal: boolean;
  pros: string[];
  cons: string[];
}

export interface FinancialAuditResult {
  buildingId: string;
  address?: string;
  currentState: CurrentFinancialState;
  postImprovementScenario: PostImprovementScenario;
  scenarios: InvestmentScenario[];
  
  // Metadata
  dataCompleteness: {
    hasFinancialSnapshot: boolean;
    hasEnergyImprovements: boolean;
    hasBuildingPrice: boolean;
    completenessScore: number; // 0-100
    isTechnicalAuditUnavailable?: boolean;
  };
  
  recommendations: string[]; // Recomendaciones clave
  
  calculatedAt: string; // ISO timestamp
}

export interface FinancialAuditResponse {
  data: FinancialAuditResult;
  message?: string;
}
