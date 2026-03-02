"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCatastroHealth = exports.getUnidadesPorRc = exports.getUnidadesPorDireccion = exports.getInmuebleXY = exports.getInmuebleLoc = exports.getInmuebleRc = exports.getVias = exports.getMunicipios = exports.getAllProvincias = void 0;
const catastroApiService_1 = require("../../domain/services/catastroApiService");
const catastroApiService = new catastroApiService_1.CatastroApiService();
const handleExternalApiError = (res, error) => {
    console.error("[CatastroApiController] Error Catastro:", error);
    const status = error?.status || 500;
    const message = error?.message || "Error interno del servidor";
    const finalStatus = status === 401 ? 500 : status;
    res.status(finalStatus).json({
        error: message,
        details: finalStatus === 403
            ? "Error de autenticación con la API de Catastro. Verifica las credenciales."
            : undefined,
        source: "catastro_external_api",
    });
};
const getAllProvincias = async (req, res) => {
    try {
        const provincias = await catastroApiService.getAllProvincias();
        if (!provincias) {
            return res.status(404).json({ error: "No se pudieron obtener las provincias" });
        }
        res.status(200).json(provincias);
    }
    catch (error) {
        console.error("[CatastroApiController] Error al obtener las provincias:", error);
        handleExternalApiError(res, error);
    }
};
exports.getAllProvincias = getAllProvincias;
const getMunicipios = async (req, res) => {
    const provincia = req.query.provincia;
    if (!provincia) {
        return res.status(400).json({ error: "El parámetro 'provincia' es requerido" });
    }
    try {
        const municipios = await catastroApiService.getMunicipios(provincia);
        if (!municipios) {
            return res.status(404).json({ error: "No se pudieron obtener los municipios" });
        }
        res.status(200).json(municipios);
    }
    catch (error) {
        console.error("[CatastroApiController] Error al obtener los municipios:", error);
        handleExternalApiError(res, error);
    }
};
exports.getMunicipios = getMunicipios;
const getVias = async (req, res) => {
    const provincia = req.query.provincia;
    const municipio = req.query.municipio;
    const tipoVia = req.query.tipoVia;
    const nombreVia = req.query.nombreVia;
    if (!provincia || !municipio || !tipoVia || !nombreVia) {
        return res.status(400).json({ error: "Los parámetros provincia, municipio, tipoVia y nombreVia son requeridos" });
    }
    try {
        const vias = await catastroApiService.getVias(provincia, municipio, tipoVia, nombreVia);
        if (!vias) {
            return res.status(404).json({ error: "No se pudieron obtener las vías" });
        }
        res.status(200).json(vias);
    }
    catch (error) {
        console.error("[CatastroApiController] Error al obtener las vías:", error);
        handleExternalApiError(res, error);
    }
};
exports.getVias = getVias;
const getInmuebleRc = async (req, res) => {
    const rc = req.query.rc;
    if (!rc) {
        return res.status(400).json({ error: "El parámetro 'rc' (referencia catastral) es requerido" });
    }
    try {
        const inmueble = await catastroApiService.getInmuebleRc(rc);
        if (!inmueble) {
            return res.status(404).json({ error: "No se encontró el inmueble con la referencia catastral proporcionada" });
        }
        res.status(200).json(inmueble);
    }
    catch (error) {
        console.error("[CatastroApiController] Error al obtener el inmueble por RC:", error);
        handleExternalApiError(res, error);
    }
};
exports.getInmuebleRc = getInmuebleRc;
const getInmuebleLoc = async (req, res) => {
    const provincia = req.query.provincia;
    const municipio = req.query.municipio;
    const tipoVia = req.query.tipoVia;
    const nombreVia = req.query.nombreVia;
    const numero = req.query.numero;
    const bloque = req.query.bloque;
    const escalera = req.query.escalera;
    const planta = req.query.planta;
    const puerta = req.query.puerta;
    if (!provincia || !municipio || !tipoVia || !nombreVia || !numero) {
        return res.status(400).json({
            error: "Los parámetros 'provincia', 'municipio', 'tipoVia', 'nombreVia' y 'numero' son requeridos"
        });
    }
    try {
        const inmueble = await catastroApiService.getInmuebleLoc(provincia, municipio, tipoVia, nombreVia, numero, bloque, escalera, planta, puerta);
        if (!inmueble) {
            return res.status(404).json({ error: "No se encontró el inmueble con la localización proporcionada" });
        }
        res.status(200).json(inmueble);
    }
    catch (error) {
        console.error("[CatastroApiController] Error al obtener el inmueble por localización:", error);
        handleExternalApiError(res, error);
    }
};
exports.getInmuebleLoc = getInmuebleLoc;
const getInmuebleXY = async (req, res) => {
    const x = req.query.x;
    const y = req.query.y;
    if (!x || !y) {
        return res.status(400).json({ error: "Los parámetros 'x' e 'y' (coordenadas) son requeridos" });
    }
    try {
        const inmueble = await catastroApiService.getInmuebleXY(x, y);
        if (!inmueble || (Array.isArray(inmueble) && inmueble.length === 0)) {
            return res.status(404).json({ error: "No se encontraron inmuebles en las coordenadas proporcionadas" });
        }
        res.status(200).json(inmueble);
    }
    catch (error) {
        console.error("[CatastroApiController] Error al obtener el inmueble por coordenadas:", error);
        handleExternalApiError(res, error);
    }
};
exports.getInmuebleXY = getInmuebleXY;
/**
 * Nuevo endpoint: obtener unidades desde Catastro usando Consulta_DNPLOC (por dirección).
 * Devuelve el XML bruto para máxima fidelidad; el cliente puede parsearlo según necesidad.
 */
