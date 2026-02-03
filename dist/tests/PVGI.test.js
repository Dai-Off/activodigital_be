"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./setupMocks");
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
(0, vitest_1.describe)('Módulo PVGIS API - Integration Tests', () => {
    const commonCoords = { lat: '40.4168', lon: '-3.7038' }; // Madrid
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('GET /PVGISApi/building-energy-output', () => {
        (0, vitest_1.it)('Debería validar parámetros obligatorios', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/PVGISApi/building-energy-output')
                .query({ lat: commonCoords.lat }); // Falta lon, peakpower, loss
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.error).toContain('Faltan parámetros obligatorios');
        });
        (0, vitest_1.it)('Debería retornar datos de producción FV con parámetros válidos', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/PVGISApi/building-energy-output')
                .query({
                ...commonCoords,
                peakpower: '5',
                loss: '14',
                mountingplace: 'building'
            });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toHaveProperty('outputs');
        });
    });
    (0, vitest_1.describe)('GET /PVGISApi/hourly-data', () => {
        (0, vitest_1.it)('Debería exigir peakpower y loss si pvcalculation es 1', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/PVGISApi/hourly-data')
                .query({
                ...commonCoords,
                pvcalculation: '1'
                // Faltan peakpower y loss
            });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.error).toContain('peakpower y loss son obligatorios');
        });
        // TODO no funciona
        (0, vitest_1.it)('Debería funcionar solo con datos solares si pvcalculation es 0', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/PVGISApi/hourly-data')
                .query({
                ...commonCoords,
                pvcalculation: '0'
            });
            console.log(response.status);
            (0, vitest_1.expect)(response.status).toBe(200);
        });
    });
    // TODO no funciona
    (0, vitest_1.describe)('GET /PVGISApi/tmy-data', () => {
        (0, vitest_1.it)('Debería obtener el Año Meteorológico Típico', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/PVGISApi/tmy-data')
                .query(commonCoords);
            (0, vitest_1.expect)(response.status).toBe(200);
        });
    });
    (0, vitest_1.describe)('GET /PVGISApi/monthly-radiation', () => {
        (0, vitest_1.it)('Debería fallar si no se especifica horirrad ni optrad', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/PVGISApi/monthly-radiation')
                .query(commonCoords);
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.error).toBe("Debe especificar 'horirrad=1' o 'optrad=1'.");
        });
        (0, vitest_1.it)('Debería obtener radiación mensual con optrad=1', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/PVGISApi/monthly-radiation')
                .query({ ...commonCoords, optrad: '1' });
            (0, vitest_1.expect)(response.status).toBe(200);
        });
    });
});
//# sourceMappingURL=PVGI.test.js.map