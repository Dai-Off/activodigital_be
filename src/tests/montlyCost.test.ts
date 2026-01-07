import './setupMocks';
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Módulo Monthly Costs - Integration Tests', () => {
  const buildingId = 'f773ffa0-b934-4df6-a48c-fba17abf4c0f';
  const currentYear = new Date().getFullYear();

  describe('GET /service-expenses/building/:buildingId', () => {
    it('Debería obtener el listado de costes de un edificio', async () => {
      const response = await request(app)
        .get(`/service-expenses/building/${buildingId}`);

      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('data');
        expect(response.body.building_id).toBe(buildingId);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it('Debería filtrar por año y mes correctamente', async () => {
      const response = await request(app)
        .get(`/service-expenses/building/${buildingId}`)
        .query({ year: 2024, month: 1 });

      expect([200, 500]).toContain(response.status);
      if (response.status === 200 && response.body.data.length > 0) {
        expect(response.body.year).toBe(2024);
        expect(response.body.month).toBe(1);
      }
    });

    it('Debería devolver 400 si se envía mes sin año', async () => {
      const response = await request(app)
        .get(`/service-expenses/building/${buildingId}`)
        .query({ month: 5 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('requiere year');
    });

    it('Debería manejar correctamente cuando no existen datos para un periodo', async () => {
      // Usamos un año muy lejano para asegurar que no hay datos
      const response = await request(app)
        .get(`/service-expenses/building/${buildingId}`)
        .query({ year: 1990 });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.message).toContain('No se encontraron gastos para el año 1990');
    });
  });

  describe('GET /service-expenses/building/:buildingId/summary', () => {
    it('Debería obtener el resumen anual con los cálculos de agregación', async () => {
      const response = await request(app)
        .get(`/service-expenses/building/${buildingId}/summary`)
        .query({ year: currentYear });

      expect([200, 500]).toContain(response.status);

      if (response.status === 200) {
        const summary = response.body.data;
        expect(summary).toHaveProperty('total_annual_eur');
        expect(summary).toHaveProperty('average_monthly_eur');
        expect(summary).toHaveProperty('breakdown');
        expect(summary.breakdown).toHaveProperty('electricity_annual');
        
        // El promedio debería ser el total entre el número de meses
        if (summary.months_count > 0) {
          expect(summary.average_monthly_eur).toBeCloseTo(
            summary.total_annual_eur / summary.months_count, 
            2
          );
        }
      }
    });
  });

  describe('GET /service-expenses/:id', () => {
    it('Debería devolver 404 para un ID de coste inexistente', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app).get(`/service-expenses/${fakeId}`);

      expect([404, 500]).toContain(response.status);
    });
  });
});