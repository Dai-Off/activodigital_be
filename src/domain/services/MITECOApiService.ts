export class MitecoApiService {
  private urlMiteco: string;
  private options: RequestInit;

  constructor() {
    if (!process.env.MITECO_URL) {
      throw new Error("Faltan variables de entorno: MITECO_URL.");
    }

    this.urlMiteco = process.env.MITECO_URL;
    this.options = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };
  }

  // ===========================================
  // 🧭 MÉTODOS DE CONSULTA (LECTURA)
  // ===========================================

  /**
   * 1. Listado de Datasets (package_list)
   * Obtiene el inventario de todos los identificadores de los conjuntos de datos (datasets) disponibles.
   * Endpoint: /package_list
   * @param limit (Opcional) Limita el número de identificadores retornados.
   * @param offset (Opcional) Se utiliza para la paginación, saltando los primeros N elementos.
   */
  async GetPackageList(limit?: number, offset?: number) {
    try {
      const baseUrl = `${this.urlMiteco}/package_list`;
      const url = new URL(baseUrl);

      if (limit) url.searchParams.append("limit", limit.toString());
      if (offset) url.searchParams.append("offset", offset.toString());

      console.log(url.toString());
      const response = await fetch(url.toString(), this.options);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: any = await response.json();
      return data;
    } catch (error) {
      console.error("Error en la solicitud (Package List):", error);
      return null;
    }
  }

  /**
   * 2. Búsqueda de Datasets (package_search)
   * Motor de búsqueda principal para encontrar conjuntos de datos específicos.
   * Endpoint: /package_search
   * @param q (Opcional) Consulta (Query). Término de búsqueda libre en título, descripción y etiquetas.
   * @param rows (Opcional) Número máximo de resultados a devolver.
   * @param fq (Opcional) Filtro de Consulta para metadatos precisos (ej. por organización o etiquetas exactas).
   */
  async SearchPackages(q?: string, rows?: number, fq?: string) {
    try {
      const baseUrl = `${this.urlMiteco}/package_search`;
      const url = new URL(baseUrl);

      if (q) url.searchParams.append("q", q);
      if (rows) url.searchParams.append("rows", rows.toString());
      if (fq) url.searchParams.append("fq", fq);

      const response = await fetch(url.toString(), this.options);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: any = await response.json();
      return data;
    } catch (error) {
      console.error("Error en la solicitud (Package Search):", error);
      return null;
    }
  }

  /**
   * 3. Detalle de Dataset (package_show)
   * Recupera la metadata completa de un conjunto de datos en particular.
   * Endpoint: /package_show
   * @param id Identificador (UUID) o nombre del conjunto de datos. (Obligatorio)
   */
  async GetPackageDetails(id: string) {
    try {
      const baseUrl = `${this.urlMiteco}/package_show`;
      const url = new URL(baseUrl);

      url.searchParams.append("id", id);

      const response = await fetch(url.toString(), this.options);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: any = await response.json();
      return data;
    } catch (error) {
      console.error("Error en la solicitud (Package Show):", error);
      return null;
    }
  }

  /**
   * 4. Listado de Organizaciones (organization_list)
   * Lista los identificadores de todas las organizaciones registradas.
   * Endpoint: /organization_list
   * @param all_fields (Opcional) Si es true, devuelve objetos completos en lugar de solo IDs.
   */
  async GetOrganizationList(all_fields?: boolean) {
    try {
      const baseUrl = `${this.urlMiteco}/organization_list`;
      const url = new URL(baseUrl);

      if (all_fields !== undefined) {
        url.searchParams.append("all_fields", all_fields.toString());
      }

      const response = await fetch(url.toString(), this.options);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: any = await response.json();
      return data;
    } catch (error) {
      console.error("Error en la solicitud (Organization List):", error);
      return null;
    }
  }

  /**
   * 5. Listado de Etiquetas (tag_list)
   * Proporciona una lista de todas las etiquetas utilizadas para clasificar los conjuntos de datos.
   * Endpoint: /tag_list
   * @param vocabulary_id (Opcional) Filtra las etiquetas pertenecientes a un vocabulario específico.
   */
  async GetTagList(vocabulary_id?: string) {
    try {
      const baseUrl = `${this.urlMiteco}/tag_list`;
      const url = new URL(baseUrl);

      if (vocabulary_id)
        url.searchParams.append("vocabulary_id", vocabulary_id);

      const response = await fetch(url.toString(), this.options);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: any = await response.json();
      return data;
    } catch (error) {
      console.error("Error en la solicitud (Tag List):", error);
      return null;
    }
  }

  /**
   * 6. Listado de Grupos (group_list)
   * Lista todos los grupos o categorías de alto nivel definidos en el catálogo.
   * Endpoint: /group_list
   * @param all_fields (Opcional) Si es true, devuelve los objetos completos de grupo.
   */
  async GetGroupList(all_fields?: boolean) {
    try {
      const baseUrl = `${this.urlMiteco}/group_list`;
      const url = new URL(baseUrl);

      if (all_fields !== undefined) {
        url.searchParams.append("all_fields", all_fields.toString());
      }

      const response = await fetch(url.toString(), this.options);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: any = await response.json();
      return data;
    } catch (error) {
      console.error("Error en la solicitud (Group List):", error);
      return null;
    }
  }

  /**
   * 7. Búsqueda en DataStore (datastore_search)
   * Permite buscar filas de datos dentro de un recurso específico.
   * Endpoint: /datastore_search
   * @param resource_id El ID del recurso (archivo) que se desea consultar. (Obligatorio)
   * @param limit (Opcional) Limita el número de filas de datos retornadas.
   */
  async SearchDataStore(resource_id: string, limit?: number) {
    try {
      const baseUrl = `${this.urlMiteco}/datastore_search`;
      const url = new URL(baseUrl);

      url.searchParams.append("resource_id", resource_id);
      if (limit) url.searchParams.append("limit", limit.toString());

      const response = await fetch(url.toString(), this.options);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: any = await response.json();
      return data;
    } catch (error) {
      console.error("Error en la solicitud (DataStore Search):", error);
      return null;
    }
  }

  /**
   * 8. Consulta SQL en DataStore (datastore_search_sql)
   * Permite realizar consultas SQL directamente sobre los datos indexados en el DataStore.
   * Endpoint: /datastore_search_sql
   * @param sql La consulta SQL a ejecutar (Ej. SELECT * FROM tabla WHERE campo = 'valor'). (Obligatorio)
   */
  async SearchDataStoreSql(sql: string) {
    try {
      const baseUrl = `${this.urlMiteco}/datastore_search_sql`;
      const url = new URL(baseUrl);

      url.searchParams.append("sql", sql);

      const response = await fetch(url.toString(), this.options);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: any = await response.json();
      return data;
    } catch (error) {
      console.error("Error en la solicitud (DataStore SQL):", error);
      return null;
    }
  }

  // ===========================================
  // ⚙️ MÉTODOS DE UTILIDAD / SISTEMA
  // ===========================================

  /**
   * 9. Estado del Sistema (status_show)
   * Proporciona información sobre la salud y el estado operativo del sistema.
   * Endpoint: /status_show
   */
  async GetSystemStatus() {
    try {
      const baseUrl = `${this.urlMiteco}/status_show`;
      const response = await fetch(baseUrl, this.options);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: any = await response.json();
      return data;
    } catch (error) {
      console.error("Error en la solicitud (Status Show):", error);
      return null;
    }
  }

  /**
   * 10. Documentación de Ayuda (help_show)
   * Obtiene documentación sobre cualquier otra acción de la API.
   * Endpoint: /help_show
   * @param name Nombre de la acción a consultar (Ej. package_search). (Obligatorio)
   */
  async GetHelp(name: string) {
    try {
      const baseUrl = `${this.urlMiteco}/help_show`;
      const url = new URL(baseUrl);

      url.searchParams.append("name", name);

      const response = await fetch(url.toString(), this.options);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: any = await response.json();
      return data;
    } catch (error) {
      console.error("Error en la solicitud (Help Show):", error);
      return null;
    }
  }

  /**
   * 11. Información del Sitio (site_read)
   * Proporciona información básica sobre la instancia de CKAN.
   * Endpoint: /site_read
   */
  async GetSiteInfo() {
    try {
      const baseUrl = `${this.urlMiteco}/site_read`;
      const response = await fetch(baseUrl, this.options);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: any = await response.json();
      return data;
    } catch (error) {
      console.error("Error en la solicitud (Site Read):", error);
      return null;
    }
  }

  // ===========================================
  // 🎯 MÉTODOS DE UTILIDAD ADICIONALES
  // ===========================================

  /**
   * UTILIDAD: Búsqueda de Datasets por Organización
   * Busca conjuntos de datos publicados por una organización específica (usando fq).
   * Endpoint: /package_search
   * @param orgId El ID de la organización por la que se desea filtrar. (Obligatorio)
   * @param q (Opcional) Término de búsqueda libre adicional.
   * @param rows (Opcional) Número máximo de resultados a devolver.
   */
  async SearchPackagesByOrganization(orgId: string, q?: string, rows?: number) {
    // Lógica delegada a SearchPackages con el filtro fq
    const fqFilter = `organization:"${orgId}"`;
    return this.SearchPackages(q, rows, fqFilter);
  }

  /**
   * UTILIDAD: Búsqueda de Datasets por Etiqueta
   * Busca conjuntos de datos que contengan una etiqueta específica (usando fq).
   * Endpoint: /package_search
   * @param tag La etiqueta (palabra clave) por la que se desea filtrar. (Obligatorio)
   * @param q (Opcional) Término de búsqueda libre adicional.
   * @param rows (Opcional) Número máximo de resultados a devolver.
   */
  async SearchPackagesByTag(tag: string, q?: string, rows?: number) {
    // Lógica delegada a SearchPackages con el filtro fq
    const fqFilter = `tags:"${tag}"`;
    return this.SearchPackages(q, rows, fqFilter);
  }

  /**
   * UTILIDAD: Obtener solo IDs de Organizaciones
   * Simplifica la obtención de una lista simple de IDs de las organizaciones.
   * Endpoint: /organization_list
   */
  async GetSimpleOrganizationIds() {
    // Lógica delegada a GetOrganizationList con all_fields=false
    return this.GetOrganizationList(false);
  }

  /**
   * UTILIDAD: Obtener solo Nombres de Etiquetas
   * Simplifica la obtención de una lista simple de los nombres de las etiquetas.
   * Endpoint: /tag_list
   */
  async GetSimpleTagNames() {
    // Lógica delegada a GetTagList sin parámetros
    return this.GetTagList();
  }

  /**
   * UTILIDAD: Obtener solo IDs de Grupos
   * Simplifica la obtención de una lista simple de IDs de los grupos.
   * Endpoint: /group_list
   */
  async GetSimpleGroupIds() {
    // Lógica delegada a GetGroupList con all_fields=false
    return this.GetGroupList(false);
  }
}
