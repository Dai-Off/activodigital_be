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
        this.options = {
            method: "GET",
            headers: {
                "X-API-Key": `${this.key}`,
                "Content-Type": "application/json",
            },
        };
    }
    async getAllProvincias() {
        try {
            const response = await fetch(`${this.urlCatastro}/api/callejero/provincias`, this.options);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error("Error en la solicitud:", error);
            return null;
        }
    }
    async getMunicipios(provincia) {
        try {
            const response = await fetch(`${this.urlCatastro}/api/callejero/municipios?provincia=${provincia}`, this.options);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error("Error en la solicitud:", error);
            return null;
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
            const response = await fetch(url.toString(), this.options);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error("Error en la solicitud:", error);
            return "Hubo un error al consultar las vias";
        }
    }
    async getInmuebleRc(rc) {
        try {
            const response = await fetch(`${this.urlCatastro}/api/callejero/inmueble-rc?rc=${rc}`, this.options);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error("Error en la solicitud:", error);
            return null;
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
            const response = await fetch(url.toString(), this.options);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error("Error en la solicitud:", error);
            return "Hubo un error al consultar el inmueble";
        }
    }
    async getInmuebleXY(x, y) {
        try {
            const localizacion = await fetch(`${this.urlCatastro}/api/coordenadas/rc-por-coordenadas?x=${x}&y=${y}`, this.options);
            const dataLoc = await localizacion.json();
            const listadoLoc = dataLoc.referencias;
            const promesasInmuebles = listadoLoc.map(async (resultadoLoc) => {
                const rc = resultadoLoc.referenciaCatastral;
                const responseInmueble = await fetch(`${this.urlCatastro}/api/callejero/inmueble-rc?rc=${rc}`, this.options);
                const detailInmueble = await responseInmueble.json();
                return detailInmueble;
            });
            const listadoInmuebles = await Promise.all(promesasInmuebles);
            return listadoInmuebles;
        }
        catch (error) {
            console.error("Error en la solicitud:", error);
            return "Hubo un error al consultar el inmueble";
        }
    }
}
exports.CatastroApiService = CatastroApiService;
//# sourceMappingURL=catastroApiService.js.map