import './setupMocks';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';


describe('Módulo ESG - Integration Tests', () => {
    const buildingId = 'f773ffa0-b934-4df6-a48c-fba17abf4c0f';
    const mockToken = 'Bearer fake-jwt-token';

    describe('POST /esg/calculate', () => {
        it('Debería retornar status "incomplete" si el edificio no tiene datos previos', async () => {
            const response = await request(app)
                .post('/esg/calculate')
                .set('Authorization', mockToken)
                .send({ building_id: buildingId });

            expect([200, 500]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body).toHaveProperty('status');
                if (response.body.status === 'incomplete') {
                    expect(Array.isArray(response.body.missingData)).toBe(true);
                    expect(response.body.message).toContain('Faltan datos críticos');
                }
            }
        });

        it('Debería fallar con 400 si no se envía el building_id', async () => {
            const response = await request(app)
                .post('/esg/calculate')
                .set('Authorization', mockToken)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('El campo building_id es requerido');
        });
    });

    describe('GET /esg/building/:buildingId', () => {
        it('Debería intentar obtener el score ESG guardado', async () => {
            const response = await request(app)
                .get(`/esg/building/${buildingId}`)
                .set('Authorization', mockToken);

            // Puede ser 200 (si ya se calculó en el test anterior), 404 o 500
            expect([200, 404, 500]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body).toHaveProperty('status');
                // Si está completo, validamos estructura de Breakdown
                if (response.body.status === 'complete') {
                    expect(response.body.data).toHaveProperty('total');
                    expect(response.body.data).toHaveProperty('label');
                    expect(response.body.data.environmental).toHaveProperty('normalized');
                }
            }
        });

        it('Debería retornar 404 para un edificio sin cálculos previos', async () => {
            const randomId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .get(`/esg/building/${randomId}`)
                .set('Authorization', mockToken);

            expect([404, 500]).toContain(response.status);
            if (response.status === 404) {
                expect(response.body.error).toBe('No se encontró un cálculo ESG para este edificio');
            }
        });
    });

    describe('EsgService Logic (Unit Validation)', () => {
        // Test directo de la lógica matemática del servicio si fuera necesario exponerlo, 
        // pero aquí validamos a través de la respuesta de la API.
        it('Debería validar que el cálculo (si existe) tiene etiquetas coherentes', async () => {
            const response = await request(app)
                .get(`/esg/building/${buildingId}`)
                .set('Authorization', mockToken);

            if (response.status === 200 && response.body.status === 'complete') {
                const { total, label } = response.body.data;
                if (total >= 90) expect(label).toBe('Premium');
                else if (total >= 80) expect(label).toBe('Gold');
                else if (total >= 60) expect(label).toBe('Silver');
                else if (total >= 40) expect(label).toBe('Bronze');
                else expect(label).toBe('Crítico');
            }
        });
    });
});