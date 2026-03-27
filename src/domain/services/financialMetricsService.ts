import { getSupabaseClient } from '../../lib/supabase';
import { FinancialSnapshotService } from './financialSnapshotService';
import { BuildingService } from './edificioService';
import { FinancialSnapshot } from '../../types/financialSnapshot';
import { Building } from '../../types/edificio';
import { RentService } from './rentService';
import { ServiceInvoiceService } from './serviceInvoiceService';
import { BuildingUnitService } from './buildingUnitService';
import {
  BuildingMetricsResponse,
  BuildingRoiResponse,
  BuildingCapRateResponse,
  BuildingNoiResponse,
  BuildingDscrResponse,
  BuildingOpexRatioResponse,
  BuildingValueGapResponse,
  RehabSimulateRequest,
  RehabSimulateResponse,
  CashflowRunRequest,
  CashflowRunResponse,
  NpvRequest,
  NpvResponse,
  IrrRequest,
  IrrResponse,
  SensitivityRequest,
  SensitivityResponse,
  Period,
  Currency,
  MetricsQueryParams
} from '../../types/financialMetrics';

export class FinancialMetricsService {
  private financialSnapshotService = new FinancialSnapshotService();
  private buildingService = new BuildingService();
  private rentService = new RentService();
  private serviceInvoiceService = new ServiceInvoiceService();
  private buildingUnitService = new BuildingUnitService();

  /**
   * Obtiene el snapshot financiero más reciente para un edificio
   */
  private async getLatestSnapshot(buildingId: string, userAuthId: string): Promise<FinancialSnapshot | null> {
    const snapshots = await this.financialSnapshotService.getFinancialSnapshotsByBuilding(buildingId, userAuthId);
    if (!snapshots || snapshots.length === 0) {
      return null;
    }
    // Ya vienen ordenados por created_at DESC
    return snapshots[0];
  }

  /**
   * Convierte valores anuales a mensuales si es necesario
   */
  private convertToPeriod(value: number, period: Period): number {
    return period === 'monthly' ? value / 12 : value;
  }

  /**
   * Calcula de forma dinámica el NOI, Ingresos Brutos y OPEX Total basándose en 
   * facturas reales de renta, facturas de servicios y unidades del edificio.
   * Utiliza el snapshot como base mínima para asegurar cobertura de datos.
   */
  private async calculateDynamicNOIParams(buildingId: string, userAuthId: string, snapshot: FinancialSnapshot | null): Promise<{ noiAnnual: number, grossRevenueAnnual: number, totalOpexAnnual: number }> {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Mínimos del snapshot como fallback
    const snapshotRevenue = snapshot ? snapshot.ingresos_brutos_anuales_eur + (snapshot.otros_ingresos_anuales_eur || 0) : 0;
    const snapshotOpex = snapshot ? snapshot.opex_total_anual_eur : 0;

    let grossRevenueAnnual = snapshotRevenue;
    let totalOpexAnnual = snapshotOpex;

    try {
      // 1. Ingresos Dinámicos
      const rents = await this.rentService.getRentInvoicesByBuilding(buildingId, userAuthId);
      const recentRents = rents.filter(r => new Date(r.invoiceMonth) >= oneYearAgo);
      
      if (recentRents.length > 0) {
        const monthsOfRent = new Set(recentRents.map(r => r.invoiceMonth.substring(0, 7))).size;
        const realRevenues = recentRents.reduce((sum, r) => sum + r.totalAmount, 0);
        const annualizedRevenues = monthsOfRent > 0 ? (realRevenues / monthsOfRent) * 12 : 0;
        grossRevenueAnnual = Math.max(grossRevenueAnnual, annualizedRevenues);
      } else {
        // Fallback: verificar unidades para estimar GPR
        const units = await this.buildingUnitService.listUnits(buildingId);
        const unitsRentSum = units.reduce((sum, u) => sum + (u.rent || 0), 0);
        if (unitsRentSum > 0) {
          grossRevenueAnnual = Math.max(grossRevenueAnnual, unitsRentSum * 12);
        }
      }

      // 2. Gastos Dinámicos
      const services = await this.serviceInvoiceService.getServiceInvoicesByBuilding(buildingId, userAuthId);
      const recentServices = services.filter(s => new Date(s.invoice_date) >= oneYearAgo);
      
      if (recentServices.length > 0) {
        const monthsOfOpex = new Set(recentServices.map(s => s.invoice_date.substring(0, 7))).size;
        const realOpex = recentServices.reduce((sum, s) => sum + s.amount_eur, 0);
        const annualizedOpex = monthsOfOpex > 0 ? (realOpex / monthsOfOpex) * 12 : 0;
        totalOpexAnnual = Math.max(totalOpexAnnual, annualizedOpex);
      }

    } catch (error) {
      console.warn("Error al calcular ingresos y gastos reales, usando fallback de snapshot.", error);
    }

    const noiAnnual = grossRevenueAnnual - totalOpexAnnual;

    return { noiAnnual, grossRevenueAnnual, totalOpexAnnual };
  }

