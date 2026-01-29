"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
(0, vitest_1.describe)('Suite de Autenticación y Seguridad', () => {
    (0, vitest_1.describe)('POST /auth/signup', () => {
        (0, vitest_1.it)('Debería fallar si faltan campos (Bug de validación)', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/auth/signup')
                .send({ email: 'test@gmail.com' });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.error).toContain('password are required');
        });
        (0, vitest_1.it)('Debería crear un usuario nuevo exitosamente', async () => {
            const uniqueEmail = `nuevo_${Date.now()}@test.com`;
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/auth/signup')
                .send({
                email: uniqueEmail,
                password: 'Password123!',
                full_name: 'Usuario de Test'
            });
            (0, vitest_1.expect)(response.status).toBe(201);
            (0, vitest_1.expect)(response.body.message).toContain('Configure 2FA');
            (0, vitest_1.expect)(response.body).toHaveProperty('userId');
        });
    });
    (0, vitest_1.describe)('POST /auth/login', () => {
        (0, vitest_1.it)('Debería detectar usuario con 2FA configurado (Flujo de negocio)', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/auth/login')
                .send({ email: 'tradebotg@gmail.com', password: '12345678' });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.message).toContain('Credenciales válidas. Verifica código 2FA.');
        });
        (0, vitest_1.it)('Debería solicitar 2FA si las credenciales son correctas', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/auth/login')
                .send({ email: 'martiingadeea1996@gmail.com', password: '12345678' });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.requiresTwoFactor).toBe(true);
        });
    });
    (0, vitest_1.describe)('GET /auth/invitation/:token', () => {
        (0, vitest_1.it)('Debería fallar con un token de invitación inválido', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/auth/invitation/token-falso-123');
            (0, vitest_1.expect)(response.status).toBe(404);
            (0, vitest_1.expect)(response.body.error).toContain('Invitación no encontrada');
        });
        (0, vitest_1.it)('Debería identificar si el invitado ya existe y mandarlo a login', async () => {
            const validToken = 'TOKEN_DE_USUARIO_EXISTENTE';
            const response = await (0, supertest_1.default)(app_1.default).get(`/auth/invitation/${validToken}`);
            if (response.status === 200) {
                (0, vitest_1.expect)(response.body.userExists).toBe(true);
                (0, vitest_1.expect)(response.body.redirect).toBe('/login');
            }
        });
    });
    (0, vitest_1.describe)('POST /auth/setup-2fa', () => {
        (0, vitest_1.it)('Debería generar secreto y QR para un usuario nuevo', async () => {
            const userId = '1f3adc6b-cf31-426c-aba0-aed260d0f04c';
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/auth/setup-2fa')
                .send({ userId });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toHaveProperty('qrCodeUrl');
            (0, vitest_1.expect)(response.body).toHaveProperty('secret');
        });
    });
    (0, vitest_1.describe)('GET /auth/me', () => {
        (0, vitest_1.it)('Debería bloquear acceso a /me si no hay token (Middleware Bug)', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/auth/me');
            (0, vitest_1.expect)(response.status).toBe(401);
        });
    });
});
//# sourceMappingURL=auth.test.js.map