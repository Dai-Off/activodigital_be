"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingScenariosController = void 0;
const financialMetricsService_1 = require("../../domain/services/financialMetricsService");
class BuildingScenariosController {
    constructor() {
        /**
         * POST /buildings/:id/scenarios/rehab/simulate
         * Simula una rehabilitación y calcula payback y ROI
         */
        this.simulateRehab = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const { id: buildingId } = req.params;
                const request = req.body;
                // Validación básica
                if (!request.rehabCost || request.rehabCost < 0) {
                    res.status(400).json({ error: 'rehabCost es requerido y debe ser >= 0' });
                    return;
                }
                const result = await this.getService().simulateRehab(buildingId, userId, request);
                res.json({ data: result });
            }
            catch (error) {
                console.error('Error al simular rehabilitación:', error);
                res.status(500).json({
                    error: 'Error interno del servidor',
                    message: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        };
        /**
         * POST /buildings/:id/scenarios/cashflow/run
         * Genera flujos de caja proyectados
         */
        this.runCashflow = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const { id: buildingId } = req.params;
                const request = req.body;
                // Validación básica
                if (request.years && (request.years < 1 || request.years > 30)) {
                    res.status(400).json({ error: 'years debe estar entre 1 y 30' });
                    return;
                }
                if (request.discountRate && (request.discountRate < 0 || request.discountRate > 1)) {
                    res.status(400).json({ error: 'discountRate debe estar entre 0 y 1' });
                    return;
                }
                const result = await this.getService().runCashflow(buildingId, userId, request);
                res.json({ data: result });
            }
            catch (error) {
                console.error('Error al generar flujos de caja:', error);
                res.status(500).json({
                    error: 'Error interno del servidor',
                    message: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        };
        /**
         * POST /buildings/:id/scenarios/npv
         * Calcula el NPV (Net Present Value)
         */
        this.calculateNPV = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const { id: buildingId } = req.params;
                const request = req.body;
                // Validación básica
                if (!request.discountRate || request.discountRate < 0 || request.discountRate > 1) {
                    res.status(400).json({ error: 'discountRate es requerido y debe estar entre 0 y 1' });
                    return;
                }
                if (!request.cashflows || !Array.isArray(request.cashflows) || request.cashflows.length === 0) {
                    res.status(400).json({ error: 'cashflows es requerido y debe ser un array no vacío' });
                    return;
                }
                if (request.initialInvestment === undefined || request.initialInvestment === null) {
                    res.status(400).json({ error: 'initialInvestment es requerido' });
                    return;
                }
                const result = await this.getService().calculateNPV(buildingId, userId, request);
                res.json({ data: result });
            }
            catch (error) {
                console.error('Error al calcular NPV:', error);
                res.status(500).json({
                    error: 'Error interno del servidor',
                    message: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        };
        /**
         * POST /buildings/:id/scenarios/irr
         * Calcula el IRR (Internal Rate of Return)
         */
        this.calculateIRR = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const { id: buildingId } = req.params;
                const request = req.body;
                // Validación básica
                if (!request.cashflows || !Array.isArray(request.cashflows) || request.cashflows.length === 0) {
                    res.status(400).json({ error: 'cashflows es requerido y debe ser un array no vacío' });
                    return;
                }
                if (request.initialInvestment === undefined || request.initialInvestment === null) {
                    res.status(400).json({ error: 'initialInvestment es requerido' });
                    return;
                }
                const result = await this.getService().calculateIRR(buildingId, userId, request);
                res.json({ data: result });
            }
            catch (error) {
                console.error('Error al calcular IRR:', error);
                res.status(500).json({
                    error: 'Error interno del servidor',
                    message: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        };
        /**
         * POST /buildings/:id/scenarios/sensitivity
         * Calcula análisis de sensibilidad del NPV
         */
        this.calculateSensitivity = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const { id: buildingId } = req.params;
                const request = req.body;
                // Validación básica
                if (!request.baseDiscountRate || request.baseDiscountRate < 0 || request.baseDiscountRate > 1) {
                    res.status(400).json({ error: 'baseDiscountRate es requerido y debe estar entre 0 y 1' });
                    return;
                }
                if (!request.baseCashflows || !Array.isArray(request.baseCashflows) || request.baseCashflows.length === 0) {
                    res.status(400).json({ error: 'baseCashflows es requerido y debe ser un array no vacío' });
                    return;
                }
                if (request.initialInvestment === undefined || request.initialInvestment === null) {
                    res.status(400).json({ error: 'initialInvestment es requerido' });
                    return;
                }
                const result = await this.getService().calculateSensitivity(buildingId, userId, request);
                res.json({ data: result });
            }
            catch (error) {
                console.error('Error al calcular sensibilidad:', error);
                res.status(500).json({
                    error: 'Error interno del servidor',
                    message: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        };
    }
    getService() {
        return new financialMetricsService_1.FinancialMetricsService();
    }
}
exports.BuildingScenariosController = BuildingScenariosController;
//# sourceMappingURL=buildingScenariosController.js.map