  /**
   * Calcula NOI (Net Operating Income) (MÉTODO LEGACY / FALLBACK)
   * NOI = Ingresos brutos - OPEX total
   */
  private calculateNOI(snapshot: FinancialSnapshot): number {
    const grossRevenue = snapshot.ingresos_brutos_anuales_eur + (snapshot.otros_ingresos_anuales_eur || 0);
    const totalOpex = snapshot.opex_total_anual_eur;
    return grossRevenue - totalOpex;
  }

  /**
   * Calcula Cap Rate
   * Cap Rate = (NOI / marketValue) * 100
   */
  private calculateCapRate(noi: number, marketValue: number): number | null {
    if (!marketValue || marketValue === 0) {
      return null;
    }
    return (noi / marketValue) * 100;
  }

  /**
   * Calcula ROI Operativo
   * ROI Operativo = (NOI / marketValue) * 100 (mismo que Cap Rate según el documento)
   */
  private calculateROI(noi: number, marketValue: number): number | null {
    return this.calculateCapRate(noi, marketValue);
  }

  /**
   * Calcula OPEX Ratio
   * OPEX Ratio = (OPEX total / Ingresos brutos) * 100
   */
  private calculateOpexRatio(totalOpex: number, grossRevenue: number): number | null {
    if (!grossRevenue || grossRevenue === 0) {
      return null;
    }
    return (totalOpex / grossRevenue) * 100;
  }

  /**
   * Calcula Value Gap
   * Value Gap = (estimatedValue - marketValue) / marketValue * 100
   */
  private calculateValueGap(marketValue: number, estimatedValue: number): number | null {
    if (!marketValue || marketValue === 0) {
      return null;
    }
    return ((estimatedValue - marketValue) / marketValue) * 100;
  }

  /**
   * Calcula NPV (Net Present Value) - método interno
   * NPV = -initialInvestment + Σ(cashflow[i] / (1 + discountRate)^i)
   */
  private calculateNPVInternal(cashflows: number[], initialInvestment: number, discountRate: number): number {
    let npv = -initialInvestment;
    for (let i = 0; i < cashflows.length; i++) {
      npv += cashflows[i] / Math.pow(1 + discountRate, i + 1);
    }
    return npv;
  }

  /**
   * Calcula IRR (Internal Rate of Return) usando método de Newton-Raphson - método interno
   */
  private calculateIRRInternal(
    cashflows: number[],
    initialInvestment: number,
    maxIterations: number = 100,
    tolerance: number = 0.0001
  ): { irr: number | null; iterations: number } {
    // Función NPV para un rate dado
    const npv = (rate: number): number => {
      return this.calculateNPVInternal(cashflows, initialInvestment, rate);
    };

    // Derivada de NPV (para Newton-Raphson)
    const npvDerivative = (rate: number): number => {
      let result = 0;
      for (let i = 0; i < cashflows.length; i++) {
        result -= (cashflows[i] * (i + 1)) / Math.pow(1 + rate, i + 2);
      }
      return result;
    };

    // Método de Newton-Raphson
    let rate = 0.1; // Tasa inicial (10%)
    let iterations = 0;

    while (iterations < maxIterations) {
      const npvValue = npv(rate);
      const derivative = npvDerivative(rate);

      if (Math.abs(npvValue) < tolerance) {
        return { irr: rate, iterations };
      }

      if (Math.abs(derivative) < tolerance) {
        // Derivada muy pequeña, no converge
        return { irr: null, iterations };
      }

      const newRate = rate - npvValue / derivative;

      // Limitar la tasa a un rango razonable
      if (newRate < -0.99 || newRate > 10) {
        return { irr: null, iterations };
      }

      if (Math.abs(newRate - rate) < tolerance) {
        return { irr: newRate, iterations };
      }

      rate = newRate;
      iterations++;
    }

    return { irr: null, iterations };
  }

