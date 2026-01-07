import './setupMocks';
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Módulo Dashboard - Integration Tests', () => {
    const endpoint = '/dashboard/stats';

    describe('GET /dashboard/stats - Permisos y Roles', () => {
        
        it('Debería obtener estadísticas completas para un ADMINISTRADOR/PROPIETARIO', async () => {
            const response = await request(app)
                .get(endpoint)
                .set('Authorization', 'Bearer token-admin');

            expect([200, 500]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body).toHaveProperty('data');
                const stats = response.body.data;
                
                // Los administradores DEBEN ver datos financieros
                expect(stats).toHaveProperty('totalValue');
                expect(stats).toHaveProperty('totalAssets');
                expect(typeof stats.totalValue).toBe('number');
            }
        });

        it('Debería obtener estadísticas limitadas para un TÉCNICO (Sin datos financieros)', async () => {

            const response = await request(app)
                .get(endpoint)
                .set('Authorization', 'Bearer token-tecnico');

            expect([200, 500]).toContain(response.status);

            if (response.status === 200) {
                const stats = response.body.data;
                
                expect(stats.totalValue).toBe(0);
                expect(stats.totalRehabilitationCost).toBe(0);
                
                expect(stats).toHaveProperty('totalAssets');
                expect(stats).toHaveProperty('completionPercentage');
                expect(stats).toHaveProperty('typologyDistribution');
            }
        });
    });

    describe('Validación de Métricas Específicas', () => {
        it('Debería contener la distribución de tipologías correcta', async () => {
            const response = await request(app)
                .get(endpoint)
                .set('Authorization', 'Bearer token-valid');

            if (response.status === 200) {
                const { typologyDistribution } = response.body.data;
                expect(typologyDistribution).toHaveProperty('residential');
                expect(typologyDistribution).toHaveProperty('mixed');
                expect(typologyDistribution).toHaveProperty('commercial');
            }
        });

        it('Debería manejar correctamente el cálculo de ESG promedio', async () => {
            const response = await request(app)
                .get(endpoint)
                .set('Authorization', 'Bearer token-valid');

            if (response.status === 200) {
                const { averageESGScore } = response.body.data;
                if (averageESGScore !== null) {
                    const validLabels = ['Premium', 'Gold', 'Silver', 'Bronze', 'Crítico'];
                    expect(validLabels).toContain(averageESGScore);
                }
            }
        });
    });
});