// Tipos y DTOs para métricas financieras según ARKIA - Catálogo de Endpoints Financieros

export type Period = 'annual' | 'monthly';
export type Currency = 'EUR' | 'USD'; // Por ahora solo EUR, pero extensible

// ============================================================================
// GET /buildings/{buildingId}/metrics - Métricas consolidadas
// ============================================================================
export interface BuildingMetricsResponse {
  buildingId: string;
  period: Period;
  currency: Currency;
  noi: number | null;
  capRatePct: number | null;
  roiOperativoPct: number | null;
  dscr: number | null;
  opexRatioPct: number | null;
  marketValue: number | null;
  estimatedValue: number | null;
  valueGapPct: number | null;
  occupancyPct: number | null;
}

// ============================================================================
// GET /buildings/{buildingId}/roi
// ============================================================================
export interface BuildingRoiResponse {
  buildingId: string;
  roiOperativoPct: number | null;
  noi: number | null;
  marketValue: number | null;
  period: Period;
  currency: Currency;
}

// ============================================================================
// GET /buildings/{buildingId}/cap-rate
// ============================================================================
export interface BuildingCapRateResponse {
  buildingId: string;
  capRatePct: number | null;
  noi: number | null;
  marketValue: number | null;
  period: Period;
  currency: Currency;
}

// ============================================================================
// GET /buildings/{buildingId}/noi
// ============================================================================
export interface BuildingNoiResponse {
  buildingId: string;
  noi: number | null;
  grossRevenue: number | null;
  totalOpex: number | null;
  period: Period;
  currency: Currency;
}

// ============================================================================
// GET /buildings/{buildingId}/dscr
// ============================================================================
export interface BuildingDscrResponse {
  buildingId: string;
  dscr: number | null;
  noi: number | null;
  annualDebtService: number | null;
  period: Period;
  currency: Currency;
}

// ============================================================================
// GET /buildings/{buildingId}/opex-ratio
// ============================================================================
export interface BuildingOpexRatioResponse {
  buildingId: string;
  opexRatioPct: number | null;
  totalOpex: number | null;
  grossRevenue: number | null;
  period: Period;
  currency: Currency;
}

// ============================================================================
// GET /buildings/{buildingId}/value-gap
// ============================================================================
export interface BuildingValueGapResponse {
  buildingId: string;
  valueGapPct: number | null;
  marketValue: number | null;
  estimatedValue: number | null;
  currency: Currency;
}

// ============================================================================
// POST /buildings/{buildingId}/scenarios/rehab/simulate
// ============================================================================
export interface RehabSimulateRequest {
  rehabCost: number;
  energySavingsPerYear?: number;
  subsidies?: number;
  monthsToExecute?: number;
  method?: 'heuristic' | 'model';
}

export interface RehabSimulateResponse {
  buildingId: string;
  estimatedValue: number;
  valueGapPct: number;
  paybackMonths: number | null;
  simpleRoiPct: number;
  notes: string;
}

// ============================================================================
// POST /buildings/{buildingId}/scenarios/cashflow/run
// ============================================================================
export interface CashflowRunRequest {
  period: Period;
  years?: number; // Por defecto 5 años
  discountRate?: number; // Por defecto 0.08 (8%)
  scenarioId?: string; // Para reproducibilidad
}

export interface CashflowRunResponse {
  buildingId: string;
  scenarioId: string;
  period: Period;
  discountRate: number;
  cashflows: number[];
  initialInvestment: number;
  years: number;
}

// ============================================================================
// POST /buildings/{buildingId}/scenarios/npv
// ============================================================================
export interface NpvRequest {
  discountRate: number;
  cashflows: number[];
  initialInvestment: number;
  scenarioId?: string;
}

export interface NpvResponse {
  buildingId: string;
  npv: number;
  discountRate: number;
  scenarioId?: string;
}

// ============================================================================
// POST /buildings/{buildingId}/scenarios/irr
// ============================================================================
export interface IrrRequest {
  cashflows: number[];
  initialInvestment: number;
  scenarioId?: string;
  maxIterations?: number; // Por defecto 100
  tolerance?: number; // Por defecto 0.0001
}

export interface IrrResponse {
  buildingId: string;
  irr: number | null; // null si no converge
  scenarioId?: string;
  iterations?: number;
}

// ============================================================================
// POST /buildings/{buildingId}/scenarios/sensitivity
// ============================================================================
export interface SensitivityRequest {
  baseDiscountRate: number;
  baseCashflows: number[];
  initialInvestment: number;
  discountRateRange?: number[]; // Array de tasas de descuento a probar
  scenarioId?: string;
}

export interface SensitivityResponse {
  buildingId: string;
  scenarioId?: string;
  sensitivity: {
    discountRate: number;
    npv: number;
  }[];
  baseNpv: number;
}

// ============================================================================
// Query parameters comunes para endpoints GET
// ============================================================================
export interface MetricsQueryParams {
  period?: Period; // Por defecto 'annual'
  currency?: Currency; // Por defecto 'EUR'
}

