import './setupMocks';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';

const TEST_LOCATION_NAME = "Madrid";

describe('Módulo Idealista Scraper - Integration Tests', () => {
  const mockToken = 'Bearer valid-token';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /idealistascraper/idealista', () => {
    it('Debería ejecutar el scraper y devolver promedios calculados', async () => {
      const response = await request(app)
        .post('/idealistascraper/idealista')
        .set('Authorization', mockToken)
        .send({
          locationName: TEST_LOCATION_NAME,
          maxItems: 2
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('exitosamente');
      expect(response.body.data.averagePrice).toBe(150000);
      expect(response.body.data.averagePricePerSqm).toBe(2000);
    });

    it('Debería normalizar el nombre de la ubicación (acentos/mayúsculas)', async () => {
      // Si en el JSON está "Madrid", debería aceptar "mádrid"
      const response = await request(app)
        .post('/idealistascraper/idealista')
        .set('Authorization', mockToken)
        .send({
          locationName: "MÁDRID" 
        });

      expect(response.status).toBe(200);
    });

    it('Debería fallar (400) si no se envía locationName', async () => {
      const response = await request(app)
        .post('/idealistascraper/idealista')
        .set('Authorization', mockToken)
        .send({ maxItems: 10 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('locationName');
    });

    it('Debería fallar (500) si la ubicación no existe en el catálogo', async () => {
      const response = await request(app)
        .post('/idealistascraper/idealista')
        .set('Authorization', mockToken)
        .send({ locationName: "UbicacionInexistente123" });

      expect(response.status).toBe(500);
      expect(response.body.details).toContain('no existe en el catálogo');
    });
  });
});