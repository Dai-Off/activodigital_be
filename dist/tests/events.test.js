"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./setupMocks");
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const TrazabilityService_1 = require("../domain/trazability/TrazabilityService");
// ==========================================
// CONFIGURACIÓN DE IDS (Sustituir aquí)
// ==========================================
const TEST_BUILDING_ID = "7657b043-8453-496d-9834-2c01615d416d";
// ==========================================
vitest_1.vi.mock('../../domain/trazability/TrazabilityService', () => ({
    trazabilityService: {
        registerTrazability: vitest_1.vi.fn().mockResolvedValue({})
    }
}));
(0, vitest_1.describe)('Módulo Calendar - Integration Tests', () => {
    const mockToken = 'Bearer token-valido-acá';
    let createdEventId = ''; // ID persistido para flujo de tests
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('GET /calendar/all', () => {
        (0, vitest_1.it)('Debería listar todos los eventos de la plataforma', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/calendar/all')
                .set('Authorization', mockToken);
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toHaveProperty('data');
            (0, vitest_1.expect)(Array.isArray(response.body.data)).toBe(true);
        });
    });
    (0, vitest_1.describe)('GET /calendar (Filtrado)', () => {
        (0, vitest_1.it)('Debería filtrar eventos por edificio y rango de fechas', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/calendar')
                .set('Authorization', mockToken)
                .query({
                buildingId: TEST_BUILDING_ID,
                startDate: '2025-12-01',
                endDate: '2025-12-31'
            });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.count).toBeDefined();
        });
        (0, vitest_1.it)('Debería retornar 400 si falta el buildingId', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/calendar')
                .set('Authorization', mockToken);
            (0, vitest_1.expect)(response.status).toBe(400);
        });
    });
    (0, vitest_1.describe)('POST /calendar', () => {
        (0, vitest_1.it)('Debería crear un nuevo evento y registrar trazabilidad', async () => {
            const newEvent = {
                buildingId: TEST_BUILDING_ID,
                title: 'Revisión Extintores',
                eventDate: '2025-12-15T09:00:00Z',
                category: 'inspections',
                priority: 'normal'
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/calendar')
                .set('Authorization', mockToken)
                .send(newEvent);
            (0, vitest_1.expect)(response.status).toBe(201);
            (0, vitest_1.expect)(response.body.data.title).toBe('Revisión Extintores');
            createdEventId = response.body.data.id;
            (0, vitest_1.expect)(TrazabilityService_1.trazabilityService.registerTrazability).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ action: 'CREAR' }));
        });
    });
    (0, vitest_1.describe)('PUT /calendar/:id', () => {
        (0, vitest_1.it)('Debería actualizar el estado de un evento', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .put(`/calendar/${createdEventId}`)
                .set('Authorization', mockToken)
                .send({ status: 'completed' });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.message).toBe('Evento actualizado');
        });
    });
    (0, vitest_1.describe)('DELETE /calendar/:id', () => {
        (0, vitest_1.it)('Debería obtener los datos del evento antes de eliminarlo para la trazabilidad', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .delete(`/calendar/${createdEventId}`)
                .set('Authorization', mockToken);
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            // Verificamos que se llamó a trazabilidad con el buildingId obtenido del evento
            (0, vitest_1.expect)(TrazabilityService_1.trazabilityService.registerTrazability).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                buildingId: TEST_BUILDING_ID,
                action: 'ELIMINAR'
            }));
        });
    });
});
//# sourceMappingURL=events.test.js.map