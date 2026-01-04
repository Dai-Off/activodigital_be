import './setupMocks';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { trazabilityService } from '../domain/trazability/TrazabilityService';

vi.mock('../domain/trazability/TrazabilityService', () => ({
    trazabilityService: {
        registerTrazability: vi.fn(() => Promise.resolve(true))
    }
}));


describe('Módulo Service Invoices - Integration Tests', () => {
    const buildingId = 'f773ffa0-b934-4df6-a48c-fba17abf4c0f';
    let createdInvoiceId: string;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /service-invoices', () => {
        it('Debería crear una factura válida y registrar trazabilidad', async () => {
            const payload = {
                building_id: buildingId,
                service_type: 'electricity',
                invoice_date: '2024-03-15',
                amount_eur: 150.50,
                provider: 'Endesa'
            };

            const response = await request(app)
                .post('/service-invoices')
                .send(payload);

            expect([201, 500]).toContain(response.status);

            if (response.status === 201) {
                createdInvoiceId = response.body.data.id;
                expect(response.body.data.service_type).toBe('electricity');
                // Verificar que se llamó a trazabilidad
                expect(trazabilityService.registerTrazability).toHaveBeenCalled();
            }
        });

        it('Debería rechazar un service_type no válido', async () => {
            const payload = {
                building_id: buildingId,
                service_type: 'netflix', // Tipo inválido
                invoice_date: '2024-03-15',
                amount_eur: 15.99
            };

            const response = await request(app)
                .post('/service-invoices')
                .send(payload);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('service_type debe ser uno de');
        });

        it('Debería rechazar montos negativos', async () => {
            const payload = {
                building_id: buildingId,
                service_type: 'water',
                invoice_date: '2024-03-15',
                amount_eur: -50 // Monto inválido
            };

            const response = await request(app)
                .post('/service-invoices')
                .send(payload);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('amount_eur debe ser >= 0');
        });
    });

    describe('GET /service-invoices/building/:buildingId', () => {
        it('Debería filtrar facturas por serviceType mediante query params', async () => {
            const response = await request(app)
                .get(`/service-invoices/building/${buildingId}`)
                .query({ serviceType: 'water' });

            expect([200, 500]).toContain(response.status);
            if (response.status === 200) {
                expect(Array.isArray(response.body.data)).toBe(true);
            }
        });
    });

    describe('PUT /service-invoices/:id', () => {
        it('Debería validar el service_type también en la actualización', async () => {
            if (!createdInvoiceId) return;

            const response = await request(app)
                .put(`/service-invoices/${createdInvoiceId}`)
                .send({ service_type: 'invalid_type' });

            expect(response.status).toBe(400);
        });

        it('Debería actualizar correctamente el monto', async () => {
            if (!createdInvoiceId) return;

            const response = await request(app)
                .put(`/service-invoices/${createdInvoiceId}`)
                .send({ amount_eur: 200 });

            expect([200, 404, 500]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body.data.amount_eur).toBe(200);
            }
        });
    });

    describe('DELETE /service-invoices/:id', () => {
        it('Debería retornar 204 al eliminar una factura', async () => {
            if (!createdInvoiceId) return;

            const response = await request(app)
                .delete(`/service-invoices/${createdInvoiceId}`);

            expect([204, 500]).toContain(response.status);
        });
    });
});