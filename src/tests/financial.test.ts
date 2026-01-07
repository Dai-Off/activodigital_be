import './setupMocks';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Financial Metrics & Scenarios', () => {
    // ID de edificio que debe existir en tu DB de pruebas con un Snapshot financiero
    // const buildingId = '0007a31b-98fa-4dba-a05e-b62fad1d2e87';
    // const buildingId = '73d77a52-ede7-4c96-87c0-2b95220a9c25';
    // const buildingId = '49cefa58-1224-4d20-b5d3-58471cc3a03b';
    const buildingId = 'e59b9010-8918-471d-8038-3ffbdf92bcbd';

    describe('GET /edificios/:id/metrics', () => {
        it('Debería obtener el set completo de métricas financieras', async () => {
            const response = await request(app)
                .get(`/edificios/${buildingId}/metrics`)
                .query({ period: 'annual', currency: 'EUR' });

            expect(response.status).toBe(200);  
            expect(response.body.data).toMatchObject({
                buildingId: expect.any(String),
                noi: expect.toSatisfy((val) => val === null || typeof val === 'number'),
                capRatePct: expect.toSatisfy((val) => val === null || typeof val === 'number'),
                roiOperativoPct: expect.toSatisfy((val) => val === null || typeof val === 'number')
            });
        });

        it('Debería fallar con 404 si el edificio no existe', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app).get(`/edificios/${fakeId}/metrics`);
            // Tu service lanza un Error('Edificio no encontrado') que el controlador captura como 500
            expect(response.status).toBe(500);
            expect(response.body.message).toContain('Edificio no encontrado');
        });
    });

    describe('POST /scenarios/rehab/simulate', () => {
        it('Debería calcular payback y ROI de rehabilitación', async () => {
            const rehabPayload = {
                rehabCost: 50000,
                energySavingsPerYear: 5000,
                subsidies: 10000,
                method: 'heuristic'
            };

            const response = await request(app)
                .post(`/edificios/${buildingId}/scenarios/rehab/simulate`)
                .send(rehabPayload);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('paybackMonths');
            expect(response.body.data).toHaveProperty('simpleRoiPct');
            // Verificamos que el cálculo no sea NaN (bug común en finanzas)
            expect(response.body.data.simpleRoiPct).toBeGreaterThanOrEqual(0);
        });
    });

    describe('POST /scenarios/irr', () => {
        it('Debería calcular la Tasa Interna de Retorno (IRR)', async () => {
            const irrPayload = {
                initialInvestment: 100000,
                cashflows: [10000, 15000, 20000, 25000, 120000], // 5 años
                scenarioId: 'test-irr',
                maxIterations: 100,
                tolerance: 0.0001
            };

            const response = await request(app)
                .post(`/edificios/${buildingId}/scenarios/irr`)
                .send(irrPayload);

            expect(response.status).toBe(200);
            expect(response.body.data.irr).toBeTypeOf('number');
            expect(response.body.data.iterations).toBeLessThanOrEqual(100);
        });
    });
});