  /**
   * GET /buildings/{buildingId}/metrics
   * Obtiene todas las métricas consolidadas
   */
  async getBuildingMetrics(
    buildingId: string,
    userAuthId: string,
    params: MetricsQueryParams = {}
  ): Promise<BuildingMetricsResponse> {
    const period: Period = params.period || 'annual';
    const currency: Currency = params.currency || 'EUR';

    // Obtener edificio
    const building = await this.buildingService.getBuildingById(buildingId, userAuthId);
    if (!building) {
      throw new Error('Edificio no encontrado');
    }

    // Obtener snapshot más reciente
    const snapshot = await this.getLatestSnapshot(buildingId, userAuthId);
    if (!snapshot) {
      // Si no hay snapshot, devolver valores null
      return {
        buildingId,
        period,
        currency,
        noi: null,
        capRatePct: null,
        roiOperativoPct: null,
        dscr: null,
        opexRatioPct: null,
        marketValue: building.price || null,
        estimatedValue: building.potentialValue || null,
        valueGapPct: null,
        occupancyPct: null
      };
    }

    // Calcular métricas
    const { noiAnnual, grossRevenueAnnual, totalOpexAnnual } = await this.calculateDynamicNOIParams(buildingId, userAuthId, snapshot);
    const noi = this.convertToPeriod(noiAnnual, period);
    const marketValue = building.price || 0;
    const estimatedValue = building.potentialValue || 0;

    const capRatePct = this.calculateCapRate(noiAnnual, marketValue);
    const roiOperativoPct = this.calculateROI(noiAnnual, marketValue);
    const opexRatioPct = this.calculateOpexRatio(totalOpexAnnual, grossRevenueAnnual);
    const valueGapPct = this.calculateValueGap(marketValue, estimatedValue);

    // DSCR ya está en el snapshot
    const dscr = snapshot?.dscr ?? null;

    // Occupancy no está en el snapshot, devolver null por ahora
    const occupancyPct = null;

    return {
      buildingId,
      period,
      currency,
      noi,
      capRatePct,
      roiOperativoPct,
      dscr,
      opexRatioPct,
      marketValue: marketValue || null,
      estimatedValue: estimatedValue || null,
      valueGapPct,
      occupancyPct
    };
  }

  /**
   * GET /buildings/{buildingId}/roi
   */
  async getBuildingROI(
    buildingId: string,
    userAuthId: string,
    params: MetricsQueryParams = {}
  ): Promise<BuildingRoiResponse> {
    const metrics = await this.getBuildingMetrics(buildingId, userAuthId, params);
    
    return {
      buildingId,
      roiOperativoPct: metrics.roiOperativoPct,
      noi: metrics.noi,
      marketValue: metrics.marketValue,
      period: metrics.period,
      currency: metrics.currency
    };
  }

  /**
   * GET /buildings/{buildingId}/cap-rate
   */
  async getBuildingCapRate(
    buildingId: string,
    userAuthId: string,
    params: MetricsQueryParams = {}
  ): Promise<BuildingCapRateResponse> {
    const metrics = await this.getBuildingMetrics(buildingId, userAuthId, params);
    
    return {
      buildingId,
      capRatePct: metrics.capRatePct,
      noi: metrics.noi,
      marketValue: metrics.marketValue,
      period: metrics.period,
      currency: metrics.currency
    };
  }

  /**
   * GET /buildings/{buildingId}/noi
   */
  async getBuildingNOI(
    buildingId: string,
    userAuthId: string,
    params: MetricsQueryParams = {}
  ): Promise<BuildingNoiResponse> {
    const period: Period = params.period || 'annual';
    const currency: Currency = params.currency || 'EUR';

    const building = await this.buildingService.getBuildingById(buildingId, userAuthId);
    if (!building) {
      throw new Error('Edificio no encontrado');
    }

    const snapshot = await this.getLatestSnapshot(buildingId, userAuthId);
    if (!snapshot) {
      return {
        buildingId,
        noi: null,
        grossRevenue: null,
        totalOpex: null,
        period,
        currency
      };
    }

    const { noiAnnual, grossRevenueAnnual, totalOpexAnnual } = await this.calculateDynamicNOIParams(buildingId, userAuthId, snapshot);
    const noi = this.convertToPeriod(noiAnnual, period);
    const grossRevenue = this.convertToPeriod(grossRevenueAnnual, period);
    const totalOpex = this.convertToPeriod(totalOpexAnnual, period);

    return {
      buildingId,
      noi,
      grossRevenue,
      totalOpex,
      period,
      currency
    };
  }

