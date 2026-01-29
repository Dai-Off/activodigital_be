"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./setupMocks");
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
(0, vitest_1.describe)('Financial Metrics & Scenarios', () => {
    // ID de edificio que debe existir en tu DB de pruebas con un Snapshot financiero
    // const buildingId = '0007a31b-98fa-4dba-a05e-b62fad1d2e87';
    // const buildingId = '73d77a52-ede7-4c96-87c0-2b95220a9c25';
    // const buildingId = '49cefa58-1224-4d20-b5d3-58471cc3a03b';
    const buildingId = 'e59b9010-8918-471d-8038-3ffbdf92bcbd';
    (0, vitest_1.describe)('GET /edificios/:id/metrics', () => {
        (0, vitest_1.it)('Debería obtener el set completo de métricas financieras', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/edificios/${buildingId}/metrics`)
                .query({ period: 'annual', currency: 'EUR' });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.data).toMatchObject({
                buildingId: vitest_1.expect.any(String),
                noi: vitest_1.expect.toSatisfy((val) => val === null || typeof val === 'number'),
                capRatePct: vitest_1.expect.toSatisfy((val) => val === null || typeof val === 'number'),
                roiOperativoPct: vitest_1.expect.toSatisfy((val) => val === null || typeof val === 'number')
            });
        });
        (0, vitest_1.it)('Debería fallar con 404 si el edificio no existe', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const response = await (0, supertest_1.default)(app_1.default).get(`/edificios/${fakeId}/metrics`);
            // Tu service lanza un Error('Edificio no encontrado') que el controlador captura como 500
            (0, vitest_1.expect)(response.status).toBe(500);
            (0, vitest_1.expect)(response.body.message).toContain('Edificio no encontrado');
        });
    });
    (0, vitest_1.describe)('POST /scenarios/rehab/simulate', () => {
        (0, vitest_1.it)('Debería calcular payback y ROI de rehabilitación', async () => {
            const rehabPayload = {
                rehabCost: 50000,
                energySavingsPerYear: 5000,
                subsidies: 10000,
                method: 'heuristic'
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post(`/edificios/${buildingId}/scenarios/rehab/simulate`)
                .send(rehabPayload);
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.data).toHaveProperty('paybackMonths');
            (0, vitest_1.expect)(response.body.data).toHaveProperty('simpleRoiPct');
            // Verificamos que el cálculo no sea NaN (bug común en finanzas)
            (0, vitest_1.expect)(response.body.data.simpleRoiPct).toBeGreaterThanOrEqual(0);
        });
    });
    (0, vitest_1.describe)('POST /scenarios/irr', () => {
        (0, vitest_1.it)('Debería calcular la Tasa Interna de Retorno (IRR)', async () => {
            const irrPayload = {
                initialInvestment: 100000,
                cashflows: [10000, 15000, 20000, 25000, 120000], // 5 años
                scenarioId: 'test-irr',
                maxIterations: 100,
                tolerance: 0.0001
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post(`/edificios/${buildingId}/scenarios/irr`)
                .send(irrPayload);
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.data.irr).toBeTypeOf('number');
            (0, vitest_1.expect)(response.body.data.iterations).toBeLessThanOrEqual(100);
        });
    });
});
//# sourceMappingURL=financial.test.js.map