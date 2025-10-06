"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificateEnergeticoController = void 0;
const certificateEnergeticoService_1 = require("../../domain/services/certificateEnergeticoService");
const certificateEnergetico_1 = require("../../types/certificateEnergetico");
class CertificateEnergeticoController {
    constructor() {
        /**
         * Crear sesión de certificado energético simple (solo buildingId)
         * POST /api/certificados-energeticos/sessions/simple
         */
        this.createSimpleSession = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const { buildingId } = req.body;
                if (!buildingId) {
                    res.status(400).json({ error: 'Falta el campo requerido: buildingId' });
                    return;
                }
                // Crear sesión simple usando el método existente pero con datos mínimos
                const simpleRequest = {
                    buildingId,
                    kind: 'building', // Default kind
                    documents: [] // Sin documentos inicialmente
                };
                const session = await this.getCertificateService().createEnergyCertificateSession(simpleRequest, userId);
                res.json({ data: session });
            }
            catch (error) {
                console.error('Error al crear sesión simple de certificado energético:', error);
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Error interno del servidor'
                });
            }
        };
        /**
         * Crear sesión de certificado energético con documentos
         * POST /api/certificados-energeticos/sessions
         */
        this.createSession = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const data = req.body;
                // Validación básica
                if (!data.buildingId || !data.kind || !data.documents || data.documents.length === 0) {
                    res.status(400).json({ error: 'Faltan campos requeridos: buildingId, kind, documents' });
                    return;
                }
                const session = await this.getCertificateService().createEnergyCertificateSession(data, userId);
                res.status(201).json({ data: session });
            }
            catch (error) {
                console.error('Error al crear sesión de certificado energético:', error);
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Error interno del servidor'
                });
            }
        };
        /**
         * Actualizar sesión de certificado energético (para datos de IA)
         * PUT /api/certificados-energeticos/sessions/:sessionId
         */
        this.updateSession = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const sessionId = req.params.sessionId;
                const data = req.body;
                const session = await this.getCertificateService().updateEnergyCertificateSession(sessionId, data, userId);
                res.json({ data: session });
            }
            catch (error) {
                console.error('Error al actualizar sesión de certificado energético:', error);
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Error interno del servidor'
                });
            }
        };
        /**
         * Confirmar certificado energético (guardar datos finales)
         * POST /api/certificados-energeticos/sessions/:sessionId/confirm
         */
        this.confirmCertificate = async (req, res) => {
            try {
                console.log('🎯 CONTROLADOR confirmCertificate - Petición recibida');
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const sessionId = req.params.sessionId;
                const finalData = req.body;
                console.log('🎯 CONTROLADOR - sessionId:', sessionId, 'finalData:', JSON.stringify(finalData, null, 2));
                const certificateRequest = {
                    sessionId,
                    finalData
                };
                const certificate = await this.getCertificateService().confirmEnergyCertificate(certificateRequest, userId);
                res.status(201).json({ data: certificate });
            }
            catch (error) {
                console.error('Error al confirmar certificado energético:', error);
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Error interno del servidor'
                });
            }
        };
        /**
         * Obtener sesiones y certificados de un edificio
         * GET /api/certificados-energeticos/building/:buildingId
         */
        this.getByBuilding = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const buildingId = req.params.buildingId;
                const certificatesData = await this.getCertificateService().getEnergyCertificatesByBuilding(buildingId, userId);
                res.json({ data: certificatesData });
            }
            catch (error) {
                console.error('Error al obtener certificados del edificio:', error);
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Error interno del servidor'
                });
            }
        };
        /**
         * Obtener todos los certificados energéticos del usuario
         * GET /api/certificados-energeticos
         */
        this.getAll = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const certificates = await this.getCertificateService().getAllEnergyCertificatesForUser(userId);
                res.json({ data: certificates });
            }
            catch (error) {
                console.error('Error al obtener certificados energéticos:', error);
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Error interno del servidor'
                });
            }
        };
        /**
         * Eliminar sesión de certificado energético
         * DELETE /api/certificados-energeticos/sessions/:sessionId
         */
        this.deleteSession = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const sessionId = req.params.sessionId;
                await this.getCertificateService().deleteEnergyCertificateSession(sessionId, userId);
                res.status(204).send();
            }
            catch (error) {
                console.error('Error al eliminar sesión de certificado energético:', error);
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Error interno del servidor'
                });
            }
        };
        /**
         * Eliminar certificado energético confirmado
         * DELETE /api/certificados-energeticos/:certificateId
         */
        this.deleteCertificate = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const certificateId = req.params.certificateId;
                await this.getCertificateService().deleteEnergyCertificate(certificateId, userId);
                res.status(204).send();
            }
            catch (error) {
                console.error('Error al eliminar certificado energético:', error);
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Error interno del servidor'
                });
            }
        };
        /**
         * Procesar certificado con datos de IA desde el frontend
         * POST /api/certificados-energeticos/process-ai-data
         */
        this.processAIData = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const { sessionId, extractedData } = req.body;
                if (!sessionId || !extractedData) {
                    res.status(400).json({ error: 'Faltan campos requeridos: sessionId, extractedData' });
                    return;
                }
                // Actualizar sesión con datos extraídos por IA
                const updateData = {
                    status: certificateEnergetico_1.AIExtractionStatus.EXTRACTED,
                    extractedData
                };
                const session = await this.getCertificateService().updateEnergyCertificateSession(sessionId, updateData, userId);
                res.json({ data: session });
            }
            catch (error) {
                console.error('Error al procesar datos de IA:', error);
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Error interno del servidor'
                });
            }
        };
        /**
         * Obtener documentos de una sesión específica
         * GET /api/certificados-energeticos/sessions/:sessionId/documents
         */
        this.getSessionDocuments = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const sessionId = req.params.sessionId;
                const documents = await this.getCertificateService().getSessionDocuments(sessionId, userId);
                res.json({ data: documents });
            }
            catch (error) {
                console.error('Error al obtener documentos de sesión:', error);
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Error interno del servidor'
                });
            }
        };
    }
    getCertificateService() {
        return new certificateEnergeticoService_1.CertificateEnergeticoService();
    }
}
exports.CertificateEnergeticoController = CertificateEnergeticoController;
//# sourceMappingURL=certificateEnergeticoController.js.map