"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./setupMocks");
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const TEST_LOCATION_NAME = "Madrid";
(0, vitest_1.describe)('Módulo Idealista Scraper - Integration Tests', () => {
    const mockToken = 'Bearer valid-token';
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('POST /idealistascraper/idealista', () => {
        (0, vitest_1.it)('Debería ejecutar el scraper y devolver promedios calculados', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/idealistascraper/idealista')
                .set('Authorization', mockToken)
                .send({
                locationName: TEST_LOCATION_NAME,
                maxItems: 2
            });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.message).toContain('exitosamente');
            (0, vitest_1.expect)(response.body.data.averagePrice).toBe(150000);
            (0, vitest_1.expect)(response.body.data.averagePricePerSqm).toBe(2000);
        });
        (0, vitest_1.it)('Debería normalizar el nombre de la ubicación (acentos/mayúsculas)', async () => {
            // Si en el JSON está "Madrid", debería aceptar "mádrid"
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/idealistascraper/idealista')
                .set('Authorization', mockToken)
                .send({
                locationName: "MÁDRID"
            });
            (0, vitest_1.expect)(response.status).toBe(200);
        });
        (0, vitest_1.it)('Debería fallar (400) si no se envía locationName', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/idealistascraper/idealista')
                .set('Authorization', mockToken)
                .send({ maxItems: 10 });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.error).toContain('locationName');
        });
        (0, vitest_1.it)('Debería fallar (500) si la ubicación no existe en el catálogo', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/idealistascraper/idealista')
                .set('Authorization', mockToken)
                .send({ locationName: "UbicacionInexistente123" });
            (0, vitest_1.expect)(response.status).toBe(500);
            (0, vitest_1.expect)(response.body.details).toContain('no existe en el catálogo');
        });
    });
});
//# sourceMappingURL=idealistaScraper.test.js.map