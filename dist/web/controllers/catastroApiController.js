"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVias = exports.getMunicipios = exports.getAllProvincias = void 0;
const catastroApiService_1 = require("../../domain/services/catastroApiService");
const catastroApiService = new catastroApiService_1.CatastroApiService();
const getAllProvincias = async (req, res) => {
    try {
        const provincias = await catastroApiService.getAllProvincias();
        res.status(200).json(provincias);
    }
    catch (error) {
        console.error("Error al obtener las provincias", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.getAllProvincias = getAllProvincias;
const getMunicipios = async (req, res) => {
    const provincia = req.query.provincia;
    try {
        const municipios = await catastroApiService.getMunicipios(provincia);
        res.status(200).json(municipios);
    }
    catch (error) {
        console.error("Error al obtener los municipios", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.getMunicipios = getMunicipios;
const getVias = async (req, res) => {
    const provincia = req.query.provincia;
    const municipio = req.query.municipio;
    try {
        const municipios = await catastroApiService.getVias(provincia, municipio);
        res.status(200).json(municipios);
    }
    catch (error) {
        console.error("Error al obtener los municipios", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.getVias = getVias;
//# sourceMappingURL=catastroApiController.js.map