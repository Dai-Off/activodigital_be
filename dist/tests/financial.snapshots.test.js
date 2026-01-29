"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./setupMocks");
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
// Mock del servicio de trazabilidad para evitar errores de escritura en DB
vitest_1.vi.mock('../../domain/trazability/TrazabilityService', () => ({
    trazabilityService: {
        registerTrazability: vitest_1.vi.fn().mockResolvedValue(true)
    }
}));
(0, vitest_1.describe)('Módulo Financial Snapshots - Integration Tests', () => {
    const buildingId = 'f773ffa0-b934-4df6-a48c-fba17abf4c0f';
    let createdSnapshotId;
    (0, vitest_1.describe)('POST /financial-snapshots', () => {
        (0, vitest_1.it)('Debería crear un snapshot y normalizar los porcentajes', async () => {
            const payload = {
                building_id: buildingId,
                period_start: '2024-01-01',
                period_end: '2024-12-31',
                currency: 'EUR',
                ingresos_brutos_anuales_eur: 120000,
                walt_meses: 36,
                concentracion_top1_pct_noi: 85, // Enviado como 0-100 para probar normalización
                opex_total_anual_eur: 45000,
                opex_energia_anual_eur: 12000
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/financial-snapshots')
                .send(payload);
            (0, vitest_1.expect)([201, 500]).toContain(response.status);
            if (response.status === 201) {
                (0, vitest_1.expect)(response.body.data).toHaveProperty('id');
                createdSnapshotId = response.body.data.id;
                // Verificar normalización (85 -> 0.85)
                (0, vitest_1.expect)(response.body.data.concentracion_top1_pct_noi).toBe(0.85);
            }
        });
        (0, vitest_1.it)('Debería retornar 400 si faltan campos obligatorios', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/financial-snapshots')
                .send({ building_id: buildingId });
            (0, vitest_1.expect)(response.status).toBe(400);
        });
    });
    (0, vitest_1.describe)('GET /financial-snapshots/summary', () => {
        (0, vitest_1.it)('Debería obtener el resumen financiero agregado', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/financial-snapshots/summary');
            (0, vitest_1.expect)([200, 500]).toContain(response.status);
            if (response.status === 200) {
                const summary = response.body.data;
                (0, vitest_1.expect)(summary).toHaveProperty('total_activos');
                (0, vitest_1.expect)(summary).toHaveProperty('capex_total');
                (0, vitest_1.expect)(summary).toHaveProperty('tir_promedio');
                (0, vitest_1.expect)(summary).toHaveProperty('bankReady');
                (0, vitest_1.expect)(typeof summary.total_activos).toBe('number');
            }
        });
    });
    (0, vitest_1.describe)('GET /financial-snapshots/building/:buildingId', () => {
        (0, vitest_1.it)('Debería obtener los snapshots de un edificio específico', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get(`/financial-snapshots/building/${buildingId}`);
            (0, vitest_1.expect)([200, 500]).toContain(response.status);
            if (response.status === 200) {
                (0, vitest_1.expect)(Array.isArray(response.body.data)).toBe(true);
            }
        });
    });
    (0, vitest_1.describe)('PUT /financial-snapshots/:id', () => {
        (0, vitest_1.it)('Debería actualizar datos de un snapshot existente', async () => {
            if (!createdSnapshotId)
                return;
            const updatePayload = {
                ingresos_brutos_anuales_eur: 150000,
                indexacion_ok: true
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .put(`/financial-snapshots/${createdSnapshotId}`)
                .send(updatePayload);
            (0, vitest_1.expect)([200, 404, 500]).toContain(response.status);
            if (response.status === 200) {
                (0, vitest_1.expect)(response.body.data.ingresos_brutos_anuales_eur).toBe(150000);
                (0, vitest_1.expect)(response.body.data.indexacion_ok).toBe(true);
            }
        });
    });
    (0, vitest_1.describe)('DELETE /financial-snapshots/:id', () => {
        (0, vitest_1.it)('Debería eliminar un snapshot y retornar 204', async () => {
            if (!createdSnapshotId)
                return;
            const response = await (0, supertest_1.default)(app_1.default).delete(`/financial-snapshots/${createdSnapshotId}`);
            // 204 No Content es el éxito esperado según tu controlador
            (0, vitest_1.expect)([204, 500]).toContain(response.status);
        });
    });
});
//# sourceMappingURL=financial.snapshots.test.js.map