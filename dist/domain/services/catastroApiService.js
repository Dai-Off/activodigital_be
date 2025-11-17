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
    async getVias(provincia, municipio) {
        try {
            const response = await fetch(`${this.urlCatastro}/api/callejero/vias?provincia=${provincia}&municipio=${municipio}`, this.options);
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
}
exports.CatastroApiService = CatastroApiService;
//# sourceMappingURL=catastroApiService.js.map