import { Router } from "express";
import {
  GetPackageList,
  SearchPackages,
  GetPackageDetails,
  GetOrganizationList,
  GetTagList,
  GetGroupList,
  SearchDataStore,
  SearchDataStoreSql,
  GetSystemStatus,
  GetHelp,
  GetSiteInfo,
  SearchByOrganization,
  SearchByTag,
} from "../web/controllers/MitecoController";

const router = Router();

// ==========================================
// RUTAS DE DATASETS (PAQUETES)
// ==========================================

// 1. Listado de Datasets (package_list) [cite: 14]
// Obtiene el inventario de IDs de datasets disponibles.
// URL: /api/v1/miteco/package-list?limit=10&offset=0
router.get("/package-list", GetPackageList);

// 2. Búsqueda de Datasets (package_search) [cite: 21]
// Motor de búsqueda principal por texto libre o filtros avanzados.
// URL: /api/v1/miteco/package-search?q=energia&rows=5
router.get("/package-search", SearchPackages);

// 3. Detalle de Dataset (package_show) [cite: 30]
// Recupera la metadata completa y recursos de un dataset específico.
// URL: /api/v1/miteco/package-details?id=dataset-uuid-o-nombre
router.get("/package-details", GetPackageDetails);

// ==========================================
// RUTAS DE METADATOS (ORGANIZACIONES, ETIQUETAS, GRUPOS)
// ==========================================

// 4. Listado de Organizaciones (organization_list) [cite: 36]
// Lista las entidades publicadoras registradas.
// URL: /api/v1/miteco/organization-list?all_fields=true
router.get("/organization-list", GetOrganizationList);

// 5. Listado de Etiquetas (tag_list) [cite: 43]
// Lista las palabras clave usadas para clasificar los datos.
// URL: /api/v1/miteco/tag-list?vocabulary_id=...
router.get("/tag-list", GetTagList);

// 6. Listado de Grupos (group_list) [cite: 49]
// Lista las categorías de alto nivel del catálogo.
// URL: /api/v1/miteco/group-list?all_fields=true
router.get("/group-list", GetGroupList);

// ==========================================
// RUTAS DE DATASTORE (DATOS INTERNOS)
// ==========================================

// 7. Búsqueda en DataStore (datastore_search) [cite: 55]
// Busca filas de datos dentro de un recurso (archivo) específico.
// URL: /api/v1/miteco/datastore-search?resource_id=...&limit=5
router.get("/datastore-search", SearchDataStore);

// 8. Consulta SQL en DataStore (datastore_search_sql) [cite: 62]
// Ejecuta consultas SQL directas sobre los datos indexados.
// URL: /api/v1/miteco/datastore-search-sql?sql=SELECT * FROM "resource-id" LIMIT 5
router.get("/datastore-search-sql", SearchDataStoreSql);

// ==========================================
// RUTAS DE SISTEMA Y AYUDA
// ==========================================

// 9. Estado del Sistema (status_show) [cite: 68]
// Verifica la salud operativa de la instancia CKAN.
// URL: /api/v1/miteco/system-status
router.get("/system-status", GetSystemStatus);

// 10. Información del Sitio (site_read) [cite: 80]
// Obtiene configuración básica de la instancia.
// URL: /api/v1/miteco/site-info
router.get("/site-info", GetSiteInfo);

// 11. Ayuda de API (help_show) [cite: 74]
// Documentación técnica sobre acciones específicas.
// URL: /api/v1/miteco/help?name=package_search
router.get("/help", GetHelp);

// ==========================================
// RUTAS DE UTILIDAD (PERSONALIZADAS)
// ==========================================

// 12. Búsqueda por Organización
// Atajo para filtrar datasets de una organización específica.
// URL: /api/v1/miteco/search/by-organization?orgId=...&q=...
router.get("/search/by-organization", SearchByOrganization);

// 13. Búsqueda por Etiqueta
// Atajo para filtrar datasets por una etiqueta específica.
// URL: /api/v1/miteco/search/by-tag?tag=...&q=...
router.get("/search/by-tag", SearchByTag);

export default router;
