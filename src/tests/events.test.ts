import './setupMocks';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { trazabilityService } from '../domain/trazability/TrazabilityService';

// ==========================================
// CONFIGURACIÓN DE IDS (Sustituir aquí)
// ==========================================
const TEST_BUILDING_ID = "7657b043-8453-496d-9834-2c01615d416d";
// ==========================================

vi.mock('../../domain/trazability/TrazabilityService', () => ({
    trazabilityService: {
        registerTrazability: vi.fn().mockResolvedValue({})
    }
}));

describe('Módulo Calendar - Integration Tests', () => {
    const mockToken = 'Bearer token-valido-acá';
    let createdEventId = ''; // ID persistido para flujo de tests

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /calendar/all', () => {
        it('Debería listar todos los eventos de la plataforma', async () => {
            const response = await request(app)
                .get('/calendar/all')
                .set('Authorization', mockToken);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('GET /calendar (Filtrado)', () => {
        it('Debería filtrar eventos por edificio y rango de fechas', async () => {
            const response = await request(app)
                .get('/calendar')
                .set('Authorization', mockToken)
                .query({
                    buildingId: TEST_BUILDING_ID,
                    startDate: '2025-12-01',
                    endDate: '2025-12-31'
                });

            expect(response.status).toBe(200);
            expect(response.body.count).toBeDefined();
        });

        it('Debería retornar 400 si falta el buildingId', async () => {
            const response = await request(app)
                .get('/calendar')
                .set('Authorization', mockToken);

            expect(response.status).toBe(400);
        });
    });

    describe('POST /calendar', () => {
        it('Debería crear un nuevo evento y registrar trazabilidad', async () => {
            const newEvent = {
                buildingId: TEST_BUILDING_ID,
                title: 'Revisión Extintores',
                eventDate: '2025-12-15T09:00:00Z',
                category: 'inspections',
                priority: 'normal'
            };

            const response = await request(app)
                .post('/calendar')
                .set('Authorization', mockToken)
                .send(newEvent);

            expect(response.status).toBe(201);
            expect(response.body.data.title).toBe('Revisión Extintores');
            createdEventId = response.body.data.id
            expect(trazabilityService.registerTrazability).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'CREAR' })
            );
        });
    });

    describe('PUT /calendar/:id', () => {
        it('Debería actualizar el estado de un evento', async () => {
            const response = await request(app)
                .put(`/calendar/${createdEventId}`)
                .set('Authorization', mockToken)
                .send({ status: 'completed' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Evento actualizado');
        });
    });

    describe('DELETE /calendar/:id', () => {
        it('Debería obtener los datos del evento antes de eliminarlo para la trazabilidad', async () => {
            const response = await request(app)
                .delete(`/calendar/${createdEventId}`)
                .set('Authorization', mockToken);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Verificamos que se llamó a trazabilidad con el buildingId obtenido del evento
            expect(trazabilityService.registerTrazability).toHaveBeenCalledWith(
                expect.objectContaining({
                    buildingId: TEST_BUILDING_ID,
                    action: 'ELIMINAR'
                })
            );
        });
    });
});