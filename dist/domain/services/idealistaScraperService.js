"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApifyService = void 0;
const apify_client_1 = require("apify-client");
/**
 * Servicio centralizado para operaciones con Apify (Scraping).
 */
class ApifyService {
    constructor() {
        // Se recomienda poner el token en variables de entorno: process.env.APIFY_TOKEN
        this.apifyToken = process.env.APIFY_TOKEN;
        this.actorId = "REcGj6dyoIJ9Z7aE6"; // ID del Actor de Idealista
    }
    getApifyClient() {
        return new apify_client_1.ApifyClient({
            token: this.apifyToken,
        });
    }
    // ==========================================
    // 1. SCRAPING (EXECUTION)
    // ==========================================
    /**
     * Ejecuta el scraper de Idealista y devuelve los resultados procesados.
     */
    async scrapeIdealistaProperties(data) {
        const client = this.getApifyClient();
        // 1. Preparamos el Input para el Actor
        // Nota: Los campos del input dependen de la documentación del Actor específico
        const actorInput = {
            startUrls: [{ url: data.searchUrl }],
            maxItems: data.maxItems || 20,
            // Otros filtros o configuraciones del scraper pueden ir aquí
        };
        try {
            // 2. Iniciamos el Actor y esperamos a que termine (Call)
            // Si el proceso es muy largo, podrías usar .start() y luego webhooks,
            // pero .call() es síncrono para el código (espera la respuesta).
            const run = await client.actor(this.actorId).call(actorInput);
            if (!run) {
                throw new Error("La ejecución del Actor falló o no devolvió resultados.");
            }
            // 3. Obtenemos los resultados del Dataset generado
            const { items } = await client.dataset(run.defaultDatasetId).listItems();
            // 4. Mapeamos los resultados crudos a nuestra interfaz interna
            const mappedItems = items.map((item) => this.mapToIdealistaProperty(item));
            return {
                totalItems: mappedItems.length,
                items: mappedItems,
            };
        }
        catch (error) {
            throw new Error(`Error en el servicio de Apify: ${error.message}`);
        }
    }
    // ==========================================
    // 2. UTILIDADES Y MAPEO
    // ==========================================
    /**
     * Transforma los datos crudos del scraper al tipo de la aplicación.
     * Esto es útil porque los scrapers suelen devolver JSONs muy sucios.
     */
    mapToIdealistaProperty(data) {
        // Ajusta estas claves según lo que realmente devuelva el JSON del actor
        return {
            url: data.url,
            title: data.title || data.elementTitle,
            price: data.price || 0,
            currency: data.currency || "EUR",
            thumbnail: data.thumbnail || data.image,
            location: data.address || data.location,
            rooms: data.rooms,
            area: data.size || data.area,
        };
    }
}
exports.ApifyService = ApifyService;
//# sourceMappingURL=idealistaScraperService.js.map