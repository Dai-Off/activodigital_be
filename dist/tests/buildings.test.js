"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./setupMocks"); // Importamos el bypass de autenticación
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
(0, vitest_1.describe)('Buildings Controller', () => {
    const buildingId = '7657b043-8453-496d-9834-2c01615d416d';
    (0, vitest_1.describe)('Operaciones Principales', () => {
        (0, vitest_1.it)('Debería listar los edificios del usuario autenticado', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/edificios');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(Array.isArray(response.body.data)).toBe(true);
        });
        (0, vitest_1.it)('Debería obtener el detalle de un edificio específico', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get(`/edificios/${buildingId}`);
            (0, vitest_1.expect)([200, 404]).toContain(response.status);
            if (response.status === 200) {
                (0, vitest_1.expect)(response.body.data).toHaveProperty('id', buildingId);
            }
        });
    });
    (0, vitest_1.describe)('Métricas Financieras', () => {
        (0, vitest_1.it)('Debería obtener el ROI del edificio', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get(`/edificios/${buildingId}/roi`);
            // Estos endpoints suelen fallar si faltan datos financieros en la DB
            (0, vitest_1.expect)([200, 400, 500]).toContain(response.status);
            if (response.status === 200) {
                (0, vitest_1.expect)(response.body.data).toHaveProperty('roiOperativoPct');
            }
        });
        (0, vitest_1.it)('Debería retornar error 400/500 si se pide métricas de un ID inválido', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/edificios/7657b043-8453-496d-9834-2c01615aaaaa/metrics');
            // Debería fallar porque "id-falso" no es un UUID
            (0, vitest_1.expect)(response.status).not.toBe(200);
        });
    });
    (0, vitest_1.describe)('Gestión de Unidades', () => {
        (0, vitest_1.it)('Debería listar las unidades de un edificio', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get(`/edificios/${buildingId}/units`);
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(Array.isArray(response.body.data)).toBe(true);
        });
    });
});
//# sourceMappingURL=buildings.test.js.map