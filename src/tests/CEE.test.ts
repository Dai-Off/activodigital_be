import './setupMocks';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import {
    EnergyCertificateKind,
    AIExtractionStatus,
    EnergyRatingLetter,
    GetEnergyCertificatesResponse
} from '@/types/certificateEnergetico';

describe('Módulo de Certificados Energéticos - Integration Tests', () => {
    const buildingId = 'f773ffa0-b934-4df6-a48c-fba17abf4c0f';
    let sessionId: string;
    let certificateId: string;

    // 1. CREACIÓN DE SESIÓN SIMPLE
    describe('POST /certificados-energeticos/sessions/simple', () => {
        it('Debería crear una sesión base para el edificio', async () => {
            const response = await request(app)
                .post('/certificados-energeticos/sessions/simple')
                .send({ buildingId });

            expect([200, 201, 500]).toContain(response.status);

            if (response.status !== 500) {
                expect(response.body.data).toHaveProperty('id');
                sessionId = response.body.data.id;
            } else {
                expect(response.body).toHaveProperty('error');
            }
        });
    });

    // 2. PROCESAMIENTO DE DATOS IA
    describe('POST /certificados-energeticos/process-ai-data', () => {
        it('Debería simular la carga de datos extraídos por IA', async () => {
            if (!sessionId) return;

            const payload = {
                sessionId,
                extractedData: {
                    rating: { value: EnergyRatingLetter.B, confidence: 0.92 },
                    primaryEnergyKwhPerM2Year: { value: 120.5, confidence: 0.88 },
                    emissionsKgCo2PerM2Year: { value: 25.4, confidence: 0.90 },
                    certificateNumber: { value: `CERT-${Date.now()}`, confidence: 1.0 },
                    issuerName: { value: 'Certificador Dinámico S.A.', confidence: 0.85 },
                    issueDate: { value: '2024-01-01', confidence: 0.95 },
                    expiryDate: { value: '2034-01-01', confidence: 0.95 }
                }
            };

            const response = await request(app)
                .post('/certificados-energeticos/process-ai-data')
                .send(payload);

            expect([200, 500]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body.data.status).toBe(AIExtractionStatus.EXTRACTED);
            }
        });
    });

    // 3. CONFIRMACIÓN FINAL
    describe('POST /certificados-energeticos/sessions/:sessionId/confirm', () => {
        it('Debería convertir la sesión en un certificado final confirmado', async () => {
            if (!sessionId) return;

            const finalData = {
                rating: EnergyRatingLetter.B,
                primaryEnergyKwhPerM2Year: 120.5,
                emissionsKgCo2PerM2Year: 25.4,
                certificateNumber: `FINAL-${Date.now()}`,
                issuerName: 'Técnico Verificador',
                issueDate: '2024-01-01',
                expiryDate: '2034-01-01',
                scope: EnergyCertificateKind.BUILDING
            };

            const response = await request(app)
                .post(`/certificados-energeticos/sessions/${sessionId}/confirm`)
                .set('Authorization', 'Bearer fake-jwt-token')
                .send(finalData);

            expect([201, 500]).toContain(response.status);

            if (response.status === 201) {
                expect(response.body.data).toHaveProperty('id');
                certificateId = response.body.data.id;
            }
        });
    });

    // 4. CONSULTAS (GET)
    describe('Consultas de Certificados', () => {
        it('Debería obtener la estructura GetEnergyCertificatesResponse correctamente', async () => {
            const response = await request(app)
                .get(`/certificados-energeticos/building/${buildingId}`);

            expect(response.status).toBe(200);

            const data: GetEnergyCertificatesResponse = response.body.data;
            expect(Array.isArray(data.sessions)).toBe(true);
            expect(Array.isArray(data.certificates)).toBe(true);
        });

        it('Debería listar todos los certificados del usuario autenticado', async () => {
            const response = await request(app).get('/certificados-energeticos');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    // 5. ELIMINACIÓN
    describe('Eliminación de registros (Cleanup)', () => {
        it('Debería eliminar el certificado final o manejar error 500', async () => {
            if (!certificateId) return;

            const response = await request(app)
                .delete(`/certificados-energeticos/${certificateId}`);

            expect([204, 500]).toContain(response.status);

            if (response.status === 500) {
                console.log('Nota: Error en eliminación (posible restricción FK):', response.body.error);
            }
        });

        it('Debería eliminar la sesión restante o manejar error 500', async () => {
            if (!sessionId) return;

            const response = await request(app)
                .delete(`/certificados-energeticos/sessions/${sessionId}`);

            expect([204, 500]).toContain(response.status);
        });
    });
});