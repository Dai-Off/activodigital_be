"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatastroApiService = void 0;
class CatastroApiService {
    constructor() {
        if (!process.env.CATASTRO_KEY || !process.env.CATASTRO_URL) {
            throw new Error("Faltan variables de entorno: CATASTRO_KEY y/o CATASTRO_URL.");
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
    getHeaders(useAlternativeAuth = false) {
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
    async makeRequest(url, useAlternativeAuth = false) {
        const headers = this.getHeaders(useAlternativeAuth);
        const response = await fetch(url, {
            method: "GET",
            headers,
        });
        // Si recibimos 403 y no hemos intentado el formato alternativo, intentar de nuevo
        if (response.status === 403 && !useAlternativeAuth) {
            console.warn(`[CatastroApiService] Error 403 con X-API-Key, intentando con Authorization Bearer...`);
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
            }
            catch (e) {
                // Si no se puede leer el cuerpo, continuar con el mensaje básico
            }
            const error = new Error(errorDetails);
            error.status = response.status;
            error.response = response;
            throw error;
        }
        return response;
    }
    /**
     * Realiza una solicitud HTTP sin headers especiales (para servicios públicos XML como Consulta_DNPLOC)
     */
    async makePublicRequest(url) {
        const response = await fetch(url, {
            method: "GET",
        });
        if (!response.ok) {
            const error = new Error(`Error HTTP: ${response.status}`);
            error.status = response.status;
            throw error;
        }
        return response;
    }
    async getAllProvincias() {
        try {
            const response = await this.makeRequest(`${this.urlCatastro}/api/callejero/provincias`);
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error("[CatastroApiService] Error en getAllProvincias:", error);
            throw error; // Propagar el error en lugar de retornar null
        }
    }
    async getMunicipios(provincia) {
        try {
            const url = `${this.urlCatastro}/api/callejero/municipios?provincia=${encodeURIComponent(provincia)}`;
            const response = await this.makeRequest(url);
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error("[CatastroApiService] Error en getMunicipios:", error);
            throw error;
        }
    }
    async getVias(provincia, municipio, tipoVia, nombreVia) {
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
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error("[CatastroApiService] Error en getVias:", error);
            throw error;
        }
    }
    async getInmuebleRc(rc) {
        try {
            const url = `${this.urlCatastro}/api/callejero/inmueble-rc?rc=${encodeURIComponent(rc)}`;
            const response = await this.makeRequest(url);
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error("[CatastroApiService] Error en getInmuebleRc:", error);
            throw error;
        }
    }
    async getInmuebleLoc(provincia, municipio, tipoVia, nombreVia, numero, bloque, escalera, planta, puerta) {
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
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error("[CatastroApiService] Error en getInmuebleLoc:", error);
            throw error;
        }
    }
    async getInmuebleXY(x, y) {
        try {
            const urlCoordenadas = `${this.urlCatastro}/api/coordenadas/rc-por-coordenadas?x=${encodeURIComponent(x)}&y=${encodeURIComponent(y)}`;
            const responseCoordenadas = await this.makeRequest(urlCoordenadas);
            const dataLoc = await responseCoordenadas.json();
            const listadoLoc = dataLoc.referencias;
            const promesasInmuebles = listadoLoc.map(async (resultadoLoc) => {
                const rc = resultadoLoc.referenciaCatastral;
                const urlInmueble = `${this.urlCatastro}/api/callejero/inmueble-rc?rc=${encodeURIComponent(rc)}`;
                const responseInmueble = await this.makeRequest(urlInmueble);
                const detailInmueble = await responseInmueble.json();
                return detailInmueble;
            });
            const listadoInmuebles = await Promise.all(promesasInmuebles);
            return listadoInmuebles;
        }
        catch (error) {
            console.error("[CatastroApiService] Error en getInmuebleXY:", error);
            throw error;
        }
    }
    /**
     * Obtiene las unidades (construcciones) de un inmueble usando el servicio público
     * de Catastro Consulta_DNPLOC (XML) a partir de una dirección.
     *
     * Ejemplo de URL base:
     * http://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/rest/Consulta_DNPLOC
     */
    async getUnidadesPorDireccion(params) {
        const { provincia, municipio, siglaVia, calle, numero, bloque = "", escalera = "", planta = "", puerta = "", } = params;
        if (!provincia || !municipio || !siglaVia || !calle || !numero) {
            throw new Error("Los parámetros provincia, municipio, siglaVia, calle y numero son obligatorios");
        }
        try {
            const baseUrl = "http://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/rest/Consulta_DNPLOC";
            const url = new URL(baseUrl);
            url.searchParams.append("Provincia", provincia);
            url.searchParams.append("Municipio", municipio);
            url.searchParams.append("Sigla", siglaVia);
            url.searchParams.append("Calle", calle);
            url.searchParams.append("Numero", numero);
            // Los siguientes parámetros son opcionales pero deben existir en la query
            url.searchParams.append("Bloque", bloque);
            url.searchParams.append("Escalera", escalera);
            url.searchParams.append("Planta", planta);
            url.searchParams.append("Puerta", puerta);
            const response = await this.makePublicRequest(url.toString());
            const xmlText = await response.text();
            // El servicio responde en XML. Lo devolvemos en bruto para que el caller decida
            // cómo parsearlo (frontend o servicio de dominio).
            return { xml: xmlText };
        }
        catch (error) {
            console.error("[CatastroApiService] Error en getUnidadesPorDireccion:", error);
            throw error;
        }
    }
}
exports.CatastroApiService = CatastroApiService;
//# sourceMappingURL=catastroApiService.js.map