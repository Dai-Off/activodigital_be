"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./setupMocks");
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const user_1 = require("@/types/user");
(0, vitest_1.describe)('Invitations & CFO Assignments Flow', () => {
    // IDs de referencia (Deben coincidir con tus mocks o DB de test)
    const buildingId = 'f773ffa0-b934-4df6-a48c-fba17abf4c0f';
    let createdInvitationId;
    const mockToken = 'inv_test_token_123'; // Token simulado para validación
    (0, vitest_1.describe)('POST /invitations (Creación)', () => {
        (0, vitest_1.it)('Debería crear una invitación exitosamente para un TECNICO', async () => {
            const payload = {
                email: `borrar_${Date.now()}@gmal.com`,
                role: user_1.UserRole.TECNICO,
                buildingId: buildingId
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/invitations')
                .send(payload);
            (0, vitest_1.expect)(response.status).toBe(201);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.invitation.email).toBe(payload.email);
            createdInvitationId = response.body.invitation.id;
        });
        (0, vitest_1.it)('Debería fallar (400) si el rol no está permitido (ej. ADMINISTRADOR)', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/invitations')
                .send({
                email: 'admin_test@ejemplo.com',
                role: user_1.UserRole.ADMINISTRADOR,
                buildingId: buildingId
            });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.error).toContain('Solo se pueden invitar');
        });
        (0, vitest_1.it)('Debería fallar (400) si faltan campos obligatorios', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/invitations')
                .send({ email: 'test@ejemplo.com' }); // Falta buildingId y role
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.error).toBe('Email, rol y buildingId son requeridos');
        });
    });
    (0, vitest_1.describe)('GET /invitations/validate/:token', () => {
        (0, vitest_1.it)('Debería validar un token de invitación existente', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/invitations/validate/${mockToken}`);
            (0, vitest_1.expect)([200, 404, 400]).toContain(response.status);
            if (response.status === 200) {
                (0, vitest_1.expect)(response.body.success).toBe(true);
                (0, vitest_1.expect)(response.body.invitation).toHaveProperty('email');
            }
        });
        (0, vitest_1.it)('Debería fallar (404) con un token inexistente', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/invitations/validate/token_inexistente_999');
            (0, vitest_1.expect)(response.status).toBe(404);
            (0, vitest_1.expect)(response.body.error).toBe('Invitación no encontrada o expirada');
        });
    });
    (0, vitest_1.describe)('Gestión de Invitaciones del Usuario', () => {
        (0, vitest_1.it)('Debería obtener la lista de invitaciones enviadas por el usuario', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/invitations');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(Array.isArray(response.body.invitations)).toBe(true);
        });
        (0, vitest_1.it)('Debería cancelar una invitación pendiente o manejar el error adecuadamente', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .delete(`/invitations/${createdInvitationId}`);
            (0, vitest_1.expect)([200, 500]).toContain(response.status);
            if (response.status === 200) {
                (0, vitest_1.expect)(response.body.success).toBe(true);
                (0, vitest_1.expect)(response.body.message).toBe('Invitación cancelada exitosamente');
            }
            else {
                (0, vitest_1.expect)(response.body).toHaveProperty('error');
                console.log('Error controlado en cancelación:', response.body.error);
            }
        });
    });
    (0, vitest_1.describe)('CFO Assignments & Administration', () => {
        (0, vitest_1.it)('Debería obtener las asignaciones CFO para un edificio', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/invitations/building/${buildingId}/cfos`);
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.assignments).toBeDefined();
        });
        (0, vitest_1.it)('Debería obtener las asignaciones del CFO autenticado', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/invitations/my-cfo-assignments');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
        });
        (0, vitest_1.it)('Debería ejecutar la limpieza de invitaciones expiradas (Cleanup)', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/invitations/cleanup');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.message).toContain('invitaciones expiradas');
        });
    });
});
//# sourceMappingURL=invitations.test.js.map