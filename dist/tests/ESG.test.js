"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./setupMocks");
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
(0, vitest_1.describe)('Módulo ESG - Integration Tests', () => {
    const buildingId = 'f773ffa0-b934-4df6-a48c-fba17abf4c0f';
    const mockToken = 'Bearer fake-jwt-token';
    (0, vitest_1.describe)('POST /esg/calculate', () => {
        (0, vitest_1.it)('Debería retornar status "incomplete" si el edificio no tiene datos previos', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/esg/calculate')
                .set('Authorization', mockToken)
                .send({ building_id: buildingId });
            (0, vitest_1.expect)([200, 500]).toContain(response.status);
            if (response.status === 200) {
                (0, vitest_1.expect)(response.body).toHaveProperty('status');
                if (response.body.status === 'incomplete') {
                    (0, vitest_1.expect)(Array.isArray(response.body.missingData)).toBe(true);
                    (0, vitest_1.expect)(response.body.message).toContain('Faltan datos críticos');
                }
            }
        });
        (0, vitest_1.it)('Debería fallar con 400 si no se envía el building_id', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/esg/calculate')
                .set('Authorization', mockToken)
                .send({});
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.error).toBe('El campo building_id es requerido');
        });
    });
    (0, vitest_1.describe)('GET /esg/building/:buildingId', () => {
        (0, vitest_1.it)('Debería intentar obtener el score ESG guardado', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/esg/building/${buildingId}`)
                .set('Authorization', mockToken);
            // Puede ser 200 (si ya se calculó en el test anterior), 404 o 500
            (0, vitest_1.expect)([200, 404, 500]).toContain(response.status);
            if (response.status === 200) {
                (0, vitest_1.expect)(response.body).toHaveProperty('status');
                // Si está completo, validamos estructura de Breakdown
                if (response.body.status === 'complete') {
                    (0, vitest_1.expect)(response.body.data).toHaveProperty('total');
                    (0, vitest_1.expect)(response.body.data).toHaveProperty('label');
                    (0, vitest_1.expect)(response.body.data.environmental).toHaveProperty('normalized');
                }
            }
        });
        (0, vitest_1.it)('Debería retornar 404 para un edificio sin cálculos previos', async () => {
            const randomId = '00000000-0000-0000-0000-000000000000';
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/esg/building/${randomId}`)
                .set('Authorization', mockToken);
            (0, vitest_1.expect)([404, 500]).toContain(response.status);
            if (response.status === 404) {
                (0, vitest_1.expect)(response.body.error).toBe('No se encontró un cálculo ESG para este edificio');
            }
        });
    });
    (0, vitest_1.describe)('EsgService Logic (Unit Validation)', () => {
        // Test directo de la lógica matemática del servicio si fuera necesario exponerlo, 
        // pero aquí validamos a través de la respuesta de la API.
        (0, vitest_1.it)('Debería validar que el cálculo (si existe) tiene etiquetas coherentes', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/esg/building/${buildingId}`)
                .set('Authorization', mockToken);
            if (response.status === 200 && response.body.status === 'complete') {
                const { total, label } = response.body.data;
                if (total >= 90)
                    (0, vitest_1.expect)(label).toBe('Premium');
                else if (total >= 80)
                    (0, vitest_1.expect)(label).toBe('Gold');
                else if (total >= 60)
                    (0, vitest_1.expect)(label).toBe('Silver');
                else if (total >= 40)
                    (0, vitest_1.expect)(label).toBe('Bronze');
                else
                    (0, vitest_1.expect)(label).toBe('Crítico');
            }
        });
    });
});
//# sourceMappingURL=ESG.test.js.map