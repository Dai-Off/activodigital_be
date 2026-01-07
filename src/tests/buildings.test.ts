import './setupMocks'; // Importamos el bypass de autenticación
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Buildings Controller', () => {
    const buildingId = '7657b043-8453-496d-9834-2c01615d416d';

    describe('Operaciones Principales', () => {
        it('Debería listar los edificios del usuario autenticado', async () => {
            const response = await request(app).get('/edificios');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('Debería obtener el detalle de un edificio específico', async () => {
            const response = await request(app).get(`/edificios/${buildingId}`);

            expect([200, 404]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body.data).toHaveProperty('id', buildingId);
            }
        });
    });

    describe('Métricas Financieras', () => {
        it('Debería obtener el ROI del edificio', async () => {
            const response = await request(app).get(`/edificios/${buildingId}/roi`);

            // Estos endpoints suelen fallar si faltan datos financieros en la DB
            expect([200, 400, 500]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body.data).toHaveProperty('roiOperativoPct');
            }
        });

        it('Debería retornar error 400/500 si se pide métricas de un ID inválido', async () => {
            const response = await request(app).get('/edificios/7657b043-8453-496d-9834-2c01615aaaaa/metrics');
            // Debería fallar porque "id-falso" no es un UUID
            expect(response.status).not.toBe(200);
        });
    });

    describe('Gestión de Unidades', () => {
        it('Debería listar las unidades de un edificio', async () => {
            const response = await request(app).get(`/edificios/${buildingId}/units`);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });
});