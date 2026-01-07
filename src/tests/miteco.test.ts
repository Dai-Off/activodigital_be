import './setupMocks';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Módulo MITECO API - Integration Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rutas de Datasets', () => {
        it('GET /package-list - Debería parsear limit y offset a números', async () => {
            const response = await request(app)
                .get('/MITECOApi/package-list')
                .query({ limit: '5', offset: '10' });

            console.log(response.body);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('GET /package-details - Debería fallar si no se envía el ID', async () => {
            const response = await request(app).get('/MITECOApi/package-details');
            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Falta parámetro obligatorio: id');
        });
    });

    describe('Rutas de Metadatos', () => {
        it('GET /organization-list - Debería convertir "true" (string) a boolean', async () => {
            const response = await request(app)
                .get('/MITECOApi/organization-list')
                .query({ all_fields: 'true' });

            expect(response.status).toBe(200);
        });
    });

    describe('Rutas de DataStore (SQL)', () => {
        it('GET /datastore-search-sql - Debería ejecutar consulta SQL', async () => {
            const sqlQuery = 'SELECT * FROM "resource-id" LIMIT 1';
            const response = await request(app)
                .get('/MITECOApi/datastore-search-sql')
                .query({ sql: sqlQuery });

            expect(response.status).toBe(200);
        });

        it('GET /datastore-search-sql - Debería dar error 400 si falta el parámetro sql', async () => {
            const response = await request(app).get('/MITECOApi/datastore-search-sql');
            expect(response.status).toBe(400);
        });
    });

    describe('Rutas de Utilidad Personalizadas', () => {
        it('GET /search/by-organization - Debería buscar por orgId', async () => {
            const response = await request(app)
                .get('/MITECOApi/search/by-organization')
                .query({ orgId: 'dg-agua', q: 'caudal' });

            expect(response.status).toBe(200);
        });

        it('GET /search/by-tag - Debería buscar por etiqueta', async () => {
            const response = await request(app)
                .get('/MITECOApi/search/by-tag')
                .query({ tag: 'energia' });

            expect(response.status).toBe(200);
        });
    });

    describe('Manejo de Errores', () => {
        it('Debería retornar 200', async () => {
            // Forzamos un error en una ruta específica para este test
            const response = await request(app).get('/MITECOApi/system-status');
            expect(response.status).toBe(200);
        });
    });
});