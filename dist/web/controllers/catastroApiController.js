"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInmuebleXY = exports.getInmuebleLoc = exports.getInmuebleRc = exports.getVias = exports.getMunicipios = exports.getAllProvincias = void 0;
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
    let tipoVia = "";
    let nombreVia = "";
    if (req.query.tipoVia) {
        tipoVia = req.query.tipoVia;
    }
    if (req.query.nombreVia) {
        nombreVia = req.query.nombreVia;
    }
    try {
        const municipios = await catastroApiService.getVias(provincia, municipio, tipoVia, nombreVia);
        res.status(200).json(municipios);
    }
    catch (error) {
        console.error("Error al obtener los municipios", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.getVias = getVias;
const getInmuebleRc = async (req, res) => {
    const rc = req.query.rc;
    try {
        const inmueble = await catastroApiService.getInmuebleRc(rc);
        res.status(200).json(inmueble);
    }
    catch (error) {
        console.error("Error al obtener el inmueble", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.getInmuebleRc = getInmuebleRc;
const getInmuebleLoc = async (req, res) => {
    const provincia = req.query.provincia;
    const municipio = req.query.municipio;
    const tipoVia = req.query.tipoVia;
    const nombreVia = req.query.nombreVia;
    const numero = req.query.numero;
    let bloque = "";
    let escalera = "";
    let planta = "";
    let puerta = "";
    if (req.query.bloque) {
        bloque = req.query.bloque;
    }
    if (req.query.escalera) {
        escalera = req.query.escalera;
    }
    if (req.query.planta) {
        planta = req.query.planta;
    }
    if (req.query.puerta) {
        puerta = req.query.puerta;
    }
    try {
        const inmueble = await catastroApiService.getInmuebleLoc(provincia, municipio, tipoVia, nombreVia, numero, bloque, escalera, planta, puerta);
        res.status(200).json(inmueble);
    }
    catch (error) {
        console.error("Error al obtener el inmueble", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.getInmuebleLoc = getInmuebleLoc;
const getInmuebleXY = async (req, res) => {
    const x = req.query.x;
    const y = req.query.y;
    try {
        const inmueble = await catastroApiService.getInmuebleXY(x, y);
        res.status(200).json(inmueble);
    }
    catch (error) {
        console.error("Error al obtener el inmueble", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.getInmuebleXY = getInmuebleXY;
//# sourceMappingURL=catastroApiController.js.map