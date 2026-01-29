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
// Mock de la Trazabilidad para verificar que se llame
vitest_1.vi.mock('../domain/trazability/TrazabilityService', () => ({
    trazabilityService: {
        registerTrazability: vitest_1.vi.fn().mockResolvedValue({})
    }
}));
(0, vitest_1.describe)('Módulo Insurance (Seguros) - Integration Tests', () => {
    const mockToken = 'Bearer valid-token';
    let insuranceId = '';
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('GET /insurances', () => {
        (0, vitest_1.it)('Debería obtener los seguros de un edificio pasando buildingId', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/insurances')
                .set('Authorization', mockToken)
                .query({ buildingId: '7657b043-8453-496d-9834-2c01615d416d' });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toHaveProperty('data');
            (0, vitest_1.expect)(response.body).toHaveProperty('count');
        });
        (0, vitest_1.it)('Debería fallar (400) si no se proporciona buildingId', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/insurances')
                .set('Authorization', mockToken);
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.error).toBe('buildingId es requerido');
        });
    });
    (0, vitest_1.describe)('POST /insurances', () => {
        const newPolicy = {
            buildingId: '7657b043-8453-496d-9834-2c01615d416d',
            policyNumber: 'POL-777',
            insurer: 'Allianz',
            status: 'active',
            annualPremium: 1200,
            coverageType: 'Todo Riesgo',
            issueDate: '2025-01-01',
            expirationDate: '2026-01-01',
            coverageDetails: { incendio: true }
        };
        (0, vitest_1.it)('Debería crear una póliza y registrar trazabilidad', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/insurances')
                .set('Authorization', mockToken)
                .send(newPolicy);
            (0, vitest_1.expect)(response.status).toBe(201);
            (0, vitest_1.expect)(response.body.message).toContain('éxito');
            // Verificamos que se llamó a trazabilidad
            (0, vitest_1.expect)(TrazabilityService_1.trazabilityService.registerTrazability).toHaveBeenCalled();
            console.log(response.body.data?.id);
            insuranceId = response.body.data?.id;
        });
        (0, vitest_1.it)('Debería fallar si faltan campos obligatorios', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/insurances')
                .set('Authorization', mockToken)
                .send({ buildingId: '7657b043-8453-496d-9834-2c01615d416d' }); // Faltan policyNumber e insurer
            (0, vitest_1.expect)(response.status).toBe(400);
        });
    });
    (0, vitest_1.describe)('PUT /insurances/:id', () => {
        (0, vitest_1.it)('Debería actualizar una póliza existente', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .put(`/insurances/${insuranceId}`)
                .set('Authorization', mockToken)
                .send({ status: 'expired' });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.data.status).toBe('expired');
        });
    });
    (0, vitest_1.describe)('DELETE /insurances/:id', () => {
        (0, vitest_1.it)('Debería eliminar una póliza correctamente', async () => {
            // Necesitamos que el mock de "delete" devuelva éxito
            const response = await (0, supertest_1.default)(app_1.default)
                .delete(`/insurances/${insuranceId}`)
                .set('Authorization', mockToken);
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
        });
    });
});
//# sourceMappingURL=insurances.test.js.map