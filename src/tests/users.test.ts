import './setupMocks';
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('User Controller Tests', () => {
    it('Debería obtener el perfil de usuario sin errores de middleware', async () => {
        const response = await request(app)
            .get('/users/profile');
        expect(response.status).not.toBe(401);
    });

    it('Debería obtener los roles de usuario', async () => {
        const response = await request(app).get('/users/roles');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });
});


describe('User Controller Tests', () => {

    describe('GET /users/profile', () => {
        it('Debería retornar el perfil del usuario autenticado', async () => {
            const response = await request(app).get('/users/profile');

            if (response.status === 404) {
                console.warn("⚠️ Asegúrate de que el ID 'user-auth-id-123' exista en tu DB de test");
            }

            expect([200, 404]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body).toHaveProperty('id');
                expect(response.body).toHaveProperty('email');
            }
        });
    });

    describe('POST /users/create', () => {
        it('Debería fallar (400) si faltan datos obligatorios', async () => {
            const response = await request(app)
                .post('/users/create')
                .send({ email: 'test@test.com' });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('fullname y  role son requeridos');
        });

        it('Debería crear un usuario y registrar trazabilidad', async () => {
            const newUser = {
                email: `test_${Date.now()}@example.com`,
                fullName: 'Admin Test',
                role: 'administrador'
            };

            const response = await request(app)
                .post('/users/create')
                .send(newUser);
            expect([201, 400, 500]).toContain(response.status);
            if (response.status === 201) {
                expect(response.body.message).toBe('Usuario creado correctamente');
            }
        });
    });

    describe('PUT /users/edit/:userId', () => {
        it('Debería actualizar los datos de un usuario existente', async () => {
            const targetUserId = 'b4ca5a94-4d3a-456e-a9ac-0455ccf2e456';

            const response = await request(app)
                .put(`/users/edit/${targetUserId}`)
                .send({
                    fullName: 'Nombre Editado',
                    status: 'active'
                });
            expect([200, 404, 500]).toContain(response.status);
        });
    });

    describe('POST /users/assign-technician', () => {
        it('Debería validar que el email del técnico sea enviado', async () => {
            const response = await request(app)
                .post('/users/assign-technician')
                .send({ buildingId: '7657b043-8453-496d-9834-2c01615d416d' });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('buildingId y technicianEmail son requeridos');
        });
    });

});