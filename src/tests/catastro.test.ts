import './setupMocks';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';


describe('Módulo Catastro API - Integration Tests', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /catastroApi/provincias', () => {
    it('Debería obtener todas las provincias correctamente', async () => {
      const response = await request(app).get('/catastroApi/provincias');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('np');
    });
  });

  describe('GET /catastroApi/municipios', () => {
    it('Debería obtener municipios pasando la provincia por query', async () => {
      const response = await request(app)
        .get('/catastroApi/municipios')
        .query({ provincia: 'MADRID' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /catastroApi/vias', () => {
    it('Debería obtener las vías con parámetros obligatorios y opcionales', async () => {
      const response = await request(app)
        .get('/catastroApi/vias')
        .query({ 
          provincia: 'MADRID', 
          municipio: 'MADRID',
          tipoVia: 'CL',
          nombreVia: 'ALCALA' 
        });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /catastroApi/inmuebleRc', () => {
    it('Debería obtener datos de un inmueble por Referencia Catastral', async () => {
      const response = await request(app)
        .get('/catastroApi/inmuebleRc')
        .query({ rc: '0226704VK4702E0001AY' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rc');
    });
  });

  describe('GET /catastroApi/inmuebleLoc', () => {
    it('Debería manejar parámetros de localización (bloque, planta, etc.)', async () => {
      const response = await request(app)
        .get('/catastroApi/inmuebleLoc')
        .query({ 
          provincia: 'MADRID',
          municipio: 'MADRID',
          tipoVia: 'CL',
          nombreVia: 'MAYOR',
          numero: '1',
          planta: '2',
          puerta: 'B'
        });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /catastroApi/inmuebleXY', () => {
    it('Debería obtener inmuebles por coordenadas X e Y', async () => {
      const response = await request(app)
        .get('/catastroApi/inmuebleXY')
        .query({ x: '440500', y: '4475000' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});