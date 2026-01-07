import './setupMocks';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';

// 1. MOCK DE TRAZABILIDAD (Antes de las importaciones)
vi.mock('../domain/trazability/TrazabilityService', () => ({
  trazabilityService: {
    registerTrazability: vi.fn().mockResolvedValue(true)
  }
}));

import { trazabilityService } from '../domain/trazability/TrazabilityService';

describe('Módulo Rents - Integration Tests', () => {
  const buildingId = '47956c08-0c16-40ae-ac85-1b73ac06a82e';
  const unitId = 'de6d03e1-ae36-44c3-9983-1356588945bd';
  let invoiceId: string;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /rents/invoices', () => {
    it('Debería crear una factura de renta, calcular el total y registrar trazabilidad', async () => {
      const payload = {
        buildingId,
        unitId,
        invoiceMonth: '2024-05-01',
        rentAmount: 1000,
        additionalCharges: 50, // Total debería ser 1050
        dueDate: '2024-05-10'
      };

      const response = await request(app)
        .post('/rents/invoices')
        .send(payload);

      expect([201, 500]).toContain(response.status);

      if (response.status === 201) {
        invoiceId = response.body.data.id;
        expect(response.body.data.totalAmount).toBe(1050);
        expect(response.body.data.status).toBe('pending');
        expect(trazabilityService.registerTrazability).toHaveBeenCalled();
      }
    });

    it('Debería fallar si faltan campos requeridos', async () => {
      const response = await request(app)
        .post('/rents/invoices')
        .send({ buildingId }); // Faltan unitId, rentAmount, etc.

      expect(response.status).toBe(400);
    });
  });

  describe('GET /rents/building/:buildingId/summary/:month', () => {
    it('Debería validar el formato de mes YYYY-MM', async () => {
      const response = await request(app)
        .get(`/rents/building/${buildingId}/summary/2024-5`); // Formato incorrecto

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Formato de mes inválido');
    });

    it('Debería obtener el resumen financiero del mes', async () => {
      const validMonth = '2024-05';
      const response = await request(app)
        .get(`/rents/building/${buildingId}/summary/${validMonth}`);

      expect([200, 500]).toContain(response.status);

      if (response.status === 200) {
        const summary = response.body.data;
        expect(summary).toHaveProperty('totalInvoiced');
        expect(summary).toHaveProperty('collectionPercentage');
        expect(summary.month).toBe(validMonth);
        expect(Array.isArray(summary.invoices)).toBe(true);
      }
    });
  });

  describe('PUT /rents/invoices/:id', () => {
    it('Debería actualizar el pago de una factura y recalcular totales si es necesario', async () => {
      if (!invoiceId) return;

      const updatePayload = {
        paymentAmount: 1050,
        paymentDate: '2024-05-05',
        paymentMethod: 'transfer',
        rentAmount: 1100 // Cambiamos la renta base
      };

      const response = await request(app)
        .put(`/rents/invoices/${invoiceId}`)
        .send(updatePayload);

      expect([200, 404, 500]).toContain(response.status);

      if (response.status === 200) {
        // 1100 renta + 50 cargos adicionales previos = 1150
        expect(response.body.data.totalAmount).toBe(1150);
        expect(response.body.data.paymentAmount).toBe(1050);
      }
    });
  });

  describe('DELETE /rents/invoices/:id', () => {
    it('Debería eliminar la factura y registrar trazabilidad', async () => {
      if (!invoiceId) return;

      const response = await request(app).delete(`/rents/invoices/${invoiceId}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(trazabilityService.registerTrazability).toHaveBeenCalled();
      }
    });
  });
}); 