export class CatastroApiService {
  private key: string;
  private urlCatastro: string;
  private baseHeaders: Record<string, string>;

  constructor() {
    if (!process.env.CATASTRO_KEY || !process.env.CATASTRO_URL) {
      throw new Error(
        "Faltan variables de entorno: CATASTRO_KEY y/o CATASTRO_URL."
      );
    }

    this.key = process.env.CATASTRO_KEY;
    this.urlCatastro = process.env.CATASTRO_URL;
    
    // Headers base que se usarán en todas las solicitudes
    this.baseHeaders = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "ActivoDigital/1.0",
      // Intentar con X-API-Key primero
      "X-API-Key": this.key,
    };
  }

  /**
   * Obtiene los headers para la solicitud, intentando diferentes formatos de autenticación
   */
  private getHeaders(useAlternativeAuth: boolean = false): Record<string, string> {
    const headers = { ...this.baseHeaders };
    
    if (useAlternativeAuth) {
      // Si el formato X-API-Key falla, intentar con Authorization Bearer
      delete headers["X-API-Key"];
      headers["Authorization"] = `Bearer ${this.key}`;
    }
    
    return headers;
  }

  /**
   * Realiza una solicitud HTTP con manejo mejorado de errores
   */
  private async makeRequest(
    url: string,
    useAlternativeAuth: boolean = false
  ): Promise<Response> {
    const headers = this.getHeaders(useAlternativeAuth);
    
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    // Si recibimos 403 y no hemos intentado el formato alternativo, intentar de nuevo
    if (response.status === 403 && !useAlternativeAuth) {
      console.warn(
        `[CatastroApiService] Error 403 con X-API-Key, intentando con Authorization Bearer...`
      );
      return this.makeRequest(url, true);
    }

    if (!response.ok) {
      // Intentar obtener más información del error
      let errorDetails = `Error HTTP: ${response.status}`;
      try {
        const errorBody = await response.text();
        if (errorBody) {
          errorDetails += ` - ${errorBody.substring(0, 200)}`;
        }
      } catch (e) {
        // Si no se puede leer el cuerpo, continuar con el mensaje básico
      }
      
      const error = new Error(errorDetails);
      (error as any).status = response.status;
      (error as any).response = response;
      throw error;
    }

    return response;
  }

  async getAllProvincias(): Promise<any | null> {
    try {
      const response = await this.makeRequest(
        `${this.urlCatastro}/api/callejero/provincias`
      );
      const data: any = await response.json();
      return data;
    } catch (error) {
      console.error("[CatastroApiService] Error en getAllProvincias:", error);
      throw error; // Propagar el error en lugar de retornar null
    }
  }

  async getMunicipios(provincia: string): Promise<any | null> {
    try {
      const url = `${this.urlCatastro}/api/callejero/municipios?provincia=${encodeURIComponent(provincia)}`;
      const response = await this.makeRequest(url);
      const data: any = await response.json();
      return data;
    } catch (error) {
      console.error("[CatastroApiService] Error en getMunicipios:", error);
      throw error;
    }
  }

  async getVias(
    provincia: string,
    municipio: string,
    tipoVia?: string,
    nombreVia?: string
  ): Promise<any | null> {
    try {
      const baseUrl = `${this.urlCatastro}/api/callejero/vias`;
      const url = new URL(baseUrl);
      url.searchParams.append("provincia", provincia);
      url.searchParams.append("municipio", municipio);

      if (tipoVia) {
        url.searchParams.append("tipoVia", tipoVia);
      }

      if (nombreVia) {
        url.searchParams.append("nombreVia", nombreVia);
      }

      const response = await this.makeRequest(url.toString());
      const data: any = await response.json();
      return data;
    } catch (error) {
      console.error("[CatastroApiService] Error en getVias:", error);
      throw error;
    }
  }

  async getInmuebleRc(rc: string): Promise<any | null> {
    try {
      const url = `${this.urlCatastro}/api/callejero/inmueble-rc?rc=${encodeURIComponent(rc)}`;
      const response = await this.makeRequest(url);
      const data: any = await response.json();
      return data;
    } catch (error) {
      console.error("[CatastroApiService] Error en getInmuebleRc:", error);
      throw error;
    }
  }

  async getInmuebleLoc(
    provincia: string,
    municipio: string,
    tipoVia: string,
    nombreVia: string,
    numero: string,
    bloque?: string,
    escalera?: string,
    planta?: string,
    puerta?: string
  ): Promise<any | null> {
    try {
      const baseUrl = `${this.urlCatastro}/api/callejero/inmueble-localizacion`;
      const url = new URL(baseUrl);
      url.searchParams.append("provincia", provincia);
      url.searchParams.append("municipio", municipio);
      url.searchParams.append("tipoVia", tipoVia);
      url.searchParams.append("nombreVia", nombreVia);
      url.searchParams.append("numero", numero);
      if (bloque) {
        url.searchParams.append("bloque", bloque);
      }
      if (escalera) {
        url.searchParams.append("escalera", escalera);
      }
      if (planta) {
        url.searchParams.append("planta", planta);
      }
      if (puerta) {
        url.searchParams.append("puerta", puerta);
      }

      const response = await this.makeRequest(url.toString());
      const data: any = await response.json();
      return data;
    } catch (error) {
      console.error("[CatastroApiService] Error en getInmuebleLoc:", error);
      throw error;
    }
  }

  async getInmuebleXY(x: string, y: string): Promise<any | null> {
    interface resultadoLoc {
      pc1: string;
      pc2: string;
      referenciaCatastral: string;
      direccion: string;
    }
    try {
      const urlCoordenadas = `${this.urlCatastro}/api/coordenadas/rc-por-coordenadas?x=${encodeURIComponent(x)}&y=${encodeURIComponent(y)}`;
      const responseCoordenadas = await this.makeRequest(urlCoordenadas);
      const dataLoc = await responseCoordenadas.json();
      const listadoLoc: resultadoLoc[] = dataLoc.referencias;
      
      const promesasInmuebles = listadoLoc.map(async (resultadoLoc) => {
        const rc = resultadoLoc.referenciaCatastral;
        const urlInmueble = `${this.urlCatastro}/api/callejero/inmueble-rc?rc=${encodeURIComponent(rc)}`;
        const responseInmueble = await this.makeRequest(urlInmueble);
        const detailInmueble: any = await responseInmueble.json();
        return detailInmueble;
      });

      const listadoInmuebles: any[] = await Promise.all(promesasInmuebles);
      return listadoInmuebles;
    } catch (error) {
      console.error("[CatastroApiService] Error en getInmuebleXY:", error);
      throw error;
    }
  }
}