  /**
   * GET /buildings/{buildingId}/dscr
   */
  async getBuildingDSCR(
    buildingId: string,
    userAuthId: string,
    params: MetricsQueryParams = {}
  ): Promise<BuildingDscrResponse> {
    const period: Period = params.period || 'annual';
    const currency: Currency = params.currency || 'EUR';

    const building = await this.buildingService.getBuildingById(buildingId, userAuthId);
    if (!building) {
      throw new Error('Edificio no encontrado');
    }

    const snapshot = await this.getLatestSnapshot(buildingId, userAuthId);
    if (!snapshot) {
      return {
        buildingId,
        dscr: null,
        noi: null,
        annualDebtService: null,
        period,
        currency
      };
    }

    const { noiAnnual } = await this.calculateDynamicNOIParams(buildingId, userAuthId, snapshot);
    const noi = this.convertToPeriod(noiAnnual, period);
    const annualDebtService = snapshot?.servicio_deuda_anual_eur
      ? this.convertToPeriod(snapshot.servicio_deuda_anual_eur, period)
      : null;

    return {
      buildingId,
      dscr: snapshot?.dscr ?? null,
      noi,
      annualDebtService,
      period,
      currency
    };
  }

  /**
   * GET /buildings/{buildingId}/opex-ratio
   */
  async getBuildingOpexRatio(
    buildingId: string,
    userAuthId: string,
    params: MetricsQueryParams = {}
  ): Promise<BuildingOpexRatioResponse> {
    const period: Period = params.period || 'annual';
    const currency: Currency = params.currency || 'EUR';

    const building = await this.buildingService.getBuildingById(buildingId, userAuthId);
    if (!building) {
      throw new Error('Edificio no encontrado');
    }

    const snapshot = await this.getLatestSnapshot(buildingId, userAuthId);
    if (!snapshot) {
      return {
        buildingId,
        opexRatioPct: null,
        totalOpex: null,
        grossRevenue: null,
        period,
        currency
      };
    }

    const { grossRevenueAnnual, totalOpexAnnual } = await this.calculateDynamicNOIParams(buildingId, userAuthId, snapshot);
    const opexRatioPct = this.calculateOpexRatio(totalOpexAnnual, grossRevenueAnnual);
    const grossRevenue = this.convertToPeriod(grossRevenueAnnual, period);
    const totalOpex = this.convertToPeriod(totalOpexAnnual, period);

    return {
      buildingId,
      opexRatioPct,
      totalOpex,
      grossRevenue,
      period,
      currency
    };
  }

  /**
   * GET /buildings/{buildingId}/value-gap
   */
  async getBuildingValueGap(
    buildingId: string,
    userAuthId: string
  ): Promise<BuildingValueGapResponse> {
    const currency: Currency = 'EUR';

    const building = await this.buildingService.getBuildingById(buildingId, userAuthId);
    if (!building) {
      throw new Error('Edificio no encontrado');
    }

    const marketValue = building.price || 0;
    const estimatedValue = building.potentialValue || 0;
    const valueGapPct = this.calculateValueGap(marketValue, estimatedValue);

    return {
      buildingId,
      valueGapPct,
      marketValue: marketValue || null,
      estimatedValue: estimatedValue || null,
      currency
    };
  }

  /**
   * POST /buildings/{buildingId}/scenarios/rehab/simulate
   * Simula una rehabilitación y calcula payback y ROI
   */
  async simulateRehab(
    buildingId: string,
    userAuthId: string,
    request: RehabSimulateRequest
  ): Promise<RehabSimulateResponse> {
    const building = await this.buildingService.getBuildingById(buildingId, userAuthId);
    if (!building) {
      throw new Error('Edificio no encontrado');
    }

    const snapshot = await this.getLatestSnapshot(buildingId, userAuthId);
    if (!snapshot) {
      throw new Error('No hay snapshot financiero disponible para este edificio');
    }

    const marketValue = building.price || 0;
    const rehabCost = request.rehabCost;

    // Calcular ahorro energético anual (si no se proporciona, usar estimación del snapshot)
    const energySavingsPerYear = request.energySavingsPerYear || 
      (snapshot.opex_energia_anual_eur * (snapshot.ahorro_energia_pct_estimado || 0) / 100);

    // Calcular uplift de precio (usar estimación del snapshot si no se proporciona)
    const upliftPct = snapshot.uplift_precio_pct_estimado || 0;
    const estimatedValue = marketValue * (1 + upliftPct / 100);

    // Calcular value gap
    const valueGapPct = this.calculateValueGap(marketValue, estimatedValue);

    // Calcular payback: meses hasta recuperar la inversión
    // Payback = rehabCost / (ahorro anual + subsidios)
    const annualBenefit = energySavingsPerYear + (request.subsidies || 0);
    const paybackMonths = annualBenefit > 0 
      ? (rehabCost / annualBenefit) * 12 
      : null;

    // Calcular ROI simple: (beneficio anual / costo) * 100
    const simpleRoiPct = rehabCost > 0 
      ? (annualBenefit / rehabCost) * 100 
      : 0;

    // Generar notes
    const method = request.method || 'heuristic';
    const notes = `Simulación usando método ${method}. ` +
      `Ahorro energético estimado: ${energySavingsPerYear.toFixed(2)} EUR/año. ` +
      `Uplift de precio estimado: ${upliftPct.toFixed(2)}%.`;

    return {
      buildingId,
      estimatedValue,
      valueGapPct: valueGapPct || 0,
      paybackMonths,
      simpleRoiPct,
      notes
    };
  }

