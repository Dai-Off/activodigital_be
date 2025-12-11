"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchByTag = exports.SearchByOrganization = exports.GetSiteInfo = exports.GetHelp = exports.GetSystemStatus = exports.SearchDataStoreSql = exports.SearchDataStore = exports.GetGroupList = exports.GetTagList = exports.GetOrganizationList = exports.GetPackageDetails = exports.SearchPackages = exports.GetPackageList = void 0;
// Ajusta la ruta de importación según la ubicación real de tu archivo de servicio
const MITECOApiService_1 = require("../../domain/services/MITECOApiService");
const mitecoApiService = new MITECOApiService_1.MitecoApiService();
/**
 * Obtiene el inventario de todos los identificadores de datasets.
 */
const GetPackageList = async (req, res) => {
    // Parseamos a número si existen, ya que req.query devuelve strings
    const limit = req.query.limit
        ? parseInt(req.query.limit)
        : undefined;
    const offset = req.query.offset
        ? parseInt(req.query.offset)
        : undefined;
    try {
        const data = await mitecoApiService.GetPackageList(limit, offset);
        res.status(200).json(data);
    }
    catch (error) {
        console.error("Error al obtener la lista de paquetes:", error);
        res.status(500).json({
            error: "Error interno del servidor al consultar la lista de datasets.",
        });
    }
};
exports.GetPackageList = GetPackageList;
/**
 * Búsqueda general de datasets por término libre, filas o filtros.
 */
const SearchPackages = async (req, res) => {
    const q = req.query.q;
    const rows = req.query.rows ? parseInt(req.query.rows) : undefined;
    const fq = req.query.fq;
    try {
        const searchResults = await mitecoApiService.SearchPackages(q, rows, fq);
        res.status(200).json(searchResults);
    }
    catch (error) {
        console.error("Error en la búsqueda de paquetes:", error);
        res.status(500).json({
            error: "Error interno del servidor al buscar datasets.",
        });
    }
};
exports.SearchPackages = SearchPackages;
/**
 * Obtiene los detalles completos de un dataset específico.
 */
const GetPackageDetails = async (req, res) => {
    const id = req.query.id;
    if (!id) {
        return res.status(400).json({
            error: "Falta parámetro obligatorio: id (UUID o nombre del dataset).",
        });
    }
    try {
        const details = await mitecoApiService.GetPackageDetails(id);
        res.status(200).json(details);
    }
    catch (error) {
        console.error("Error al obtener detalles del paquete:", error);
        res.status(500).json({
            error: "Error interno del servidor al consultar el detalle del dataset.",
        });
    }
};
exports.GetPackageDetails = GetPackageDetails;
/**
 * Lista las organizaciones registradas.
 */
const GetOrganizationList = async (req, res) => {
    // Convertimos el string "true" a boolean real
    const all_fields = req.query.all_fields === "true";
    try {
        const orgs = await mitecoApiService.GetOrganizationList(all_fields);
        res.status(200).json(orgs);
    }
    catch (error) {
        console.error("Error al listar organizaciones:", error);
        res.status(500).json({
            error: "Error interno del servidor al consultar organizaciones.",
        });
    }
};
exports.GetOrganizationList = GetOrganizationList;
/**
 * Lista las etiquetas disponibles.
 */
const GetTagList = async (req, res) => {
    const vocabulary_id = req.query.vocabulary_id;
    try {
        const tags = await mitecoApiService.GetTagList(vocabulary_id);
        res.status(200).json(tags);
    }
    catch (error) {
        console.error("Error al listar etiquetas:", error);
        res.status(500).json({
            error: "Error interno del servidor al consultar etiquetas.",
        });
    }
};
exports.GetTagList = GetTagList;
/**
 * Lista los grupos de alto nivel.
 */
const GetGroupList = async (req, res) => {
    const all_fields = req.query.all_fields === "true";
    try {
        const groups = await mitecoApiService.GetGroupList(all_fields);
        res.status(200).json(groups);
    }
    catch (error) {
        console.error("Error al listar grupos:", error);
        res.status(500).json({
            error: "Error interno del servidor al consultar grupos.",
        });
    }
};
exports.GetGroupList = GetGroupList;
/**
 * Busca dentro de los datos de un recurso específico (DataStore).
 */
