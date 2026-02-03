"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./setupMocks");
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
(0, vitest_1.describe)('Módulo Catastro API - Integration Tests', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('GET /catastroApi/provincias', () => {
        (0, vitest_1.it)('Debería obtener todas las provincias correctamente', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/catastroApi/provincias');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(Array.isArray(response.body)).toBe(true);
            (0, vitest_1.expect)(response.body[0]).toHaveProperty('np');
        });
    });
    (0, vitest_1.describe)('GET /catastroApi/municipios', () => {
        (0, vitest_1.it)('Debería obtener municipios pasando la provincia por query', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/catastroApi/municipios')
                .query({ provincia: 'MADRID' });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(Array.isArray(response.body)).toBe(true);
        });
    });
    (0, vitest_1.describe)('GET /catastroApi/vias', () => {
        (0, vitest_1.it)('Debería obtener las vías con parámetros obligatorios y opcionales', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/catastroApi/vias')
                .query({
                provincia: 'MADRID',
                municipio: 'MADRID',
                tipoVia: 'CL',
                nombreVia: 'ALCALA'
            });
            (0, vitest_1.expect)(response.status).toBe(200);
        });
    });
    (0, vitest_1.describe)('GET /catastroApi/inmuebleRc', () => {
        (0, vitest_1.it)('Debería obtener datos de un inmueble por Referencia Catastral', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/catastroApi/inmuebleRc')
                .query({ rc: '0226704VK4702E0001AY' });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toHaveProperty('rc');
        });
    });
    (0, vitest_1.describe)('GET /catastroApi/inmuebleLoc', () => {
        (0, vitest_1.it)('Debería manejar parámetros de localización (bloque, planta, etc.)', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/catastroApi/inmuebleLoc')
                .query({
                provincia: 'MADRID',
                municipio: 'MADRID',
                tipoVia: 'CL',
                nombreVia: 'MAYOR',
                numero: '1',
                planta: '2',
                puerta: 'B'
            });
            (0, vitest_1.expect)(response.status).toBe(200);
        });
    });
    (0, vitest_1.describe)('GET /catastroApi/inmuebleXY', () => {
        (0, vitest_1.it)('Debería obtener inmuebles por coordenadas X e Y', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/catastroApi/inmuebleXY')
                .query({ x: '440500', y: '4475000' });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(Array.isArray(response.body)).toBe(true);
        });
    });
});
//# sourceMappingURL=catastro.test.js.map