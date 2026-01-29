"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./setupMocks");
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
(0, vitest_1.describe)('Endpoints de Diagnóstico (Health & Env)', () => {
    (0, vitest_1.describe)('GET /health/env', () => {
        (0, vitest_1.it)('Debería cargar las variables de entorno correctamente desde .env.test', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/health/env');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.SUPABASE_URL).not.toBeNull();
            (0, vitest_1.expect)(response.body.SUPABASE_ANON_KEY).not.toBeNull();
            if (response.body.SUPABASE_ANON_KEY) {
                (0, vitest_1.expect)(response.body.SUPABASE_ANON_KEY).toMatch(/^.{4}\.\.\..{4}$/);
            }
        });
        (0, vitest_1.it)('No debería tener el prefijo @ en la URL de Supabase (Bug común)', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/health/env');
            (0, vitest_1.expect)(response.body.SUPABASE_URL_hasAtPrefix).toBe(false);
        });
    });
    (0, vitest_1.describe)('GET /health/supabase', () => {
        (0, vitest_1.it)('Debería conectar con Supabase y obtener la hora del servidor', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/health/supabase');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.ok).toBe(true);
            (0, vitest_1.expect)(response.body.connected).toBe(true);
            (0, vitest_1.expect)(response.body.serverTime).not.toBeNull();
            (0, vitest_1.expect)(response.body.error).toBeNull();
        });
    });
});
//# sourceMappingURL=health.test.js.map