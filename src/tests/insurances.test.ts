import './setupMocks';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { trazabilityService } from '../domain/trazability/TrazabilityService';

// Mock de la Trazabilidad para verificar que se llame
vi.mock('../domain/trazability/TrazabilityService', () => ({
  trazabilityService: {
    registerTrazability: vi.fn().mockResolvedValue({})
  }
}));

describe('Módulo Insurance (Seguros) - Integration Tests', () => {
  const mockToken = 'Bearer valid-token';
  let insuranceId = '';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /insurances', () => {
    it('Debería obtener los seguros de un edificio pasando buildingId', async () => {
      const response = await request(app)
        .get('/insurances')
        .set('Authorization', mockToken)
        .query({ buildingId: '7657b043-8453-496d-9834-2c01615d416d' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('count');
    });

    it('Debería fallar (400) si no se proporciona buildingId', async () => {
      const response = await request(app)
        .get('/insurances')
        .set('Authorization', mockToken);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('buildingId es requerido');
    });
  });

  describe('POST /insurances', () => {
    const newPolicy = {
      buildingId: '7657b043-8453-496d-9834-2c01615d416d',
      policyNumber: 'POL-777',
      insurer: 'Allianz',
      status: 'active',
      annualPremium: 1200,
      coverageType: 'Todo Riesgo',
      issueDate: '2025-01-01',
      expirationDate: '2026-01-01',
      coverageDetails: { incendio: true }
    };

    it('Debería crear una póliza y registrar trazabilidad', async () => {
      const response = await request(app)
        .post('/insurances')
        .set('Authorization', mockToken)
        .send(newPolicy);

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('éxito');
      // Verificamos que se llamó a trazabilidad
      expect(trazabilityService.registerTrazability).toHaveBeenCalled();
      console.log(response.body.data?.id);

      insuranceId = response.body.data?.id
    });

    it('Debería fallar si faltan campos obligatorios', async () => {
      const response = await request(app)
        .post('/insurances')
        .set('Authorization', mockToken)
        .send({ buildingId: '7657b043-8453-496d-9834-2c01615d416d' }); // Faltan policyNumber e insurer

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /insurances/:id', () => {
    it('Debería actualizar una póliza existente', async () => {
      const response = await request(app)
        .put(`/insurances/${insuranceId}`)
        .set('Authorization', mockToken)
        .send({ status: 'expired' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('expired');
    });
  });

  describe('DELETE /insurances/:id', () => {
    it('Debería eliminar una póliza correctamente', async () => {
      // Necesitamos que el mock de "delete" devuelva éxito
      const response = await request(app)
        .delete(`/insurances/${insuranceId}`)
        .set('Authorization', mockToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});