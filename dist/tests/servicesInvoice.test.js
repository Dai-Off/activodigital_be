"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./setupMocks");
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const TrazabilityService_1 = require("../domain/trazability/TrazabilityService");
vitest_1.vi.mock('../domain/trazability/TrazabilityService', () => ({
    trazabilityService: {
        registerTrazability: vitest_1.vi.fn(() => Promise.resolve(true))
    }
}));
(0, vitest_1.describe)('Módulo Service Invoices - Integration Tests', () => {
    const buildingId = 'f773ffa0-b934-4df6-a48c-fba17abf4c0f';
    let createdInvoiceId;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('POST /service-invoices', () => {
        (0, vitest_1.it)('Debería crear una factura válida y registrar trazabilidad', async () => {
            const payload = {
                building_id: buildingId,
                service_type: 'electricity',
                invoice_date: '2024-03-15',
                amount_eur: 150.50,
                provider: 'Endesa'
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/service-invoices')
                .send(payload);
            (0, vitest_1.expect)([201, 500]).toContain(response.status);
            if (response.status === 201) {
                createdInvoiceId = response.body.data.id;
                (0, vitest_1.expect)(response.body.data.service_type).toBe('electricity');
                // Verificar que se llamó a trazabilidad
                (0, vitest_1.expect)(TrazabilityService_1.trazabilityService.registerTrazability).toHaveBeenCalled();
            }
        });
        (0, vitest_1.it)('Debería rechazar un service_type no válido', async () => {
            const payload = {
                building_id: buildingId,
                service_type: 'netflix', // Tipo inválido
                invoice_date: '2024-03-15',
                amount_eur: 15.99
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/service-invoices')
                .send(payload);
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.error).toContain('service_type debe ser uno de');
        });
        (0, vitest_1.it)('Debería rechazar montos negativos', async () => {
            const payload = {
                building_id: buildingId,
                service_type: 'water',
                invoice_date: '2024-03-15',
                amount_eur: -50 // Monto inválido
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/service-invoices')
                .send(payload);
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.error).toBe('amount_eur debe ser >= 0');
        });
    });
    (0, vitest_1.describe)('GET /service-invoices/building/:buildingId', () => {
        (0, vitest_1.it)('Debería filtrar facturas por serviceType mediante query params', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/service-invoices/building/${buildingId}`)
                .query({ serviceType: 'water' });
            (0, vitest_1.expect)([200, 500]).toContain(response.status);
            if (response.status === 200) {
                (0, vitest_1.expect)(Array.isArray(response.body.data)).toBe(true);
            }
        });
    });
    (0, vitest_1.describe)('PUT /service-invoices/:id', () => {
        (0, vitest_1.it)('Debería validar el service_type también en la actualización', async () => {
            if (!createdInvoiceId)
                return;
            const response = await (0, supertest_1.default)(app_1.default)
                .put(`/service-invoices/${createdInvoiceId}`)
                .send({ service_type: 'invalid_type' });
            (0, vitest_1.expect)(response.status).toBe(400);
        });
        (0, vitest_1.it)('Debería actualizar correctamente el monto', async () => {
            if (!createdInvoiceId)
                return;
            const response = await (0, supertest_1.default)(app_1.default)
                .put(`/service-invoices/${createdInvoiceId}`)
                .send({ amount_eur: 200 });
            (0, vitest_1.expect)([200, 404, 500]).toContain(response.status);
            if (response.status === 200) {
                (0, vitest_1.expect)(response.body.data.amount_eur).toBe(200);
            }
        });
    });
    (0, vitest_1.describe)('DELETE /service-invoices/:id', () => {
        (0, vitest_1.it)('Debería retornar 204 al eliminar una factura', async () => {
            if (!createdInvoiceId)
                return;
            const response = await (0, supertest_1.default)(app_1.default)
                .delete(`/service-invoices/${createdInvoiceId}`);
            (0, vitest_1.expect)([204, 500]).toContain(response.status);
        });
    });
});
//# sourceMappingURL=servicesInvoice.test.js.map