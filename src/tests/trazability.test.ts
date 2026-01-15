import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app';

vi.mock('../web/middlewares/authMiddleware', () => {
    const authMock = (req: any, res: any, next: any) => {
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


describe('Trazability Controller', () => {

    describe('GET /trazability/list', () => {

        it('Debería retornar el objeto de respuesta con datos y estadísticas', async () => {
            const response = await request(app).get('/trazability/list');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');        // El array de logs
            expect(response.body).toHaveProperty('total');       // Conteo exacto de logs
            expect(response.body).toHaveProperty('activeUsers'); // Usuarios con 2FA
            expect(response.body).toHaveProperty('completed');   // Conteos por acción
            expect(response.body).toHaveProperty('alerts');
            expect(response.body).toHaveProperty('updates');
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('Debería verificar que los contadores sean números', async () => {
            const response = await request(app).get('/trazability/list');

            expect(typeof response.body.total).toBe('number');
            expect(typeof response.body.activeUsers).toBe('number');
            expect(typeof response.body.updates).toBe('number');
        });

        it('Debería incluir relaciones de usuario y edificio en cada item', async () => {
            const response = await request(app).get('/trazability/list');

            if (response.body.data.length > 0) {
                const firstItem = response.body.data[0];
                expect(firstItem).toHaveProperty('user');
                expect(firstItem).toHaveProperty('building');
            }
        });
    });
});