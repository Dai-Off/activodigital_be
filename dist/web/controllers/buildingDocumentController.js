"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingDocumentController = void 0;
const buildingDocumentService_1 = require("../../domain/services/buildingDocumentService");
class BuildingDocumentController {
    constructor() {
        this.createBuildingDocument = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const data = req.body;
                // Validación básica
                if (!data.building_id || !data.file_name || !data.storage_path || !data.storage_file_name || !data.category) {
                    res.status(400).json({ error: 'Faltan campos requeridos: building_id, file_name, storage_path, storage_file_name, category' });
                    return;
                }
                // Validar file_size
                if (data.file_size === undefined || data.file_size < 0) {
                    res.status(400).json({ error: 'file_size debe ser >= 0' });
                    return;
                }
                const document = await this.getService().createBuildingDocument(data, userId);
                res.status(201).json({ data: document });
            }
            catch (error) {
                console.error('Error al crear documento de edificio:', error);
                res.status(500).json({ error: error.message || 'Error interno del servidor' });
            }
        };
        this.getBuildingDocuments = async (req, res) => {
            try {
                const userId = req.user?.id;
                const { buildingId } = req.params;
                const category = req.query.category;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                if (!buildingId) {
                    res.status(400).json({ error: 'buildingId es requerido' });
                    return;
                }
                const documents = await this.getService().getBuildingDocumentsByBuilding(buildingId, category);
                res.json({ data: documents });
            }
            catch (error) {
                console.error('Error al obtener documentos de edificio:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        this.getBuildingDocument = async (req, res) => {
            try {
                const userId = req.user?.id;
                const { id } = req.params;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const document = await this.getService().getBuildingDocumentById(id);
                if (!document) {
                    res.status(404).json({ error: 'Documento no encontrado' });
                    return;
                }
                res.json({ data: document });
            }
            catch (error) {
                console.error('Error al obtener documento:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        this.updateBuildingDocument = async (req, res) => {
            try {
                const userId = req.user?.id;
                const { id } = req.params;
                const data = req.body;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const document = await this.getService().updateBuildingDocument(id, data, userId);
                res.json({ data: document });
            }
            catch (error) {
                console.error('Error al actualizar documento:', error);
                res.status(500).json({ error: error.message || 'Error interno del servidor' });
            }
        };
        this.deleteBuildingDocument = async (req, res) => {
            try {
                const userId = req.user?.id;
                const { id } = req.params;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                await this.getService().deleteBuildingDocument(id);
                res.status(204).send();
            }
            catch (error) {
                console.error('Error al eliminar documento:', error);
                res.status(500).json({ error: error.message || 'Error interno del servidor' });
            }
        };
    }
    getService() {
        return new buildingDocumentService_1.BuildingDocumentService();
    }
}
exports.BuildingDocumentController = BuildingDocumentController;
//# sourceMappingURL=buildingDocumentController.js.map