const SearchDataStore = async (req, res) => {
    const resource_id = req.query.resource_id;
    const limit = req.query.limit
        ? parseInt(req.query.limit)
        : undefined;
    if (!resource_id) {
        return res.status(400).json({
            error: "Falta parámetro obligatorio: resource_id.",
        });
    }
    try {
        const data = await mitecoApiService.SearchDataStore(resource_id, limit);
        res.status(200).json(data);
    }
    catch (error) {
        console.error("Error al buscar en DataStore:", error);
        res.status(500).json({
            error: "Error interno del servidor al consultar el DataStore.",
        });
    }
};
exports.SearchDataStore = SearchDataStore;
/**
 * Ejecuta una consulta SQL en el DataStore.
 */
const SearchDataStoreSql = async (req, res) => {
    const sql = req.query.sql;
    if (!sql) {
        return res.status(400).json({
            error: "Falta parámetro obligatorio: sql.",
        });
    }
    try {
        const result = await mitecoApiService.SearchDataStoreSql(sql);
        res.status(200).json(result);
    }
    catch (error) {
        console.error("Error al ejecutar SQL en DataStore:", error);
        res.status(500).json({
            error: "Error interno del servidor al ejecutar SQL.",
        });
    }
};
exports.SearchDataStoreSql = SearchDataStoreSql;
/**
 * Obtiene el estado del sistema.
 */
const GetSystemStatus = async (req, res) => {
    try {
        const status = await mitecoApiService.GetSystemStatus();
        res.status(200).json(status);
    }
    catch (error) {
        console.error("Error al obtener estado del sistema:", error);
        res.status(500).json({
            error: "Error interno del servidor al consultar estado del sistema.",
        });
    }
};
exports.GetSystemStatus = GetSystemStatus;
/**
 * Obtiene ayuda sobre una acción de la API.
 */
const GetHelp = async (req, res) => {
    const name = req.query.name;
    if (!name) {
        return res.status(400).json({
            error: "Falta parámetro obligatorio: name (nombre de la acción).",
        });
    }
    try {
        const helpInfo = await mitecoApiService.GetHelp(name);
        res.status(200).json(helpInfo);
    }
    catch (error) {
        console.error("Error al obtener ayuda:", error);
        res.status(500).json({
            error: "Error interno del servidor al consultar la ayuda.",
        });
    }
};
exports.GetHelp = GetHelp;
/**
 * Obtiene información de la instancia del sitio.
 */
const GetSiteInfo = async (req, res) => {
    try {
        const siteInfo = await mitecoApiService.GetSiteInfo();
        res.status(200).json(siteInfo);
    }
    catch (error) {
        console.error("Error al obtener información del sitio:", error);
        res.status(500).json({
            error: "Error interno del servidor al consultar información del sitio.",
        });
    }
};
exports.GetSiteInfo = GetSiteInfo;
// ===========================================
// CONTROLADORES PARA MÉTODOS DE UTILIDAD
// ===========================================
const SearchByOrganization = async (req, res) => {
    const orgId = req.query.orgId;
    const q = req.query.q;
    const rows = req.query.rows ? parseInt(req.query.rows) : undefined;
    if (!orgId) {
        return res.status(400).json({
            error: "Falta parámetro obligatorio: orgId.",
        });
    }
    try {
        const results = await mitecoApiService.SearchPackagesByOrganization(orgId, q, rows);
        res.status(200).json(results);
    }
    catch (error) {
        console.error("Error en búsqueda por organización:", error);
        res.status(500).json({ error: "Error interno buscando por organización." });
    }
};
exports.SearchByOrganization = SearchByOrganization;
const SearchByTag = async (req, res) => {
    const tag = req.query.tag;
    const q = req.query.q;
    const rows = req.query.rows ? parseInt(req.query.rows) : undefined;
    if (!tag) {
        return res.status(400).json({
            error: "Falta parámetro obligatorio: tag.",
        });
    }
    try {
        const results = await mitecoApiService.SearchPackagesByTag(tag, q, rows);
        res.status(200).json(results);
    }
    catch (error) {
        console.error("Error en búsqueda por etiqueta:", error);
        res.status(500).json({ error: "Error interno buscando por etiqueta." });
    }
};
exports.SearchByTag = SearchByTag;
//# sourceMappingURL=MitecoController.js.map