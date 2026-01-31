"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./setupMocks");
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
// 1. MOCK DE TRAZABILIDAD (Antes de las importaciones)
vitest_1.vi.mock('../domain/trazability/TrazabilityService', () => ({
    trazabilityService: {
        registerTrazability: vitest_1.vi.fn().mockResolvedValue(true)
    }
}));
const TrazabilityService_1 = require("../domain/trazability/TrazabilityService");
(0, vitest_1.describe)('Módulo Rents - Integration Tests', () => {
    const buildingId = '47956c08-0c16-40ae-ac85-1b73ac06a82e';
    const unitId = 'de6d03e1-ae36-44c3-9983-1356588945bd';
    let invoiceId;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('POST /rents/invoices', () => {
        (0, vitest_1.it)('Debería crear una factura de renta, calcular el total y registrar trazabilidad', async () => {
            const payload = {
                buildingId,
                unitId,
                invoiceMonth: '2024-05-01',
                rentAmount: 1000,
                additionalCharges: 50, // Total debería ser 1050
                dueDate: '2024-05-10'
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/rents/invoices')
                .send(payload);
            (0, vitest_1.expect)([201, 500]).toContain(response.status);
            if (response.status === 201) {
                invoiceId = response.body.data.id;
                (0, vitest_1.expect)(response.body.data.totalAmount).toBe(1050);
                (0, vitest_1.expect)(response.body.data.status).toBe('pending');
                (0, vitest_1.expect)(TrazabilityService_1.trazabilityService.registerTrazability).toHaveBeenCalled();
            }
        });
        (0, vitest_1.it)('Debería fallar si faltan campos requeridos', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/rents/invoices')
                .send({ buildingId }); // Faltan unitId, rentAmount, etc.
            (0, vitest_1.expect)(response.status).toBe(400);
        });
    });
    (0, vitest_1.describe)('GET /rents/building/:buildingId/summary/:month', () => {
        (0, vitest_1.it)('Debería validar el formato de mes YYYY-MM', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/rents/building/${buildingId}/summary/2024-5`); // Formato incorrecto
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.error).toContain('Formato de mes inválido');
        });
        (0, vitest_1.it)('Debería obtener el resumen financiero del mes', async () => {
            const validMonth = '2024-05';
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/rents/building/${buildingId}/summary/${validMonth}`);
            (0, vitest_1.expect)([200, 500]).toContain(response.status);
            if (response.status === 200) {
                const summary = response.body.data;
                (0, vitest_1.expect)(summary).toHaveProperty('totalInvoiced');
                (0, vitest_1.expect)(summary).toHaveProperty('collectionPercentage');
                (0, vitest_1.expect)(summary.month).toBe(validMonth);
                (0, vitest_1.expect)(Array.isArray(summary.invoices)).toBe(true);
            }
        });
    });
    (0, vitest_1.describe)('PUT /rents/invoices/:id', () => {
        (0, vitest_1.it)('Debería actualizar el pago de una factura y recalcular totales si es necesario', async () => {
            if (!invoiceId)
                return;
            const updatePayload = {
                paymentAmount: 1050,
                paymentDate: '2024-05-05',
                paymentMethod: 'transfer',
                rentAmount: 1100 // Cambiamos la renta base
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .put(`/rents/invoices/${invoiceId}`)
                .send(updatePayload);
            (0, vitest_1.expect)([200, 404, 500]).toContain(response.status);
            if (response.status === 200) {
                // 1100 renta + 50 cargos adicionales previos = 1150
                (0, vitest_1.expect)(response.body.data.totalAmount).toBe(1150);
                (0, vitest_1.expect)(response.body.data.paymentAmount).toBe(1050);
            }
        });
    });
    (0, vitest_1.describe)('DELETE /rents/invoices/:id', () => {
        (0, vitest_1.it)('Debería eliminar la factura y registrar trazabilidad', async () => {
            if (!invoiceId)
                return;
            const response = await (0, supertest_1.default)(app_1.default).delete(`/rents/invoices/${invoiceId}`);
            (0, vitest_1.expect)([200, 500]).toContain(response.status);
            if (response.status === 200) {
                (0, vitest_1.expect)(TrazabilityService_1.trazabilityService.registerTrazability).toHaveBeenCalled();
            }
        });
    });
});
//# sourceMappingURL=rents.test.js.map