  /**
   * POST /buildings/{buildingId}/scenarios/cashflow/run
   * Genera flujos de caja proyectados
   */
  async runCashflow(
    buildingId: string,
    userAuthId: string,
    request: CashflowRunRequest
  ): Promise<CashflowRunResponse> {
    const building = await this.buildingService.getBuildingById(buildingId, userAuthId);
    if (!building) {
      throw new Error('Edificio no encontrado');
    }

    const snapshot = await this.getLatestSnapshot(buildingId, userAuthId);
    if (!snapshot) {
      throw new Error('No hay snapshot financiero disponible para este edificio');
    }

    const period = request.period || 'annual';
    const years = request.years || 5;
    const discountRate = request.discountRate || 0.08;
    const scenarioId = request.scenarioId || `scenario_${Date.now()}`;

    // Calcular NOI anual dinámico
    const { noiAnnual } = await this.calculateDynamicNOIParams(buildingId, userAuthId, snapshot);

    // Generar cashflows (asumiendo NOI constante, pero se puede extender)
    const cashflows: number[] = [];
    for (let i = 0; i < years; i++) {
      cashflows.push(period === 'annual' ? noiAnnual : noiAnnual / 12);
    }

    // Initial investment = rehabilitation cost si existe
    const initialInvestment = building.rehabilitationCost || 0;

    return {
      buildingId,
      scenarioId,
      period,
      discountRate,
      cashflows,
      initialInvestment,
      years
    };
  }

  /**
   * POST /buildings/{buildingId}/scenarios/npv
   */
  async calculateNPV(
    buildingId: string,
    userAuthId: string,
    request: NpvRequest
  ): Promise<NpvResponse> {
    const building = await this.buildingService.getBuildingById(buildingId, userAuthId);
    if (!building) {
      throw new Error('Edificio no encontrado');
    }

    const npv = this.calculateNPVInternal(request.cashflows, request.initialInvestment, request.discountRate);

    return {
      buildingId,
      npv,
      discountRate: request.discountRate,
      scenarioId: request.scenarioId
    };
  }

  /**
   * POST /buildings/{buildingId}/scenarios/irr
   */
  async calculateIRR(
    buildingId: string,
    userAuthId: string,
    request: IrrRequest
  ): Promise<IrrResponse> {
    const building = await this.buildingService.getBuildingById(buildingId, userAuthId);
    if (!building) {
      throw new Error('Edificio no encontrado');
    }

      const { irr, iterations } = this.calculateIRRInternal(
        request.cashflows,
        request.initialInvestment,
        request.maxIterations,
        request.tolerance
      );

    return {
      buildingId,
      irr,
      scenarioId: request.scenarioId,
      iterations
    };
  }

  /**
   * POST /buildings/{buildingId}/scenarios/sensitivity
   */
  async calculateSensitivity(
    buildingId: string,
    userAuthId: string,
    request: SensitivityRequest
  ): Promise<SensitivityResponse> {
    const building = await this.buildingService.getBuildingById(buildingId, userAuthId);
    if (!building) {
      throw new Error('Edificio no encontrado');
    }

    // Calcular NPV base
    const baseNpv = this.calculateNPVInternal(
      request.baseCashflows,
      request.initialInvestment,
      request.baseDiscountRate
    );

    // Si no se proporciona rango, usar valores por defecto
    const discountRateRange = request.discountRateRange || 
      [0.02, 0.04, 0.06, 0.08, 0.10, 0.12, 0.15];

    // Calcular NPV para cada tasa de descuento
    const sensitivity = discountRateRange.map(rate => ({
      discountRate: rate,
      npv: this.calculateNPVInternal(request.baseCashflows, request.initialInvestment, rate)
    }));

    return {
      buildingId,
      scenarioId: request.scenarioId,
      sensitivity,
      baseNpv
    };
  }
}

