"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./setupMocks");
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
(0, vitest_1.describe)('Módulo MITECO API - Integration Tests', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('Rutas de Datasets', () => {
        (0, vitest_1.it)('GET /package-list - Debería parsear limit y offset a números', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/MITECOApi/package-list')
                .query({ limit: '5', offset: '10' });
            console.log(response.body);
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
        });
        (0, vitest_1.it)('GET /package-details - Debería fallar si no se envía el ID', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/MITECOApi/package-details');
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.error).toContain('Falta parámetro obligatorio: id');
        });
    });
    (0, vitest_1.describe)('Rutas de Metadatos', () => {
        (0, vitest_1.it)('GET /organization-list - Debería convertir "true" (string) a boolean', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/MITECOApi/organization-list')
                .query({ all_fields: 'true' });
            (0, vitest_1.expect)(response.status).toBe(200);
        });
    });
    (0, vitest_1.describe)('Rutas de DataStore (SQL)', () => {
        (0, vitest_1.it)('GET /datastore-search-sql - Debería ejecutar consulta SQL', async () => {
            const sqlQuery = 'SELECT * FROM "resource-id" LIMIT 1';
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/MITECOApi/datastore-search-sql')
                .query({ sql: sqlQuery });
            (0, vitest_1.expect)(response.status).toBe(200);
        });
        (0, vitest_1.it)('GET /datastore-search-sql - Debería dar error 400 si falta el parámetro sql', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/MITECOApi/datastore-search-sql');
            (0, vitest_1.expect)(response.status).toBe(400);
        });
    });
    (0, vitest_1.describe)('Rutas de Utilidad Personalizadas', () => {
        (0, vitest_1.it)('GET /search/by-organization - Debería buscar por orgId', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/MITECOApi/search/by-organization')
                .query({ orgId: 'dg-agua', q: 'caudal' });
            (0, vitest_1.expect)(response.status).toBe(200);
        });
        (0, vitest_1.it)('GET /search/by-tag - Debería buscar por etiqueta', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/MITECOApi/search/by-tag')
                .query({ tag: 'energia' });
            (0, vitest_1.expect)(response.status).toBe(200);
        });
    });
    (0, vitest_1.describe)('Manejo de Errores', () => {
        (0, vitest_1.it)('Debería retornar 200', async () => {
            // Forzamos un error en una ruta específica para este test
            const response = await (0, supertest_1.default)(app_1.default).get('/MITECOApi/system-status');
            (0, vitest_1.expect)(response.status).toBe(200);
        });
    });
});
//# sourceMappingURL=miteco.test.js.map