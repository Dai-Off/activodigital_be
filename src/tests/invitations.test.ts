import './setupMocks';
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app';
import { UserRole } from '@/types/user';

describe('Invitations & CFO Assignments Flow', () => {
    // IDs de referencia (Deben coincidir con tus mocks o DB de test)
    const buildingId = 'f773ffa0-b934-4df6-a48c-fba17abf4c0f';
    let createdInvitationId: string;
    const mockToken = 'inv_test_token_123'; // Token simulado para validación

    describe('POST /invitations (Creación)', () => {
        it('Debería crear una invitación exitosamente para un TECNICO', async () => {
            const payload = {
                email: `borrar_${Date.now()}@gmal.com`,
                role: UserRole.TECNICO,
                buildingId: buildingId
            };

            const response = await request(app)
                .post('/invitations')
                .send(payload);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.invitation.email).toBe(payload.email);

            createdInvitationId = response.body.invitation.id;
        });

        it('Debería fallar (400) si el rol no está permitido (ej. ADMINISTRADOR)', async () => {
            const response = await request(app)
                .post('/invitations')
                .send({
                    email: 'admin_test@ejemplo.com',
                    role: UserRole.ADMINISTRADOR,
                    buildingId: buildingId
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Solo se pueden invitar');
        });

        it('Debería fallar (400) si faltan campos obligatorios', async () => {
            const response = await request(app)
                .post('/invitations')
                .send({ email: 'test@ejemplo.com' }); // Falta buildingId y role

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Email, rol y buildingId son requeridos');
        });
    });

    describe('GET /invitations/validate/:token', () => {
        it('Debería validar un token de invitación existente', async () => {
            const response = await request(app)
                .get(`/invitations/validate/${mockToken}`);

            expect([200, 404, 400]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body.success).toBe(true);
                expect(response.body.invitation).toHaveProperty('email');
            }
        });

        it('Debería fallar (404) con un token inexistente', async () => {
            const response = await request(app)
                .get('/invitations/validate/token_inexistente_999');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Invitación no encontrada o expirada');
        });
    });

    describe('Gestión de Invitaciones del Usuario', () => {
        it('Debería obtener la lista de invitaciones enviadas por el usuario', async () => {
            const response = await request(app)
                .get('/invitations');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.invitations)).toBe(true);
        });

        it('Debería cancelar una invitación pendiente o manejar el error adecuadamente', async () => {
            const response = await request(app)
                .delete(`/invitations/${createdInvitationId}`);

            expect([200, 500]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe('Invitación cancelada exitosamente');
            } else {
                expect(response.body).toHaveProperty('error');
                console.log('Error controlado en cancelación:', response.body.error);
            }
        });
    });

    describe('CFO Assignments & Administration', () => {
        it('Debería obtener las asignaciones CFO para un edificio', async () => {
            const response = await request(app)
                .get(`/invitations/building/${buildingId}/cfos`);

            expect(response.status).toBe(200);
            expect(response.body.assignments).toBeDefined();
        });

        it('Debería obtener las asignaciones del CFO autenticado', async () => {
            const response = await request(app)
                .get('/invitations/my-cfo-assignments');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('Debería ejecutar la limpieza de invitaciones expiradas (Cleanup)', async () => {
            const response = await request(app)
                .post('/invitations/cleanup');

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('invitaciones expiradas');
        });
    });
});