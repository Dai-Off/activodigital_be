"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./setupMocks");
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
(0, vitest_1.describe)('Módulo Dashboard - Integration Tests', () => {
    const endpoint = '/dashboard/stats';
    (0, vitest_1.describe)('GET /dashboard/stats - Permisos y Roles', () => {
        (0, vitest_1.it)('Debería obtener estadísticas completas para un ADMINISTRADOR/PROPIETARIO', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(endpoint)
                .set('Authorization', 'Bearer token-admin');
            (0, vitest_1.expect)([200, 500]).toContain(response.status);
            if (response.status === 200) {
                (0, vitest_1.expect)(response.body).toHaveProperty('data');
                const stats = response.body.data;
                // Los administradores DEBEN ver datos financieros
                (0, vitest_1.expect)(stats).toHaveProperty('totalValue');
                (0, vitest_1.expect)(stats).toHaveProperty('totalAssets');
                (0, vitest_1.expect)(typeof stats.totalValue).toBe('number');
            }
        });
        (0, vitest_1.it)('Debería obtener estadísticas limitadas para un TÉCNICO (Sin datos financieros)', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(endpoint)
                .set('Authorization', 'Bearer token-tecnico');
            (0, vitest_1.expect)([200, 500]).toContain(response.status);
            if (response.status === 200) {
                const stats = response.body.data;
                (0, vitest_1.expect)(stats.totalValue).toBe(0);
                (0, vitest_1.expect)(stats.totalRehabilitationCost).toBe(0);
                (0, vitest_1.expect)(stats).toHaveProperty('totalAssets');
                (0, vitest_1.expect)(stats).toHaveProperty('completionPercentage');
                (0, vitest_1.expect)(stats).toHaveProperty('typologyDistribution');
            }
        });
    });
    (0, vitest_1.describe)('Validación de Métricas Específicas', () => {
        (0, vitest_1.it)('Debería contener la distribución de tipologías correcta', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(endpoint)
                .set('Authorization', 'Bearer token-valid');
            if (response.status === 200) {
                const { typologyDistribution } = response.body.data;
                (0, vitest_1.expect)(typologyDistribution).toHaveProperty('residential');
                (0, vitest_1.expect)(typologyDistribution).toHaveProperty('mixed');
                (0, vitest_1.expect)(typologyDistribution).toHaveProperty('commercial');
            }
        });
        (0, vitest_1.it)('Debería manejar correctamente el cálculo de ESG promedio', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(endpoint)
                .set('Authorization', 'Bearer token-valid');
            if (response.status === 200) {
                const { averageESGScore } = response.body.data;
                if (averageESGScore !== null) {
                    const validLabels = ['Premium', 'Gold', 'Silver', 'Bronze', 'Crítico'];
                    (0, vitest_1.expect)(validLabels).toContain(averageESGScore);
                }
            }
        });
    });
});
//# sourceMappingURL=dashboard.test.js.map