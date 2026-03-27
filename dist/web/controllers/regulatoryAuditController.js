"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegulatoryAuditController = void 0;
const regulatoryAuditService_1 = require("../../domain/services/regulatoryAuditService");
const getRegulatoryAuditController = async (req, res) => {
    try {
        const { buildingId } = req.params;
        const userId = req.user?.id;
        if (!buildingId) {
            res.status(400).json({ error: 'buildingId es requerido' });
            return;
        }
        if (!userId) {
            res.status(401).json({ error: 'Usuario no autenticado' });
            return;
        }
        const service = new regulatoryAuditService_1.RegulatoryAuditService();
        const result = await service.getRegulatoryAudit(buildingId, userId);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error al obtener la auditoría regulatoria:', error);
        if (error.message === 'Edificio no encontrado') {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Error interno del servidor al obtener la auditoría regulatoria' });
        }
    }
};
exports.getRegulatoryAuditController = getRegulatoryAuditController;
//# sourceMappingURL=regulatoryAuditController.js.map