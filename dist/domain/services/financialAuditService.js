"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialAuditService = void 0;
const supabase_1 = require("../../lib/supabase");
const financialMetricsService_1 = require("./financialMetricsService");
const financialSnapshotService_1 = require("./financialSnapshotService");
const technicalAuditService_1 = require("./technicalAuditService");
const edificioService_1 = require("./edificioService");
const buildingUnitService_1 = require("./buildingUnitService");
const auditConstants_1 = require("../constants/auditConstants");
class FinancialAuditService {
    constructor() {
        this.financialMetricsService = new financialMetricsService_1.FinancialMetricsService();
        this.financialSnapshotService = new financialSnapshotService_1.FinancialSnapshotService();
        this.technicalAuditService = new technicalAuditService_1.TechnicalAuditService();
        this.buildingService = new edificioService_1.BuildingService();
        this.buildingUnitService = new buildingUnitService_1.BuildingUnitService();
    }
    getSupabase() {
        return (0, supabase_1.getSupabaseClient)();
    }
    /**
     * Obtiene la auditoría financiera de un edificio
     * @param buildingId ID del edificio
     * @param userAuthId ID del usuario autenticado (para validar permisos)
     * @returns Resultado de la auditoría financiera
     */
    async getFinancialAudit(buildingId, userAuthId) {
        // Obtener edificio
        const building = await this.buildingService.getBuildingById(buildingId, userAuthId);
        if (!building) {
            throw new Error('Edificio no encontrado');
        }
        // Obtener snapshot financiero más reciente
        const snapshots = await this.financialSnapshotService.getFinancialSnapshotsByBuilding(buildingId, userAuthId);
        const latestSnapshot = snapshots && snapshots.length > 0 ? snapshots[0] : null;
        // Obtener auditoría técnica (para mejoras energéticas)
        let technicalAudit = null;
        let isTechnicalAuditUnavailable = false;
        try {
            technicalAudit = await this.technicalAuditService.getTechnicalAudit(buildingId, userAuthId);
        }
        catch (techError) {
            console.warn(`[FinancialAudit] Auditoría técnica no disponible para edificio ${buildingId}:`, techError instanceof Error ? techError.message : 'Error desconocido');
            isTechnicalAuditUnavailable = true;
            // Creamos un objeto mínimo para que el resto del flujo no reviente
            technicalAudit = { energyImprovements: [], potentialSavingsKwhPerM2: 0 };
        }
        // Obtener métricas financieras actuales
        const metrics = await this.financialMetricsService.getBuildingMetrics(buildingId, userAuthId);
        // Obtener NOI detallado (incluye ingresos brutos)
        const noiDetails = await this.financialMetricsService.getBuildingNOI(buildingId, userAuthId);
        // Obtener unidades para la ocupación
        const units = await this.buildingUnitService.listUnits(buildingId);
        const occupancyPct = this.buildingUnitService.calculateOccupancy(units);
        // Calcular estado financiero actual
        const currentState = this.calculateCurrentState(building, metrics, noiDetails, occupancyPct);
        // Calcular escenario post-mejoras
        const postImprovementScenario = this.calculatePostImprovementScenario(building, latestSnapshot, technicalAudit, currentState);
        // Evaluar completitud de datos
        const dataCompleteness = this.evaluateDataCompleteness(building, latestSnapshot, technicalAudit);
        // Generar recomendaciones
        const recommendations = this.generateRecommendations(currentState, postImprovementScenario, dataCompleteness);
        // Generar escenarios de inversión dinámicos
        const scenarios = this.generateScenarios(currentState, technicalAudit, building);
        return {
            buildingId,
            address: building.address || building.name || building.cadastralReference,
            currentState,
            postImprovementScenario,
            scenarios,
            dataCompleteness: {
                ...dataCompleteness,
                isTechnicalAuditUnavailable
            },
            recommendations,
            calculatedAt: new Date().toISOString()
        };
    }
    /**
     * Calcula el estado financiero actual
     */
    calculateCurrentState(building, metrics, noiDetails, occupancyPct) {
        const marketValue = building.price || 0;
        const roiPct = metrics.roiOperativoPct;
        const noi = metrics.noi;
        const capRatePct = metrics.capRatePct;
        const squareMeters = building.squareMeters || null;
        const pricePerSqm = squareMeters && squareMeters > 0 ? marketValue / squareMeters : null;
        const grossRevenueAnnual = noiDetails.grossRevenue || 0;
        const rentPerSqmPerMonth = squareMeters && squareMeters > 0 ? (grossRevenueAnnual / 12) / squareMeters : null;
        return {
            marketValue,
            roiPct,
            noi,
            capRatePct,
            squareMeters,
            pricePerSqm,
            rentPerSqmPerMonth,
            occupancyPct
        };
    }
    /**
     * Calcula el escenario post-mejoras
     */
    calculatePostImprovementScenario(building, snapshot, technicalAudit, currentState) {
        const investmentBreakdown = [];
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
        const costPerM2ByType = {
            'insulation': auditConstants_1.AUDIT_CONSTANTS.COSTS_PER_M2.INSULATION,
            'windows': auditConstants_1.AUDIT_CONSTANTS.COSTS_PER_M2.WINDOWS,
            'heating': auditConstants_1.AUDIT_CONSTANTS.COSTS_PER_M2.HVAC, // Mapeado a HVAC para consistencia
            'lighting': auditConstants_1.AUDIT_CONSTANTS.COSTS_PER_M2.LIGHTING,
            'renewable': auditConstants_1.AUDIT_CONSTANTS.COSTS_PER_M2.RENEWABLES,
            'hvac': auditConstants_1.AUDIT_CONSTANTS.COSTS_PER_M2.HVAC
        };
        const buildingM2 = building.squareMeters || 0;
        energyImprovements.forEach((improvement) => {
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
        // Usar uplift del snapshot, o estimar de forma dinámica si hay mejoras energéticas
        let revaluationPct = snapshot?.uplift_precio_pct_estimado || 0;
        let valueIncrease = 0;
        if (revaluationPct > 0 && currentState.marketValue > 0) {
            valueIncrease = currentState.marketValue * (revaluationPct / 100);
        }
        else if (energyImprovements.length > 0) {
            // Si no hay uplift en snapshot, estimarlo según la inversión.
            // Se asume que una inversión integral revaloriza el inmueble al menos el coste de la inversión + factor
            valueIncrease = totalInvestment * auditConstants_1.AUDIT_CONSTANTS.BENCHMARKS.ESTIMATED_REVALUATION_FACTOR;
            // Calcular el % de revalorización correspondiente
            if (currentState.marketValue > 0) {
                revaluationPct = (valueIncrease / currentState.marketValue) * 100;
            }
        }
        const futureValue = currentState.marketValue + valueIncrease;
        // 4. Calcular ahorros energéticos anuales
        // Usar el ahorro del snapshot o estimarlo desde las mejoras
        let annualEnergySavings = 0;
        if (snapshot?.ahorro_energia_pct_estimado && snapshot?.opex_energia_anual_eur) {
            annualEnergySavings = (snapshot.ahorro_energia_pct_estimado / 100) * snapshot.opex_energia_anual_eur;
        }
        else if (technicalAudit.potentialSavingsKwhPerM2 > 0 && buildingM2 > 0) {
            // Estimar ahorro económico: usando precio centralizado
            const pricePerKwh = auditConstants_1.AUDIT_CONSTANTS.ENERGY.PRICE_PER_KWH;
            annualEnergySavings = technicalAudit.potentialSavingsKwhPerM2 * buildingM2 * pricePerKwh;
        }
        // 5. Calcular NOI incrementado
        const noiIncrease = annualEnergySavings; // Los ahorros OPEX aumentan el NOI directamente
        const newNOI = (currentState.noi || 0) + noiIncrease;
        // 6. Calcular nuevo Cap Rate
        const newCapRatePct = futureValue > 0 ? (newNOI / futureValue) * 100 : null;
        // 7. Calcular payback
        // Payback considerando ahorros + incremento de valor
        let paybackMonths = null;
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
    evaluateDataCompleteness(building, snapshot, technicalAudit) {
        const hasFinancialSnapshot = !!snapshot;
        const hasEnergyImprovements = technicalAudit?.energyImprovements?.length > 0;
        const hasBuildingPrice = !!building.price && building.price > 0;
        // Calcular score de completitud (0-100)
        let score = 0;
        if (hasBuildingPrice)
            score += 40; // El precio del edificio es crítico
        if (hasFinancialSnapshot)
            score += 40; // El snapshot financiero es crítico
        if (hasEnergyImprovements)
            score += 20; // Las mejoras energéticas son importantes
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
    generateRecommendations(currentState, scenario, dataCompleteness) {
        const recommendations = [];
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
            }
            else if (scenario.projectRoiPct > 10) {
                recommendations.push('El proyecto de mejoras presenta un ROI positivo (>10%). Recomendable.');
            }
            else if (scenario.projectRoiPct > 0) {
                recommendations.push('El proyecto de mejoras presenta un ROI modesto. Evalúe prioridades.');
            }
            else {
                recommendations.push('El ROI del proyecto es negativo. Considere solo mejoras prioritarias o de cumplimiento normativo.');
            }
        }
        if (scenario.paybackMonths !== null) {
            if (scenario.paybackMonths <= 60) { // 5 años o menos
                recommendations.push(`Periodo de recuperación favorable: ${Math.round(scenario.paybackMonths / 12)} años`);
            }
            else if (scenario.paybackMonths <= 120) { // 10 años o menos
                recommendations.push(`Periodo de recuperación moderado: ${Math.round(scenario.paybackMonths / 12)} años`);
            }
            else {
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
            }
            else if (currentState.roiPct >= 6) {
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
    /**
     * Genera 5 escenarios de inversión dinámicos basados en las mejoras reales
     */
    generateScenarios(currentState, technicalAudit, building) {
        const improvements = technicalAudit.energyImprovements || [];
        const marketValue = currentState.marketValue || 0;
        const buildingM2 = building.squareMeters || 0;
        const pricePerKwh = auditConstants_1.AUDIT_CONSTANTS.ENERGY.PRICE_PER_KWH;
        // Agrupar mejoras por tipo para crear subconjuntos
        const basicTypes = ['lighting', 'renewable'];
        const intermediateTypes = ['lighting', 'renewable', 'hvac'];
        const basicImprovements = improvements.filter((imp) => basicTypes.includes(imp.type));
        const intermediateImprovements = improvements.filter((imp) => intermediateTypes.includes(imp.type));
        const allImprovements = improvements;
        const calcScenario = (subset, premiumMultiplier = 1) => {
            const investment = subset.reduce((sum, imp) => {
                const costPerM2ByType = {
                    'insulation': auditConstants_1.AUDIT_CONSTANTS.COSTS_PER_M2.INSULATION,
                    'windows': auditConstants_1.AUDIT_CONSTANTS.COSTS_PER_M2.WINDOWS,
                    'heating': auditConstants_1.AUDIT_CONSTANTS.COSTS_PER_M2.HVAC,
                    'lighting': auditConstants_1.AUDIT_CONSTANTS.COSTS_PER_M2.LIGHTING,
                    'renewable': auditConstants_1.AUDIT_CONSTANTS.COSTS_PER_M2.RENEWABLES,
                    'hvac': auditConstants_1.AUDIT_CONSTANTS.COSTS_PER_M2.HVAC,
                    'esg': auditConstants_1.AUDIT_CONSTANTS.COSTS_PER_M2.INSULATION // Fallback esg
                };
                const costPerM2 = costPerM2ByType[imp.type] || 100;
                return sum + (costPerM2 * buildingM2);
            }, 0) * premiumMultiplier;
            const savingsKwh = subset.reduce((sum, imp) => sum + (imp.estimatedSavingsKwhPerM2 || 0), 0) * auditConstants_1.AUDIT_CONSTANTS.BUILDING.OVERLAP_FACTOR;
            const annualSavings = savingsKwh * buildingM2 * pricePerKwh;
            // Revalorización estimada
            const valueIncrease = investment * auditConstants_1.AUDIT_CONSTANTS.BENCHMARKS.ESTIMATED_REVALUATION_FACTOR;
            const futureValue = marketValue + valueIncrease;
            // ROI y Payback
            const netProfit = valueIncrease - investment;
            const roiPct = investment > 0 ? (netProfit / investment) * 100 : null;
            const annualReturn = annualSavings + (valueIncrease / 10);
            const paybackYears = annualReturn > 0 ? Number((investment / annualReturn).toFixed(1)) : null;
            return { investment, futureValue, annualSavings: Math.round(annualSavings), roiPct, paybackYears };
        };
        // Determinar clase EPBD mejorada según mejoras
        const currentClass = this.inferEpbdClass(building);
        const getImprovedClass = (subsetSize, total) => {
            const ratio = total > 0 ? subsetSize / total : 0;
            if (ratio >= 1.0)
                return 'A';
            if (ratio >= 0.7)
                return 'B';
            if (ratio >= 0.4)
                return 'C';
            if (ratio >= 0.2)
                return 'D';
            return currentClass;
        };
        // Escenario 1: Sin Mejoras
        const s1 = {
            id: 1,
            name: 'Sin Mejoras',
            description: 'Mantener estado actual',
            investment: 0,
            futureValue: marketValue,
            annualSavings: 0,
            epbdClass: currentClass,
            roiPct: 0,
            paybackYears: null,
            isOptimal: false,
            pros: [],
            cons: ['No cumple EPBD 2030', 'Depreciación del activo']
        };
        // Escenario 2: Básicas (LED + Solar)
        const r2 = calcScenario(basicImprovements);
        const s2 = {
            id: 2,
            name: 'Mejoras Básicas',
            description: 'LED + Solar básica',
            ...r2,
            epbdClass: getImprovedClass(basicImprovements.length, allImprovements.length),
            isOptimal: false,
            pros: ['Bajo riesgo'],
            cons: ['No cumple EPBD 2030']
        };
        // Escenario 3: Intermedias (LED + Solar + HVAC)
        const r3 = calcScenario(intermediateImprovements);
        const s3 = {
            id: 3,
            name: 'Mejoras Intermedias',
            description: 'LED + Solar + HVAC',
            ...r3,
            epbdClass: getImprovedClass(intermediateImprovements.length, allImprovements.length),
            isOptimal: false,
            pros: ['Equilibrio inversión/retorno'],
            cons: []
        };
        // Check if intermediate meets EPBD
        const s3Class = getImprovedClass(intermediateImprovements.length, allImprovements.length);
        if (['A', 'B', 'C', 'D'].includes(s3Class)) {
            s3.pros.push('Cumple EPBD 2030');
        }
        else {
            s3.cons.push('No cumple EPBD 2030');
        }
        // Escenario 4: Completas (Todas las mejoras) - ÓPTIMO
        const r4 = calcScenario(allImprovements);
        const s4 = {
            id: 4,
            name: 'Mejoras Completas',
            description: `Plan completo ${allImprovements.length} medidas`,
            ...r4,
            epbdClass: getImprovedClass(allImprovements.length, allImprovements.length),
            isOptimal: true,
            pros: ['Máximo valor de activo'],
            cons: []
        };
        if (r4.roiPct !== null) {
            s4.pros.push(`ROI óptimo ${r4.roiPct.toFixed(1)}%`);
        }
        // Escenario 5: Premium (Todas + certificación BREEAM +15%)
        const r5 = calcScenario(allImprovements, 1.25);
        const s5 = {
            id: 5,
            name: 'Mejoras Premium',
            description: 'Completas + BREEAM',
            ...r5,
            epbdClass: 'A+',
            isOptimal: false,
            pros: ['Certificación BREEAM'],
            cons: ['Payback más largo']
        };
        return [s1, s2, s3, s4, s5];
    }
    /**
     * Infiere la clase EPBD actual del edificio
     */
    inferEpbdClass(building) {
        const customData = building.customData || building.custom_data || {};
        if (customData.calificacion)
            return customData.calificacion;
        return 'G'; // Default worst case si no hay dato
    }
}
exports.FinancialAuditService = FinancialAuditService;
//# sourceMappingURL=financialAuditService.js.map