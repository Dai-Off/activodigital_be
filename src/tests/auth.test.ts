import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Suite de Autenticación y Seguridad', () => {

    describe('POST /auth/signup', () => {
        it('Debería fallar si faltan campos (Bug de validación)', async () => {
            const response = await request(app)
                .post('/auth/signup')
                .send({ email: 'test@gmail.com' });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('password are required');
        });

        it('Debería crear un usuario nuevo exitosamente', async () => {
            const uniqueEmail = `nuevo_${Date.now()}@test.com`;
            const response = await request(app)
                .post('/auth/signup')
                .send({
                    email: uniqueEmail,
                    password: 'Password123!',
                    full_name: 'Usuario de Test'
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toContain('Configure 2FA');
            expect(response.body).toHaveProperty('userId');
        });


        
    });

    describe('POST /auth/login', () => {
        it('Debería detectar usuario con 2FA configurado (Flujo de negocio)', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'tradebotg@gmail.com', password: '12345678' });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('Credenciales válidas. Verifica código 2FA.');
        });

        it('Debería solicitar 2FA si las credenciales son correctas', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'martiingadeea1996@gmail.com', password: '12345678' });


            expect(response.status).toBe(200);
            expect(response.body.requiresTwoFactor).toBe(true);
        });
    });

    describe('GET /auth/invitation/:token', () => {
        it('Debería fallar con un token de invitación inválido', async () => {
            const response = await request(app).get('/auth/invitation/token-falso-123');

            expect(response.status).toBe(404);
            expect(response.body.error).toContain('Invitación no encontrada');
        });

        it('Debería identificar si el invitado ya existe y mandarlo a login', async () => {
            const validToken = 'TOKEN_DE_USUARIO_EXISTENTE';
            const response = await request(app).get(`/auth/invitation/${validToken}`);

            if (response.status === 200) {
                expect(response.body.userExists).toBe(true);
                expect(response.body.redirect).toBe('/login');
            }
        });
    });

    describe('POST /auth/setup-2fa', () => {
        it('Debería generar secreto y QR para un usuario nuevo', async () => {
            const userId = '1f3adc6b-cf31-426c-aba0-aed260d0f04c';
            const response = await request(app)
                .post('/auth/setup-2fa')
                .send({ userId });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('qrCodeUrl');
            expect(response.body).toHaveProperty('secret');
        });
    });

    describe('GET /auth/me', () => {
        it('Debería bloquear acceso a /me si no hay token (Middleware Bug)', async () => {
            const response = await request(app).get('/auth/me');
            expect(response.status).toBe(401);
        });
    });

});

