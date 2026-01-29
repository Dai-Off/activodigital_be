"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
vitest_1.vi.mock('../web/middlewares/authMiddleware', () => {
    const authMock = (req, res, next) => {
        req.user = {
            id: '07e96f48-de34-40a0-9f98-d1582bc20162',
            email: 'martiingadeea1996@gmail.com',
        };
        next();
    };
    return {
        authenticateToken: authMock,
        requireAuth: authMock,
        optionalAuth: authMock,
    };
});
(0, vitest_1.describe)('Trazability Controller', () => {
    (0, vitest_1.describe)('GET /trazability/list', () => {
        (0, vitest_1.it)('Debería retornar el objeto de respuesta con datos y estadísticas', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/trazability/list');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toHaveProperty('data'); // El array de logs
            (0, vitest_1.expect)(response.body).toHaveProperty('total'); // Conteo exacto de logs
            (0, vitest_1.expect)(response.body).toHaveProperty('activeUsers'); // Usuarios con 2FA
            (0, vitest_1.expect)(response.body).toHaveProperty('completed'); // Conteos por acción
            (0, vitest_1.expect)(response.body).toHaveProperty('alerts');
            (0, vitest_1.expect)(response.body).toHaveProperty('updates');
            (0, vitest_1.expect)(Array.isArray(response.body.data)).toBe(true);
        });
        (0, vitest_1.it)('Debería verificar que los contadores sean números', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/trazability/list');
            (0, vitest_1.expect)(typeof response.body.total).toBe('number');
            (0, vitest_1.expect)(typeof response.body.activeUsers).toBe('number');
            (0, vitest_1.expect)(typeof response.body.updates).toBe('number');
        });
        (0, vitest_1.it)('Debería incluir relaciones de usuario y edificio en cada item', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/trazability/list');
            if (response.body.data.length > 0) {
                const firstItem = response.body.data[0];
                (0, vitest_1.expect)(firstItem).toHaveProperty('user');
                (0, vitest_1.expect)(firstItem).toHaveProperty('building');
            }
        });
    });
});
//# sourceMappingURL=trazability.test.js.map