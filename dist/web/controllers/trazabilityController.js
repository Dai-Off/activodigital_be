"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTrazabilityControler = void 0;
const TrazabilityService_1 = require("../../domain/trazability/TrazabilityService");
const listTrazabilityControler = async (req, res) => {
    try {
        const trazabilidad = await TrazabilityService_1.trazabilityService.listTrazability();
        if (!trazabilidad) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(trazabilidad);
    }
    catch (error) {
        console.error('Error al obtener la trazabilidad:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.listTrazabilityControler = listTrazabilityControler;
//# sourceMappingURL=trazabilityController.js.map