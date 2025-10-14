"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingController = void 0;
const edificioService_1 = require("../../domain/services/edificioService");
class BuildingController {
    constructor() {
        this.createBuilding = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const data = req.body;
                // Validación básica
                if (!data.name || !data.address || !data.typology) {
                    res.status(400).json({ error: 'Faltan campos requeridos' });
                    return;
                }
                const building = await this.getBuildingService().createBuilding(data, userId);
                res.status(201).json({ data: building });
            }
            catch (error) {
                console.error('Error al crear edificio:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        this.getBuildings = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const buildings = await this.getBuildingService().getBuildingsByUser(userId);
                res.json({ data: buildings });
            }
            catch (error) {
                console.error('Error al obtener edificios:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        this.getBuilding = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const { id } = req.params;
                const building = await this.getBuildingService().getBuildingById(id, userId);
                if (!building) {
                    res.status(404).json({ error: 'Edificio no encontrado' });
                    return;
                }
                res.json({ data: building });
            }
            catch (error) {
                console.error('Error al obtener edificio:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        this.updateBuilding = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const { id } = req.params;
                const data = req.body;
                const building = await this.getBuildingService().updateBuilding(id, data, userId);
                res.json({ data: building });
            }
            catch (error) {
                console.error('Error al actualizar edificio:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        // Endpoints para gestión de imágenes
        this.uploadImages = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const { id } = req.params;
                const { images } = req.body;
                if (!images || !Array.isArray(images)) {
                    res.status(400).json({ error: 'Se requiere un array de imágenes' });
                    return;
                }
                // Validar que todas las imágenes tengan los campos requeridos
                for (const image of images) {
                    if (!image.id || !image.url || !image.title || !image.filename) {
                        res.status(400).json({ error: 'Cada imagen debe tener id, url, title y filename' });
                        return;
                    }
                }
                // Agregar cada imagen al edificio
                let building = await this.getBuildingService().getBuildingById(id, userId);
                if (!building) {
                    res.status(404).json({ error: 'Edificio no encontrado' });
                    return;
                }
                for (const image of images) {
                    building = await this.getBuildingService().addImage(id, image, userId);
                }
                res.json({ data: building });
            }
            catch (error) {
                console.error('Error al subir imágenes:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        this.deleteImage = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const { id, imageId } = req.params;
                const building = await this.getBuildingService().removeImage(id, imageId, userId);
                res.json({ data: building });
            }
            catch (error) {
                console.error('Error al eliminar imagen:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        this.setMainImage = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const { id } = req.params;
                const { imageId } = req.body;
                if (!imageId) {
                    res.status(400).json({ error: 'Se requiere imageId' });
                    return;
                }
                const building = await this.getBuildingService().setMainImage(id, imageId, userId);
                res.json({ data: building });
            }
            catch (error) {
                console.error('Error al establecer imagen principal:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
        // Nuevo endpoint para validar emails de técnico y CFO
        this.validateUserAssignments = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                const { technicianEmail, cfoEmail } = req.body;
                if (!technicianEmail && !cfoEmail) {
                    res.status(400).json({ error: 'Se requiere al menos un email para validar' });
                    return;
                }
                const validationResults = await this.getBuildingService().validateUserAssignments(technicianEmail, cfoEmail, userId);
                res.json({ data: validationResults });
            }
            catch (error) {
                console.error('Error al validar asignaciones:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        };
    }
    getBuildingService() {
        return new edificioService_1.BuildingService();
    }
}
exports.BuildingController = BuildingController;
//# sourceMappingURL=edificioController.js.map