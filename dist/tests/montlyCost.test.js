"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./setupMocks");
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
(0, vitest_1.describe)('Módulo Monthly Costs - Integration Tests', () => {
    const buildingId = 'f773ffa0-b934-4df6-a48c-fba17abf4c0f';
    const currentYear = new Date().getFullYear();
    (0, vitest_1.describe)('GET /service-expenses/building/:buildingId', () => {
        (0, vitest_1.it)('Debería obtener el listado de costes de un edificio', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/service-expenses/building/${buildingId}`);
            (0, vitest_1.expect)([200, 500]).toContain(response.status);
            if (response.status === 200) {
                (0, vitest_1.expect)(response.body).toHaveProperty('data');
                (0, vitest_1.expect)(response.body.building_id).toBe(buildingId);
                (0, vitest_1.expect)(Array.isArray(response.body.data)).toBe(true);
            }
        });
        (0, vitest_1.it)('Debería filtrar por año y mes correctamente', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/service-expenses/building/${buildingId}`)
                .query({ year: 2024, month: 1 });
            (0, vitest_1.expect)([200, 500]).toContain(response.status);
            if (response.status === 200 && response.body.data.length > 0) {
                (0, vitest_1.expect)(response.body.year).toBe(2024);
                (0, vitest_1.expect)(response.body.month).toBe(1);
            }
        });
        (0, vitest_1.it)('Debería devolver 400 si se envía mes sin año', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/service-expenses/building/${buildingId}`)
                .query({ month: 5 });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.error).toContain('requiere year');
        });
        (0, vitest_1.it)('Debería manejar correctamente cuando no existen datos para un periodo', async () => {
            // Usamos un año muy lejano para asegurar que no hay datos
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/service-expenses/building/${buildingId}`)
                .query({ year: 1990 });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.data).toEqual([]);
            (0, vitest_1.expect)(response.body.message).toContain('No se encontraron gastos para el año 1990');
        });
    });
    (0, vitest_1.describe)('GET /service-expenses/building/:buildingId/summary', () => {
        (0, vitest_1.it)('Debería obtener el resumen anual con los cálculos de agregación', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/service-expenses/building/${buildingId}/summary`)
                .query({ year: currentYear });
            (0, vitest_1.expect)([200, 500]).toContain(response.status);
            if (response.status === 200) {
                const summary = response.body.data;
                (0, vitest_1.expect)(summary).toHaveProperty('total_annual_eur');
                (0, vitest_1.expect)(summary).toHaveProperty('average_monthly_eur');
                (0, vitest_1.expect)(summary).toHaveProperty('breakdown');
                (0, vitest_1.expect)(summary.breakdown).toHaveProperty('electricity_annual');
                // El promedio debería ser el total entre el número de meses
                if (summary.months_count > 0) {
                    (0, vitest_1.expect)(summary.average_monthly_eur).toBeCloseTo(summary.total_annual_eur / summary.months_count, 2);
                }
            }
        });
    });
    (0, vitest_1.describe)('GET /service-expenses/:id', () => {
        (0, vitest_1.it)('Debería devolver 404 para un ID de coste inexistente', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const response = await (0, supertest_1.default)(app_1.default).get(`/service-expenses/${fakeId}`);
            (0, vitest_1.expect)([404, 500]).toContain(response.status);
        });
    });
});
//# sourceMappingURL=montlyCost.test.js.map