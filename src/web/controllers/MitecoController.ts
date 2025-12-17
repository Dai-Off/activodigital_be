import { Request, Response } from "express";
// Ajusta la ruta de importación según la ubicación real de tu archivo de servicio
import { MitecoApiService } from "../../domain/services/MITECOApiService";

const mitecoApiService = new MitecoApiService();

/**
 * Obtiene el inventario de todos los identificadores de datasets.
 */
export const GetPackageList = async (req: Request, res: Response) => {
  // Parseamos a número si existen, ya que req.query devuelve strings
  const limit = req.query.limit
    ? parseInt(req.query.limit as string)
    : undefined;
  const offset = req.query.offset
    ? parseInt(req.query.offset as string)
    : undefined;

  try {
    const data = await mitecoApiService.GetPackageList(limit, offset);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error al obtener la lista de paquetes:", error);
    res.status(500).json({
      error: "Error interno del servidor al consultar la lista de datasets.",
    });
  }
};

/**
 * Búsqueda general de datasets por término libre, filas o filtros.
 */
export const SearchPackages = async (req: Request, res: Response) => {
  const q = req.query.q as string | undefined;
  const rows = req.query.rows ? parseInt(req.query.rows as string) : undefined;
  const fq = req.query.fq as string | undefined;

  try {
    const searchResults = await mitecoApiService.SearchPackages(q, rows, fq);
    res.status(200).json(searchResults);
  } catch (error) {
    console.error("Error en la búsqueda de paquetes:", error);
    res.status(500).json({
      error: "Error interno del servidor al buscar datasets.",
    });
  }
};

/**
 * Obtiene los detalles completos de un dataset específico.
 */
export const GetPackageDetails = async (req: Request, res: Response) => {
  const id = req.query.id as string;

  if (!id) {
    return res.status(400).json({
      error: "Falta parámetro obligatorio: id (UUID o nombre del dataset).",
    });
  }

  try {
    const details = await mitecoApiService.GetPackageDetails(id);
    res.status(200).json(details);
  } catch (error) {
    console.error("Error al obtener detalles del paquete:", error);
    res.status(500).json({
      error: "Error interno del servidor al consultar el detalle del dataset.",
    });
  }
};

/**
 * Lista las organizaciones registradas.
 */
export const GetOrganizationList = async (req: Request, res: Response) => {
  // Convertimos el string "true" a boolean real
  const all_fields = req.query.all_fields === "true";

  try {
    const orgs = await mitecoApiService.GetOrganizationList(all_fields);
    res.status(200).json(orgs);
  } catch (error) {
    console.error("Error al listar organizaciones:", error);
    res.status(500).json({
      error: "Error interno del servidor al consultar organizaciones.",
    });
  }
};

/**
 * Lista las etiquetas disponibles.
 */
export const GetTagList = async (req: Request, res: Response) => {
  const vocabulary_id = req.query.vocabulary_id as string | undefined;

  try {
    const tags = await mitecoApiService.GetTagList(vocabulary_id);
    res.status(200).json(tags);
  } catch (error) {
    console.error("Error al listar etiquetas:", error);
    res.status(500).json({
      error: "Error interno del servidor al consultar etiquetas.",
    });
  }
};

/**
 * Lista los grupos de alto nivel.
 */
export const GetGroupList = async (req: Request, res: Response) => {
  const all_fields = req.query.all_fields === "true";

  try {
    const groups = await mitecoApiService.GetGroupList(all_fields);
    res.status(200).json(groups);
  } catch (error) {
    console.error("Error al listar grupos:", error);
    res.status(500).json({
      error: "Error interno del servidor al consultar grupos.",
    });
  }
};

/**
 * Busca dentro de los datos de un recurso específico (DataStore).
 */
export const SearchDataStore = async (req: Request, res: Response) => {
  const resource_id = req.query.resource_id as string;
  const limit = req.query.limit
    ? parseInt(req.query.limit as string)
    : undefined;

  if (!resource_id) {
    return res.status(400).json({
      error: "Falta parámetro obligatorio: resource_id.",
    });
  }

  try {
    const data = await mitecoApiService.SearchDataStore(resource_id, limit);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error al buscar en DataStore:", error);
    res.status(500).json({
      error: "Error interno del servidor al consultar el DataStore.",
    });
  }
};

/**
 * Ejecuta una consulta SQL en el DataStore.
 */
export const SearchDataStoreSql = async (req: Request, res: Response) => {
  const sql = req.query.sql as string;

  if (!sql) {
    return res.status(400).json({
      error: "Falta parámetro obligatorio: sql.",
    });
  }

  try {
    const result = await mitecoApiService.SearchDataStoreSql(sql);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error al ejecutar SQL en DataStore:", error);
    res.status(500).json({
      error: "Error interno del servidor al ejecutar SQL.",
    });
  }
};

/**
 * Obtiene el estado del sistema.
 */
export const GetSystemStatus = async (req: Request, res: Response) => {
  try {
    const status = await mitecoApiService.GetSystemStatus();
    res.status(200).json(status);
  } catch (error) {
    console.error("Error al obtener estado del sistema:", error);
    res.status(500).json({
      error: "Error interno del servidor al consultar estado del sistema.",
    });
  }
};

/**
 * Obtiene ayuda sobre una acción de la API.
 */
export const GetHelp = async (req: Request, res: Response) => {
  const name = req.query.name as string;

  if (!name) {
    return res.status(400).json({
      error: "Falta parámetro obligatorio: name (nombre de la acción).",
    });
  }

  try {
    const helpInfo = await mitecoApiService.GetHelp(name);
    res.status(200).json(helpInfo);
  } catch (error) {
    console.error("Error al obtener ayuda:", error);
    res.status(500).json({
      error: "Error interno del servidor al consultar la ayuda.",
    });
  }
};

/**
 * Obtiene información de la instancia del sitio.
 */
export const GetSiteInfo = async (req: Request, res: Response) => {
  try {
    const siteInfo = await mitecoApiService.GetSiteInfo();
    res.status(200).json(siteInfo);
  } catch (error) {
    console.error("Error al obtener información del sitio:", error);
    res.status(500).json({
      error: "Error interno del servidor al consultar información del sitio.",
    });
  }
};

// ===========================================
// CONTROLADORES PARA MÉTODOS DE UTILIDAD
// ===========================================

export const SearchByOrganization = async (req: Request, res: Response) => {
  const orgId = req.query.orgId as string;
  const q = req.query.q as string | undefined;
  const rows = req.query.rows ? parseInt(req.query.rows as string) : undefined;

  if (!orgId) {
    return res.status(400).json({
      error: "Falta parámetro obligatorio: orgId.",
    });
  }

  try {
    const results = await mitecoApiService.SearchPackagesByOrganization(
      orgId,
      q,
      rows
    );
    res.status(200).json(results);
  } catch (error) {
    console.error("Error en búsqueda por organización:", error);
    res.status(500).json({ error: "Error interno buscando por organización." });
  }
};

export const SearchByTag = async (req: Request, res: Response) => {
  const tag = req.query.tag as string;
  const q = req.query.q as string | undefined;
  const rows = req.query.rows ? parseInt(req.query.rows as string) : undefined;

  if (!tag) {
    return res.status(400).json({
      error: "Falta parámetro obligatorio: tag.",
    });
  }

  try {
    const results = await mitecoApiService.SearchPackagesByTag(tag, q, rows);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error en búsqueda por etiqueta:", error);
    res.status(500).json({ error: "Error interno buscando por etiqueta." });
  }
};
