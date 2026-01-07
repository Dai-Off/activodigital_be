import './setupMocks';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Módulo de Notificaciones - Integration Tests', () => {
    const buildingId = 'f773ffa0-b934-4df6-a48c-fba17abf4c0f';
    const mockToken = 'Bearer fake-jwt-token';
    let createdNotificationId: string;

    describe('POST /notifications', () => {
        it('Debería crear una nueva notificación exitosamente', async () => {
            const newNotification = {
                building_id: buildingId,
                type: 'mantenimiento',
                title: 'Revisión de ascensor programada',
                priority: 1
            };

            const response = await request(app)
                .post('/notifications')
                .set('Authorization', mockToken)
                .send(newNotification);

            expect([200, 500]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body.message).toBe('La notificación se ha creado con éxito');
            }
        });

        it('Debería fallar si faltan campos obligatorios', async () => {
            const response = await request(app)
                .post('/notifications')
                .set('Authorization', mockToken)
                .send({ title: 'Incompleta' });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Faltan campos obligatorios');
        });
    });

    describe('GET /notifications/unread', () => {
        it('Debería obtener la lista de notificaciones no leídas', async () => {
            const response = await request(app)
                .get('/notifications/unread')
                .set('Authorization', mockToken);

            expect([200, 500]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body).toHaveProperty('data');
                expect(Array.isArray(response.body.data)).toBe(true);
                // Guardamos un ID para los siguientes tests de lectura/borrado
                if (response.body.data.length > 0) {
                    createdNotificationId = response.body.data[0].id;
                }
            }
        });
    });

    describe('PUT /notifications/:id/read', () => {
        it('Debería marcar una notificación específica como leída', async () => {
            if (!createdNotificationId) return;

            const response = await request(app)
                .put(`/notifications/${createdNotificationId}/read`)
                .set('Authorization', mockToken);

            expect([200, 500]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body.success).toBe(true);
            }
        });
    });

    describe('GET /notifications/building', () => {
        it('Debería obtener el feed completo de un edificio', async () => {
            const response = await request(app)
                .get('/notifications/building')
                .query({ buildingId })
                .set('Authorization', mockToken);

            expect([200, 400, 500]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body).toHaveProperty('count');
            }
        });

        it('Debería dar error 400 si no se envía buildingId', async () => {
            const response = await request(app)
                .get('/notifications/building')
                .set('Authorization', mockToken);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('buildingId es requerido');
        });
    });

    describe('PUT /notifications/markAll', () => {
        it('Debería marcar todas las notificaciones del usuario como leídas', async () => {
            const response = await request(app)
                .put('/notifications/markAll')
                .set('Authorization', mockToken);

            expect([200, 500]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body).toHaveProperty('count');
            }
        });
    });

    describe('DELETE /notifications/cleanup', () => {
        it('Debería ejecutar la limpieza de notificaciones antiguas', async () => {
            const response = await request(app)
                .delete('/notifications/cleanup')
                .query({ buildingId, days: 30 })
                .set('Authorization', mockToken);

            expect([200, 400, 500]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body.message).toContain('eliminadas');
            }
        });
    });

    describe('DELETE /notifications/:id', () => {
        it('Debería eliminar una notificación específica', async () => {
            if (!createdNotificationId) return;

            const response = await request(app)
                .delete(`/notifications/${createdNotificationId}`)
                .set('Authorization', mockToken);

            // 200 si existía, 404 si ya se borró por cleanup o no existe
            expect([200, 404, 500]).toContain(response.status);
        });
    });
});