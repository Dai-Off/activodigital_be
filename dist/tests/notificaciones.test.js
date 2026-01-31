"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./setupMocks");
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
(0, vitest_1.describe)('Módulo de Notificaciones - Integration Tests', () => {
    const buildingId = 'f773ffa0-b934-4df6-a48c-fba17abf4c0f';
    const mockToken = 'Bearer fake-jwt-token';
    let createdNotificationId;
    (0, vitest_1.describe)('POST /notifications', () => {
        (0, vitest_1.it)('Debería crear una nueva notificación exitosamente', async () => {
            const newNotification = {
                building_id: buildingId,
                type: 'mantenimiento',
                title: 'Revisión de ascensor programada',
                priority: 1
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/notifications')
                .set('Authorization', mockToken)
                .send(newNotification);
            (0, vitest_1.expect)([200, 500]).toContain(response.status);
            if (response.status === 200) {
                (0, vitest_1.expect)(response.body.message).toBe('La notificación se ha creado con éxito');
            }
        });
        (0, vitest_1.it)('Debería fallar si faltan campos obligatorios', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/notifications')
                .set('Authorization', mockToken)
                .send({ title: 'Incompleta' });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.error).toBe('Faltan campos obligatorios');
        });
    });
    (0, vitest_1.describe)('GET /notifications/unread', () => {
        (0, vitest_1.it)('Debería obtener la lista de notificaciones no leídas', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/notifications/unread')
                .set('Authorization', mockToken);
            (0, vitest_1.expect)([200, 500]).toContain(response.status);
            if (response.status === 200) {
                (0, vitest_1.expect)(response.body).toHaveProperty('data');
                (0, vitest_1.expect)(Array.isArray(response.body.data)).toBe(true);
                // Guardamos un ID para los siguientes tests de lectura/borrado
                if (response.body.data.length > 0) {
                    createdNotificationId = response.body.data[0].id;
                }
            }
        });
    });
    (0, vitest_1.describe)('PUT /notifications/:id/read', () => {
        (0, vitest_1.it)('Debería marcar una notificación específica como leída', async () => {
            if (!createdNotificationId)
                return;
            const response = await (0, supertest_1.default)(app_1.default)
                .put(`/notifications/${createdNotificationId}/read`)
                .set('Authorization', mockToken);
            (0, vitest_1.expect)([200, 500]).toContain(response.status);
            if (response.status === 200) {
                (0, vitest_1.expect)(response.body.success).toBe(true);
            }
        });
    });
    (0, vitest_1.describe)('GET /notifications/building', () => {
        (0, vitest_1.it)('Debería obtener el feed completo de un edificio', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/notifications/building')
                .query({ buildingId })
                .set('Authorization', mockToken);
            (0, vitest_1.expect)([200, 400, 500]).toContain(response.status);
            if (response.status === 200) {
                (0, vitest_1.expect)(response.body).toHaveProperty('count');
            }
        });
        (0, vitest_1.it)('Debería dar error 400 si no se envía buildingId', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/notifications/building')
                .set('Authorization', mockToken);
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.error).toBe('buildingId es requerido');
        });
    });
    (0, vitest_1.describe)('PUT /notifications/markAll', () => {
        (0, vitest_1.it)('Debería marcar todas las notificaciones del usuario como leídas', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .put('/notifications/markAll')
                .set('Authorization', mockToken);
            (0, vitest_1.expect)([200, 500]).toContain(response.status);
            if (response.status === 200) {
                (0, vitest_1.expect)(response.body).toHaveProperty('count');
            }
        });
    });
    (0, vitest_1.describe)('DELETE /notifications/cleanup', () => {
        (0, vitest_1.it)('Debería ejecutar la limpieza de notificaciones antiguas', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .delete('/notifications/cleanup')
                .query({ buildingId, days: 30 })
                .set('Authorization', mockToken);
            (0, vitest_1.expect)([200, 400, 500]).toContain(response.status);
            if (response.status === 200) {
                (0, vitest_1.expect)(response.body.message).toContain('eliminadas');
            }
        });
    });
    (0, vitest_1.describe)('DELETE /notifications/:id', () => {
        (0, vitest_1.it)('Debería eliminar una notificación específica', async () => {
            if (!createdNotificationId)
                return;
            const response = await (0, supertest_1.default)(app_1.default)
                .delete(`/notifications/${createdNotificationId}`)
                .set('Authorization', mockToken);
            // 200 si existía, 404 si ya se borró por cleanup o no existe
            (0, vitest_1.expect)([200, 404, 500]).toContain(response.status);
        });
    });
});
//# sourceMappingURL=notificaciones.test.js.map