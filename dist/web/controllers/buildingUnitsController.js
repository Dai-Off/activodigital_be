"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUnit = exports.importUnitsFromCatastro = exports.upsertUnits = exports.listUnits = void 0;
const buildingUnitService_1 = require("../../domain/services/buildingUnitService");
const TrazabilityService_1 = require("../../domain/trazability/TrazabilityService");
const interfaceTrazability_1 = require("../../domain/trazability/interfaceTrazability");
const service = new buildingUnitService_1.BuildingUnitService();
const listUnits = async (req, res) => {
    try {
        const buildingId = req.params.id;
        const units = await service.listUnits(buildingId);
        const occupancyPct = service.calculateOccupancy(units);
        res.json({
            data: units,
            occupancyPct
        });
    }
    catch (error) {
        console.error("Error al listar unidades", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.listUnits = listUnits;
const upsertUnits = async (req, res) => {
    try {
        const buildingId = req.params.id;
        const body = Array.isArray(req.body?.units) ? req.body.units : [];
        const units = await service.upsertUnits(buildingId, body);
        TrazabilityService_1.trazabilityService.registerTrazability({ authUserId: req?.user?.id || null, buildingId, action: interfaceTrazability_1.ActionsValues['ACTUALIZAR LIBRO DEL EDIFICIO'], module: interfaceTrazability_1.ModuleValues.EDIFICIOS, description: "Cargo de las unidades manualmente" }).catch(err => console.error("Fallo trazabilidad:", err));
        res.status(201).json({ data: units });
    }
    catch (error) {
        console.error("Error al guardar unidades", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.upsertUnits = upsertUnits;
const importUnitsFromCatastro = async (req, res) => {
    try {
        const buildingId = req.params.id;
        const rc = (req.body?.rc || req.query?.rc);
        if (!rc) {
            res.status(400).json({ error: "El campo rc es requerido" });
            return;
        }
        const units = await service.importFromCatastro(buildingId, rc);
        TrazabilityService_1.trazabilityService.registerTrazability({ authUserId: req?.user?.id || null, buildingId, action: interfaceTrazability_1.ActionsValues['ACTUALIZAR LIBRO DEL EDIFICIO'], module: interfaceTrazability_1.ModuleValues.EDIFICIOS, description: "Carga de las unidades desde catastro" }).catch(err => console.error("Fallo trazabilidad:", err));
        res.status(201).json({ data: units });
    }
    catch (error) {
        console.error("Error al importar unidades desde Catastro", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.importUnitsFromCatastro = importUnitsFromCatastro;
const deleteUnit = async (req, res) => {
    try {
        const buildingId = req.params.id;
        const unitId = req.params.unitId;
        if (!unitId) {
            res.status(400).json({ error: "El campo unitId es requerido" });
            return;
        }
        await service.deleteUnit(buildingId, unitId);
        TrazabilityService_1.trazabilityService.registerTrazability({ authUserId: req?.user?.id || null, buildingId, action: interfaceTrazability_1.ActionsValues['ELIMINAR'], module: interfaceTrazability_1.ModuleValues.EDIFICIOS, description: "Eliminación de las unidades" }).catch(err => console.error("Fallo trazabilidad:", err));
        res.status(204).send();
    }
    catch (error) {
        console.error("Error al eliminar unidad", error);
        if (error instanceof Error && error.message.includes("no encontrada")) {
            res.status(404).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.deleteUnit = deleteUnit;
//# sourceMappingURL=buildingUnitsController.js.map