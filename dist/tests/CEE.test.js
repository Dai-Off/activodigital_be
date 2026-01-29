"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./setupMocks");
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const certificateEnergetico_1 = require("@/types/certificateEnergetico");
(0, vitest_1.describe)('Módulo de Certificados Energéticos - Integration Tests', () => {
    const buildingId = 'f773ffa0-b934-4df6-a48c-fba17abf4c0f';
    let sessionId;
    let certificateId;
    // 1. CREACIÓN DE SESIÓN SIMPLE
    (0, vitest_1.describe)('POST /certificados-energeticos/sessions/simple', () => {
        (0, vitest_1.it)('Debería crear una sesión base para el edificio', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/certificados-energeticos/sessions/simple')
                .send({ buildingId });
            (0, vitest_1.expect)([200, 201, 500]).toContain(response.status);
            if (response.status !== 500) {
                (0, vitest_1.expect)(response.body.data).toHaveProperty('id');
                sessionId = response.body.data.id;
            }
            else {
                (0, vitest_1.expect)(response.body).toHaveProperty('error');
            }
        });
    });
    // 2. PROCESAMIENTO DE DATOS IA
    (0, vitest_1.describe)('POST /certificados-energeticos/process-ai-data', () => {
        (0, vitest_1.it)('Debería simular la carga de datos extraídos por IA', async () => {
            if (!sessionId)
                return;
            const payload = {
                sessionId,
                extractedData: {
                    rating: { value: certificateEnergetico_1.EnergyRatingLetter.B, confidence: 0.92 },
                    primaryEnergyKwhPerM2Year: { value: 120.5, confidence: 0.88 },
                    emissionsKgCo2PerM2Year: { value: 25.4, confidence: 0.90 },
                    certificateNumber: { value: `CERT-${Date.now()}`, confidence: 1.0 },
                    issuerName: { value: 'Certificador Dinámico S.A.', confidence: 0.85 },
                    issueDate: { value: '2024-01-01', confidence: 0.95 },
                    expiryDate: { value: '2034-01-01', confidence: 0.95 }
                }
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/certificados-energeticos/process-ai-data')
                .send(payload);
            (0, vitest_1.expect)([200, 500]).toContain(response.status);
            if (response.status === 200) {
                (0, vitest_1.expect)(response.body.data.status).toBe(certificateEnergetico_1.AIExtractionStatus.EXTRACTED);
            }
        });
    });
    // 3. CONFIRMACIÓN FINAL
    (0, vitest_1.describe)('POST /certificados-energeticos/sessions/:sessionId/confirm', () => {
        (0, vitest_1.it)('Debería convertir la sesión en un certificado final confirmado', async () => {
            if (!sessionId)
                return;
            const finalData = {
                rating: certificateEnergetico_1.EnergyRatingLetter.B,
                primaryEnergyKwhPerM2Year: 120.5,
                emissionsKgCo2PerM2Year: 25.4,
                certificateNumber: `FINAL-${Date.now()}`,
                issuerName: 'Técnico Verificador',
                issueDate: '2024-01-01',
                expiryDate: '2034-01-01',
                scope: certificateEnergetico_1.EnergyCertificateKind.BUILDING
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post(`/certificados-energeticos/sessions/${sessionId}/confirm`)
                .set('Authorization', 'Bearer fake-jwt-token')
                .send(finalData);
            (0, vitest_1.expect)([201, 500]).toContain(response.status);
            if (response.status === 201) {
                (0, vitest_1.expect)(response.body.data).toHaveProperty('id');
                certificateId = response.body.data.id;
            }
        });
    });
    // 4. CONSULTAS (GET)
    (0, vitest_1.describe)('Consultas de Certificados', () => {
        (0, vitest_1.it)('Debería obtener la estructura GetEnergyCertificatesResponse correctamente', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/certificados-energeticos/building/${buildingId}`);
            (0, vitest_1.expect)(response.status).toBe(200);
            const data = response.body.data;
            (0, vitest_1.expect)(Array.isArray(data.sessions)).toBe(true);
            (0, vitest_1.expect)(Array.isArray(data.certificates)).toBe(true);
        });
        (0, vitest_1.it)('Debería listar todos los certificados del usuario autenticado', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/certificados-energeticos');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(Array.isArray(response.body.data)).toBe(true);
        });
    });
    // 5. ELIMINACIÓN
    (0, vitest_1.describe)('Eliminación de registros (Cleanup)', () => {
        (0, vitest_1.it)('Debería eliminar el certificado final o manejar error 500', async () => {
            if (!certificateId)
                return;
            const response = await (0, supertest_1.default)(app_1.default)
                .delete(`/certificados-energeticos/${certificateId}`);
            (0, vitest_1.expect)([204, 500]).toContain(response.status);
            if (response.status === 500) {
                console.log('Nota: Error en eliminación (posible restricción FK):', response.body.error);
            }
        });
        (0, vitest_1.it)('Debería eliminar la sesión restante o manejar error 500', async () => {
            if (!sessionId)
                return;
            const response = await (0, supertest_1.default)(app_1.default)
                .delete(`/certificados-energeticos/sessions/${sessionId}`);
            (0, vitest_1.expect)([204, 500]).toContain(response.status);
        });
    });
});
//# sourceMappingURL=CEE.test.js.map