import { getSupabaseClient } from '../../lib/supabase';
import { FinancialAuditResult, CurrentFinancialState, PostImprovementScenario, ImprovementCost } from '../../types/financialAudit';
import { FinancialMetricsService } from './financialMetricsService';
import { FinancialSnapshotService } from './financialSnapshotService';
import { TechnicalAuditService } from './technicalAuditService';
import { BuildingService } from './edificioService';

export class FinancialAuditService {
  private financialMetricsService = new FinancialMetricsService();
  private financialSnapshotService = new FinancialSnapshotService();
  private technicalAuditService = new TechnicalAuditService();
  private buildingService = new BuildingService();

  private getSupabase() {
    return getSupabaseClient();
  }

  /**
   * Obtiene la auditoría financiera de un edificio
   * @param buildingId ID del edificio
   * @param userAuthId ID del usuario autenticado (para validar permisos)
   * @returns Resultado de la auditoría financiera
   */
  async getFinancialAudit(buildingId: string, userAuthId: string): Promise<FinancialAuditResult> {
    // Obtener edificio
    const building = await this.buildingService.getBuildingById(buildingId, userAuthId);
    if (!building) {
      throw new Error('Edificio no encontrado');
    }

    // Obtener snapshot financiero más reciente
    const snapshots = await this.financialSnapshotService.getFinancialSnapshotsByBuilding(buildingId, userAuthId);
    const latestSnapshot = snapshots && snapshots.length > 0 ? snapshots[0] : null;

    // Obtener auditoría técnica (para mejoras energéticas)
    const technicalAudit = await this.technicalAuditService.getTechnicalAudit(buildingId, userAuthId);

    // Obtener métricas financieras actuales
    const metrics = await this.financialMetricsService.getBuildingMetrics(buildingId, userAuthId);

    // Calcular estado financiero actual
    const currentState = this.calculateCurrentState(building, metrics);

    // Calcular escenario post-mejoras
    const postImprovementScenario = this.calculatePostImprovementScenario(
      building,
      latestSnapshot,
      technicalAudit,
      currentState
    );

    // Evaluar completitud de datos
    const dataCompleteness = this.evaluateDataCompleteness(
      building,
      latestSnapshot,
      technicalAudit
    );

    // Generar recomendaciones
    const recommendations = this.generateRecommendations(
      currentState,
      postImprovementScenario,
      dataCompleteness
    );

    return {
      buildingId,
      currentState,
      postImprovementScenario,
      dataCompleteness,
      recommendations,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Calcula el estado financiero actual
   */
  private calculateCurrentState(building: any, metrics: any): CurrentFinancialState {
    const marketValue = building.price || 0;
    const roiPct = metrics.roiOperativoPct;
    const noi = metrics.noi;
    const capRatePct = metrics.capRatePct;

    return {
      marketValue,
      roiPct,
      noi,
      capRatePct
    };
  }

  /**
   * Calcula el escenario post-mejoras
   */
  private calculatePostImprovementScenario(
    building: any,
    snapshot: any,
    technicalAudit: any,
    currentState: CurrentFinancialState
  ): PostImprovementScenario {
    const investmentBreakdown: ImprovementCost[] = [];

    // 1. Calcular costes de rehabilitación base (si existe)
    const baseRehabCost = snapshot?.capex_rehab_estimado_eur || building.rehabilitationCost || 0;
    if (baseRehabCost > 0) {
      investmentBreakdown.push({
        category: 'Rehabilitación estructural',
        description: 'Obras de rehabilitación general del edificio',
        estimatedCost: baseRehabCost
      });
    }

    // 2. Calcular costes de mejoras energéticas
    const energyImprovements = technicalAudit.energyImprovements || [];
    let totalEnergyCost = 0;
    
    // Costes estimados por tipo de mejora (valores de referencia en EUR/m²)
    const costPerM2ByType: { [key: string]: number } = {
      'insulation': 80,      // Aislamiento: ~80 EUR/m²
      'windows': 250,        // Ventanas: ~250 EUR/m² (incluye instalación)
      'heating': 100,        // Calefacción: ~100 EUR/m²
      'lighting': 20,        // Iluminación LED: ~20 EUR/m²
      'renewable': 150,      // Paneles solares: ~150 EUR/m²
      'hvac': 120            // HVAC: ~120 EUR/m²
    };

    const buildingM2 = building.squareMeters || 0;
    
    energyImprovements.forEach((improvement: any) => {
      const costPerM2 = costPerM2ByType[improvement.type] || 100; // Default 100 EUR/m²
      const estimatedCost = costPerM2 * buildingM2;
      totalEnergyCost += estimatedCost;

      investmentBreakdown.push({
        category: `Mejora energética: ${improvement.type}`,
        description: improvement.title,
        estimatedCost
      });
    });

    const totalInvestment = baseRehabCost + totalEnergyCost;

    // 3. Calcular revalorización
    // Usar uplift del snapshot, o estimar según mejoras energéticas
    let revaluationPct = snapshot?.uplift_precio_pct_estimado || 0;
    
    // Si no hay uplift en snapshot, estimarlo según mejoras
    if (revaluationPct === 0 && energyImprovements.length > 0) {
      // Estimación conservadora: 0.5% por cada mejora de alta prioridad, 0.3% por media
      const highPriorityCount = energyImprovements.filter((i: any) => i.priority === 'high').length;
      const mediumPriorityCount = energyImprovements.filter((i: any) => i.priority === 'medium').length;
      revaluationPct = (highPriorityCount * 0.5) + (mediumPriorityCount * 0.3);
      
      // Cap al 8% para ser conservadores
      revaluationPct = Math.min(revaluationPct, 8);
    }

    const futureValue = currentState.marketValue * (1 + revaluationPct / 100);
    const valueIncrease = futureValue - currentState.marketValue;

    // 4. Calcular ahorros energéticos anuales
    // Usar el ahorro del snapshot o estimarlo desde las mejoras
    let annualEnergySavings = 0;
    
    if (snapshot?.ahorro_energia_pct_estimado && snapshot?.opex_energia_anual_eur) {
      annualEnergySavings = (snapshot.ahorro_energia_pct_estimado / 100) * snapshot.opex_energia_anual_eur;
    } else if (technicalAudit.potentialSavingsKwhPerM2 > 0 && buildingM2 > 0) {
      // Estimar ahorro económico: ~0.15 EUR/kWh (precio medio electricidad)
      const pricePerKwh = 0.15;
      annualEnergySavings = technicalAudit.potentialSavingsKwhPerM2 * buildingM2 * pricePerKwh;
    }

    // 5. Calcular NOI incrementado
    const noiIncrease = annualEnergySavings; // Los ahorros OPEX aumentan el NOI directamente
    const newNOI = (currentState.noi || 0) + noiIncrease;

    // 6. Calcular nuevo Cap Rate
    const newCapRatePct = futureValue > 0 ? (newNOI / futureValue) * 100 : null;

    // 7. Calcular payback
    // Payback considerando ahorros + incremento de valor
    let paybackMonths: number | null = null;
    if (totalInvestment > 0) {
      const annualReturn = annualEnergySavings + (valueIncrease / 10); // Amortizar incremento de valor en 10 años
      if (annualReturn > 0) {
        const paybackYears = totalInvestment / annualReturn;
        paybackMonths = Math.round(paybackYears * 12);
      }
    }

    // 8. Calcular ganancia neta y ROI del proyecto
    const netProfit = valueIncrease - totalInvestment; // No incluimos ahorros en la ganancia neta (son flujos operativos)
    const projectRoiPct = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : null;

    return {
      totalInvestment,
      investmentBreakdown,
      revaluationPct,
      futureValue,
      valueIncrease,
      paybackMonths,
      netProfit,
      projectRoiPct,
      annualEnergySavings,
      noiIncrease,
      newCapRatePct
    };
  }

  /**
   * Evalúa la completitud de los datos
   */
  private evaluateDataCompleteness(
    building: any,
    snapshot: any,
    technicalAudit: any
  ): {
    hasFinancialSnapshot: boolean;
    hasEnergyImprovements: boolean;
    hasBuildingPrice: boolean;
    completenessScore: number;
  } {
    const hasFinancialSnapshot = !!snapshot;
    const hasEnergyImprovements = technicalAudit?.energyImprovements?.length > 0;
    const hasBuildingPrice = !!building.price && building.price > 0;

    // Calcular score de completitud (0-100)
    let score = 0;
    if (hasBuildingPrice) score += 40; // El precio del edificio es crítico
    if (hasFinancialSnapshot) score += 40; // El snapshot financiero es crítico
    if (hasEnergyImprovements) score += 20; // Las mejoras energéticas son importantes

    return {
      hasFinancialSnapshot,
      hasEnergyImprovements,
      hasBuildingPrice,
      completenessScore: score
    };
  }

  /**
   * Genera recomendaciones basadas en el análisis
   */
  private generateRecommendations(
    currentState: CurrentFinancialState,
    scenario: PostImprovementScenario,
    dataCompleteness: any
  ): string[] {
    const recommendations: string[] = [];

    // Recomendaciones por falta de datos
    if (!dataCompleteness.hasBuildingPrice) {
      recommendations.push('Registre el valor de mercado del edificio para obtener análisis financiero completo');
    }

    if (!dataCompleteness.hasFinancialSnapshot) {
      recommendations.push('Cree un snapshot financiero del edificio para cálculos más precisos');
    }

    if (!dataCompleteness.hasEnergyImprovements) {
      recommendations.push('Complete la auditoría técnica para identificar mejoras energéticas rentables');
    }

    // Recomendaciones financieras
    if (scenario.projectRoiPct !== null) {
      if (scenario.projectRoiPct > 20) {
        recommendations.push('El proyecto de mejoras presenta un ROI excelente (>20%). Altamente recomendable.');
      } else if (scenario.projectRoiPct > 10) {
        recommendations.push('El proyecto de mejoras presenta un ROI positivo (>10%). Recomendable.');
      } else if (scenario.projectRoiPct > 0) {
        recommendations.push('El proyecto de mejoras presenta un ROI modesto. Evalúe prioridades.');
      } else {
        recommendations.push('El ROI del proyecto es negativo. Considere solo mejoras prioritarias o de cumplimiento normativo.');
      }
    }

    if (scenario.paybackMonths !== null) {
      if (scenario.paybackMonths <= 60) { // 5 años o menos
        recommendations.push(`Periodo de recuperación favorable: ${Math.round(scenario.paybackMonths / 12)} años`);
      } else if (scenario.paybackMonths <= 120) { // 10 años o menos
        recommendations.push(`Periodo de recuperación moderado: ${Math.round(scenario.paybackMonths / 12)} años`);
      } else {
        recommendations.push(`Periodo de recuperación largo: ${Math.round(scenario.paybackMonths / 12)} años. Priorice mejoras de alto impacto.`);
      }
    }

    if (scenario.annualEnergySavings > 0) {
      const savingsK = Math.round(scenario.annualEnergySavings / 1000);
      recommendations.push(`Ahorros energéticos estimados: ${savingsK}k EUR/año mejoran la rentabilidad operativa`);
    }

    // Recomendaciones por ROI actual
    if (currentState.roiPct !== null) {
      if (currentState.roiPct < 3) {
        recommendations.push('ROI actual bajo (<3%). Las mejoras pueden aumentar significativamente la rentabilidad.');
      } else if (currentState.roiPct >= 6) {
        recommendations.push('ROI actual saludable (>=6%). Las mejoras pueden optimizarlo aún más.');
      }
    }

    // Recomendaciones por Cap Rate
    if (scenario.newCapRatePct && currentState.capRatePct) {
      const capRateIncrease = scenario.newCapRatePct - currentState.capRatePct;
      if (capRateIncrease > 0.5) {
        recommendations.push(`Las mejoras incrementarían el Cap Rate en ${capRateIncrease.toFixed(2)}pp, aumentando el atractivo del activo`);
      }
    }

    return recommendations;
  }
}
