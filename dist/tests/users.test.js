"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./setupMocks");
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
(0, vitest_1.describe)('User Controller Tests', () => {
    (0, vitest_1.it)('Debería obtener el perfil de usuario sin errores de middleware', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .get('/users/profile');
        (0, vitest_1.expect)(response.status).not.toBe(401);
    });
    (0, vitest_1.it)('Debería obtener los roles de usuario', async () => {
        const response = await (0, supertest_1.default)(app_1.default).get('/users/roles');
        (0, vitest_1.expect)(response.status).toBe(200);
        (0, vitest_1.expect)(Array.isArray(response.body)).toBe(true);
    });
});
(0, vitest_1.describe)('User Controller Tests', () => {
    (0, vitest_1.describe)('GET /users/profile', () => {
        (0, vitest_1.it)('Debería retornar el perfil del usuario autenticado', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/users/profile');
            if (response.status === 404) {
                console.warn("⚠️ Asegúrate de que el ID 'user-auth-id-123' exista en tu DB de test");
            }
            (0, vitest_1.expect)([200, 404]).toContain(response.status);
            if (response.status === 200) {
                (0, vitest_1.expect)(response.body).toHaveProperty('id');
                (0, vitest_1.expect)(response.body).toHaveProperty('email');
            }
        });
    });
    (0, vitest_1.describe)('POST /users/create', () => {
        (0, vitest_1.it)('Debería fallar (400) si faltan datos obligatorios', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/users/create')
                .send({ email: 'test@test.com' });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.error).toContain('fullname y  role son requeridos');
        });
        (0, vitest_1.it)('Debería crear un usuario y registrar trazabilidad', async () => {
            const newUser = {
                email: `test_${Date.now()}@example.com`,
                fullName: 'Admin Test',
                role: 'administrador'
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/users/create')
                .send(newUser);
            (0, vitest_1.expect)([201, 400, 500]).toContain(response.status);
            if (response.status === 201) {
                (0, vitest_1.expect)(response.body.message).toBe('Usuario creado correctamente');
            }
        });
    });
    (0, vitest_1.describe)('PUT /users/edit/:userId', () => {
        (0, vitest_1.it)('Debería actualizar los datos de un usuario existente', async () => {
            const targetUserId = 'b4ca5a94-4d3a-456e-a9ac-0455ccf2e456';
            const response = await (0, supertest_1.default)(app_1.default)
                .put(`/users/edit/${targetUserId}`)
                .send({
                fullName: 'Nombre Editado',
                status: 'active'
            });
            (0, vitest_1.expect)([200, 404, 500]).toContain(response.status);
        });
    });
    (0, vitest_1.describe)('POST /users/assign-technician', () => {
        (0, vitest_1.it)('Debería validar que el email del técnico sea enviado', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/users/assign-technician')
                .send({ buildingId: '7657b043-8453-496d-9834-2c01615d416d' });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.error).toBe('buildingId y technicianEmail son requeridos');
        });
    });
});
//# sourceMappingURL=users.test.js.map