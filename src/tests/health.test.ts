import './setupMocks';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Endpoints de Diagnóstico (Health & Env)', () => {

  describe('GET /health/env', () => {
    it('Debería cargar las variables de entorno correctamente desde .env.test', async () => {
      const response = await request(app).get('/health/env');

      expect(response.status).toBe(200);
      
      expect(response.body.SUPABASE_URL).not.toBeNull();
      expect(response.body.SUPABASE_ANON_KEY).not.toBeNull();
      
      if (response.body.SUPABASE_ANON_KEY) {
        expect(response.body.SUPABASE_ANON_KEY).toMatch(/^.{4}\.\.\..{4}$/);
      }
    });

    it('No debería tener el prefijo @ en la URL de Supabase (Bug común)', async () => {
      const response = await request(app).get('/health/env');
      expect(response.body.SUPABASE_URL_hasAtPrefix).toBe(false);
    });
  });

  describe('GET /health/supabase', () => {
    it('Debería conectar con Supabase y obtener la hora del servidor', async () => {
      const response = await request(app).get('/health/supabase');

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.connected).toBe(true);
      expect(response.body.serverTime).not.toBeNull();
      expect(response.body.error).toBeNull();
    });
  });

});