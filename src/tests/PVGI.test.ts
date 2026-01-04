import './setupMocks';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';


describe('Módulo PVGIS API - Integration Tests', () => {
    const commonCoords = { lat: '40.4168', lon: '-3.7038' }; // Madrid

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /PVGISApi/building-energy-output', () => {
        it('Debería validar parámetros obligatorios', async () => {
            const response = await request(app)
                .get('/PVGISApi/building-energy-output')
                .query({ lat: commonCoords.lat }); // Falta lon, peakpower, loss

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Faltan parámetros obligatorios');
        });

        it('Debería retornar datos de producción FV con parámetros válidos', async () => {
            const response = await request(app)
                .get('/PVGISApi/building-energy-output')
                .query({
                    ...commonCoords,
                    peakpower: '5',
                    loss: '14',
                    mountingplace: 'building'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('outputs');
        });
    });

    describe('GET /PVGISApi/hourly-data', () => {

        it('Debería exigir peakpower y loss si pvcalculation es 1', async () => {
            const response = await request(app)
                .get('/PVGISApi/hourly-data')
                .query({
                    ...commonCoords,
                    pvcalculation: '1'
                    // Faltan peakpower y loss
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('peakpower y loss son obligatorios');
        });

        // TODO no funciona
        it('Debería funcionar solo con datos solares si pvcalculation es 0', async () => {
            const response = await request(app)
                .get('/PVGISApi/hourly-data')
                .query({
                    ...commonCoords,
                    pvcalculation: '0'
                });

            console.log(response.status);
            expect(response.status).toBe(200);
        });
    });

    // TODO no funciona
    describe('GET /PVGISApi/tmy-data', () => {
        it('Debería obtener el Año Meteorológico Típico', async () => {
            const response = await request(app)
                .get('/PVGISApi/tmy-data')
                .query(commonCoords);
            expect(response.status).toBe(200);
        });
    });

    describe('GET /PVGISApi/monthly-radiation', () => {
        it('Debería fallar si no se especifica horirrad ni optrad', async () => {
            const response = await request(app)
                .get('/PVGISApi/monthly-radiation')
                .query(commonCoords);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Debe especificar 'horirrad=1' o 'optrad=1'.");
        });

        it('Debería obtener radiación mensual con optrad=1', async () => {
            const response = await request(app)
                .get('/PVGISApi/monthly-radiation')
                .query({ ...commonCoords, optrad: '1' });

            expect(response.status).toBe(200);
        });
    });
});