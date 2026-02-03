"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMonthlyRadiation = exports.GetTypicalMeteorologicalYear = exports.GetDetailedHourlyData = exports.GetBuildingPVEnergyOutput = void 0;
const PVGISApiService_1 = require("../../domain/services/PVGISApiService");
const pvgisApiService = new PVGISApiService_1.PVGISApiService();
const GetBuildingPVEnergyOutput = async (req, res) => {
    const lat = req.query.lat;
    const lon = req.query.lon;
    const peakpower = req.query.peakpower;
    const loss = req.query.loss;
    const mountingplace = req.query.mountingplace;
    if (!lat || !lon || !peakpower || !loss) {
        return res.status(400).json({
            error: "Faltan parámetros obligatorios: lat, lon, peakpower, loss.",
        });
    }
    try {
        const energyOutput = await pvgisApiService.GetBuildingPVEnergyOutput(lat, lon, peakpower, loss, mountingplace);
        res.status(200).json(energyOutput);
    }
    catch (error) {
        res.status(500).json({
            error: "Error interno del servidor al calcular la producción FV.",
        });
    }
};
exports.GetBuildingPVEnergyOutput = GetBuildingPVEnergyOutput;
const GetDetailedHourlyData = async (req, res) => {
    const lat = req.query.lat;
    const lon = req.query.lon;
    const pvcalculation = req.query.pvcalculation;
    const peakpower = req.query.peakpower;
    const loss = req.query.loss;
    if (!lat || !lon || !pvcalculation) {
        return res.status(400).json({
            error: "Faltan parámetros obligatorios: lat, lon, pvcalculation.",
        });
    }
    if (pvcalculation === "1" && (!peakpower || !loss)) {
        return res.status(400).json({
            error: "Si pvcalculation es '1', peakpower y loss son obligatorios.",
        });
    }
    try {
        const hourlyData = await pvgisApiService.GetDetailedHourlyData(lat, lon, pvcalculation, peakpower, loss);
        res.status(200).json(hourlyData);
    }
    catch (error) {
        console.error("Error al obtener los datos horarios (seriescalc):", error);
        res.status(500).json({
            error: "Error interno del servidor al consultar datos horarios.",
        });
    }
};
exports.GetDetailedHourlyData = GetDetailedHourlyData;
const GetTypicalMeteorologicalYear = async (req, res) => {
    const lat = req.query.lat;
    const lon = req.query.lon;
    if (!lat || !lon) {
        return res
            .status(400)
            .json({ error: "Faltan parámetros obligatorios: lat, lon." });
    }
    try {
        const tmyData = await pvgisApiService.GetTypicalMeteorologicalYear(lat, lon);
        res.status(200).json(tmyData);
    }
    catch (error) {
        console.error("Error al obtener los datos TMY:", error);
        res
            .status(500)
            .json({ error: "Error interno del servidor al consultar datos TMY." });
    }
};
exports.GetTypicalMeteorologicalYear = GetTypicalMeteorologicalYear;
const GetMonthlyRadiation = async (req, res) => {
    const lat = req.query.lat;
    const lon = req.query.lon;
    const horirrad = req.query.horirrad;
    const optrad = req.query.optrad;
    if (!lat || !lon) {
        return res
            .status(400)
            .json({ error: "Faltan parámetros obligatorios: lat, lon." });
    }
    // Validación de parámetros específicos de MRcalc
    if (horirrad !== "1" && optrad !== "1") {
        return res
            .status(400)
            .json({ error: "Debe especificar 'horirrad=1' o 'optrad=1'." });
    }
    try {
        const radiationData = await pvgisApiService.GetMonthlyRadiation(lat, lon, horirrad || "0", // Aseguramos que sea '0' si es undefined
        optrad || "0");
        res.status(200).json(radiationData);
    }
    catch (error) {
        console.error("Error al obtener los datos de radiación mensual:", error);
        res.status(500).json({
            error: "Error interno del servidor al consultar radiación mensual.",
        });
    }
};
exports.GetMonthlyRadiation = GetMonthlyRadiation;
//# sourceMappingURL=PVGISController.js.map