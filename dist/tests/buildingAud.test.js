"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./setupMocks");
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
(0, vitest_1.describe)('Building Units, Audits & Metrics GETs', () => {
    const buildingId = '73d77a52-ede7-4c96-87c0-2b95220a9c25';
    // --- GRUPO DE AUDITORÍAS ---
    (0, vitest_1.describe)('Audits', () => {
        (0, vitest_1.it)('Debería obtener la auditoría técnica del edificio', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get(`/edificios/${buildingId}/audits/technical`);
            (0, vitest_1.expect)(response.status).toBe(200);
        });
        (0, vitest_1.it)('Debería obtener la auditoría financiera del edificio', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get(`/edificios/${buildingId}/audits/financial`);
            (0, vitest_1.expect)(response.status).toBe(200);
        });
    });
    // --- GRUPO DE MÉTRICAS INDIVIDUALES ---
    (0, vitest_1.describe)('Financial Metrics Individual Endpoints', () => {
        const metrics = ['roi', 'cap-rate', 'noi', 'dscr', 'opex-ratio', 'value-gap'];
        metrics.forEach((metric) => {
            (0, vitest_1.it)(`Debería obtener la métrica: ${metric.toUpperCase()}`, async () => {
                const response = await (0, supertest_1.default)(app_1.default).get(`/edificios/${buildingId}/${metric}`);
                (0, vitest_1.expect)(response.status).toBe(200);
                (0, vitest_1.expect)(response.body).toHaveProperty('data');
            });
        });
    });
    // --- GRUPO DE UNIDADES ---
    (0, vitest_1.describe)('Building Units', () => {
        (0, vitest_1.it)('Debería listar todas las unidades del edificio', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get(`/edificios/${buildingId}/units`);
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(Array.isArray(response.body.data)).toBe(true);
        });
    });
    // --- OPERACIONES POST DE VALIDACIÓN Y CARGA ---
    (0, vitest_1.describe)('Management & Assignments', () => {
        (0, vitest_1.it)('Debería validar asignaciones de usuarios correctamente', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/edificios/validate-assignments')
                .send({
                technicianEmail: 'martiingadeea1996@gmail.com'
            });
            if (response.status !== 200) {
                console.log('Error Body:', response.body);
            }
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toHaveProperty('data');
            (0, vitest_1.expect)(response.body.data).toHaveProperty('technicianValidation');
        });
        (0, vitest_1.it)('Debería fallar (400) si no se envían emails en la validación', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/edificios/validate-assignments')
                .send({}); // Body vacío
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.error).toBe('Se requiere al menos un email para validar');
        });
        (0, vitest_1.it)('Debería crear o actualizar unidades (Upsert)', async () => {
            const unitsPayload = [
                { unit_number: '1A', floor: 1, square_meters: 50 },
                { unit_number: '1B', floor: 1, square_meters: 65 }
            ];
            const response = await (0, supertest_1.default)(app_1.default)
                .post(`/edificios/${buildingId}/units`)
                .send(unitsPayload);
            (0, vitest_1.expect)([200, 201]).toContain(response.status);
        });
    });
});
//# sourceMappingURL=buildingAud.test.js.map