const getUnidadesPorDireccion = async (req, res) => {
    const provincia = req.query.provincia;
    const municipio = req.query.municipio;
    const siglaVia = req.query.siglaVia; // ej: CL
    const calle = req.query.calle;
    const numero = req.query.numero;
    const bloque = req.query.bloque || "";
    const escalera = req.query.escalera || "";
    const planta = req.query.planta || "";
    const puerta = req.query.puerta || "";
    if (!provincia || !municipio || !siglaVia || !calle || !numero) {
        return res.status(400).json({
            error: "Los parámetros 'provincia', 'municipio', 'siglaVia', 'calle' y 'numero' son requeridos",
        });
    }
    try {
        const result = await catastroApiService.getUnidadesPorDireccion({
            provincia,
            municipio,
            siglaVia,
            calle,
            numero,
            bloque,
            escalera,
            planta,
            puerta,
        });
        res.status(200).json(result);
    }
    catch (error) {
        handleExternalApiError(res, error);
    }
};
exports.getUnidadesPorDireccion = getUnidadesPorDireccion;
const getUnidadesPorRc = async (req, res) => {
    const rc = req.query.rc;
    if (!rc) {
        return res.status(400).json({
            error: "El parámetro 'rc' es requerido",
        });
    }
    try {
        const result = await catastroApiService.getUnidadesPorRc(rc);
        res.status(200).json(result);
    }
    catch (error) {
        handleExternalApiError(res, error);
    }
};
exports.getUnidadesPorRc = getUnidadesPorRc;
/**
 * Endpoint de verificación de salud de la API de Catastro.
 * No requiere autenticación — pensado para consultas del frontend al montar el componente.
 *
 * Siempre devuelve HTTP 200 con un JSON que contiene:
 *  { online: boolean, latencyMs: number, status: string }
 * De esta forma el frontend nunca recibe un error HTTP y puede leer el diagnóstico.
 */
const checkCatastroHealth = async (_req, res) => {
    try {
        const resultado = await catastroApiService.checkHealth();
        // Registrar latencia para métricas (compatible con Winston u otro logger)
        console.info(`[CatastroHealth] online=${resultado.online} status=${resultado.status} latencyMs=${resultado.latencyMs}`);
        res.status(200).json(resultado);
    }
    catch (error) {
        console.error("[CatastroApiController] Error en verificación de salud:", error);
        res.status(200).json({ online: false, latencyMs: 0, status: "error_red" });
    }
};
exports.checkCatastroHealth = checkCatastroHealth;
//# sourceMappingURL=catastroApiController.js.map