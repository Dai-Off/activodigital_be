import './setupMocks';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Building Units, Audits & Metrics GETs', () => {
    const buildingId = '73d77a52-ede7-4c96-87c0-2b95220a9c25';

    // --- GRUPO DE AUDITORÍAS ---
    describe('Audits', () => {
        it('Debería obtener la auditoría técnica del edificio', async () => {
            const response = await request(app).get(`/edificios/${buildingId}/audits/technical`);
            expect(response.status).toBe(200);
        });

        it('Debería obtener la auditoría financiera del edificio', async () => {
            const response = await request(app).get(`/edificios/${buildingId}/audits/financial`);
            expect(response.status).toBe(200);
        });
    });

    // --- GRUPO DE MÉTRICAS INDIVIDUALES ---
    describe('Financial Metrics Individual Endpoints', () => {
        const metrics = ['roi', 'cap-rate', 'noi', 'dscr', 'opex-ratio', 'value-gap'];

        metrics.forEach((metric) => {
            it(`Debería obtener la métrica: ${metric.toUpperCase()}`, async () => {
                const response = await request(app).get(`/edificios/${buildingId}/${metric}`);
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('data');
            });
        });
    });

    // --- GRUPO DE UNIDADES ---
    describe('Building Units', () => {
        it('Debería listar todas las unidades del edificio', async () => {
            const response = await request(app).get(`/edificios/${buildingId}/units`);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    // --- OPERACIONES POST DE VALIDACIÓN Y CARGA ---
    describe('Management & Assignments', () => {
        it('Debería validar asignaciones de usuarios correctamente', async () => {
            const response = await request(app)
                .post('/edificios/validate-assignments')
                .send({
                    technicianEmail: 'martiingadeea1996@gmail.com'
                });

            if (response.status !== 200) {
                console.log('Error Body:', response.body);
            }

            expect(response.status).toBe(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('technicianValidation');
        });

        it('Debería fallar (400) si no se envían emails en la validación', async () => {
            const response = await request(app)
                .post('/edificios/validate-assignments')
                .send({}); // Body vacío

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Se requiere al menos un email para validar');
        });

        it('Debería crear o actualizar unidades (Upsert)', async () => {
            const unitsPayload = [
                { unit_number: '1A', floor: 1, square_meters: 50 },
                { unit_number: '1B', floor: 1, square_meters: 65 }
            ];

            const response = await request(app)
                .post(`/edificios/${buildingId}/units`)
                .send(unitsPayload);

            expect([200, 201]).toContain(response.status);
        });
    });
});