"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingUnitService = void 0;
const supabase_1 = require("../../lib/supabase");
const catastroApiService_1 = require("./catastroApiService");
/**
 * Servicio para gestionar unidades de un edificio.
 * Soporta carga manual y por importación desde Catastro (RC).
 */
class BuildingUnitService {
    constructor() {
        this.supabase = (0, supabase_1.getSupabaseClient)();
        this.catastro = new catastroApiService_1.CatastroApiService();
        this.mapToUnit = (row) => ({
            id: row.id,
            buildingId: row.building_id,
            name: row.name,
            identifier: row.identifier,
            floor: row.floor,
            areaM2: row.area_m2,
            useType: row.use_type,
            status: row.status,
            rent: row.rent,
            tenant: row.tenant,
            rooms: row.rooms,
            baths: row.baths,
            rawData: row.raw_data || null,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }
    async listUnits(buildingId) {
        const { data, error } = await this.supabase
            .from("building_units")
            .select("*")
            .eq("building_id", buildingId)
            .order("created_at", { ascending: true });
        if (error) {
            throw new Error(`Error al obtener unidades: ${error.message}`);
        }
        return (data || []).map(this.mapToUnit);
    }
    /**
     * Calcula el porcentaje de ocupación del edificio basándose en las unidades.
     * Una unidad se considera ocupada si tiene status="ocupada" o tiene tenant.
     */
    calculateOccupancy(units) {
        if (!units || units.length === 0) {
            return null;
        }
        const totalUnits = units.length;
        let occupiedCount = 0;
        for (const unit of units) {
            // Verificar status: debe ser exactamente "ocupada" (case-insensitive)
            const statusStr = unit.status ? String(unit.status).trim() : "";
            const statusCheck = statusStr.toLowerCase() === "ocupada";
            // Verificar tenant: debe existir y no estar vacío
            const tenantStr = unit.tenant ? String(unit.tenant).trim() : "";
            const tenantCheck = tenantStr.length > 0;
            // Una unidad está ocupada si tiene status="ocupada" O tiene tenant
            if (statusCheck || tenantCheck) {
                occupiedCount++;
            }
        }
        const occupancyPct = totalUnits > 0 ? (occupiedCount / totalUnits) * 100 : 0;
        // Redondear a 2 decimales
        return Math.round(occupancyPct * 100) / 100;
    }
    async upsertUnits(buildingId, units) {
        if (!units.length)
            return [];
        const rows = units.map((u) => {
            const row = {
                building_id: buildingId,
                name: u.name,
                identifier: u.identifier,
                floor: u.floor,
                area_m2: u.areaM2,
                use_type: u.useType,
                status: u.status,
                rent: u.rent,
                tenant: u.tenant,
                rooms: u.rooms,
                baths: u.baths,
                raw_data: u.rawData ?? null,
                updated_at: new Date().toISOString(),
            };
            // Solo incluir id si existe (para updates), si no, la BD lo generará automáticamente
            if (u.id) {
                row.id = u.id;
            }
            return row;
        });
        // Si todas las unidades tienen id, usar upsert con onConflict
        // Si no, usar insert (nuevas unidades)
        const allHaveId = rows.every((r) => r.id);
        let result;
        if (allHaveId) {
            result = await this.supabase
                .from("building_units")
                .upsert(rows, { onConflict: "id" })
                .select();
        }
        else {
            result = await this.supabase
                .from("building_units")
                .insert(rows)
                .select();
        }
        if (result.error) {
            throw new Error(`Error al guardar unidades: ${result.error.message}`);
        }
        return (result.data || []).map(this.mapToUnit);
    }
    async deleteUnit(buildingId, unitId) {
        // Verificar que la unidad pertenece al edificio
        const { data: unit, error: fetchError } = await this.supabase
            .from("building_units")
            .select("id, building_id")
            .eq("id", unitId)
            .eq("building_id", buildingId)
            .single();
        if (fetchError || !unit) {
            throw new Error("Unidad no encontrada o no pertenece al edificio");
        }
        // Eliminar la unidad
        const { error } = await this.supabase
            .from("building_units")
            .delete()
            .eq("id", unitId)
            .eq("building_id", buildingId);
        if (error) {
            throw new Error(`Error al eliminar unidad: ${error.message}`);
        }
    }
    /**
     * Importa unidades desde Catastro usando referencia catastral (RC).
     * Si no se puede descomponer, guarda al menos una unidad con rawData.
     */
    async importFromCatastro(buildingId, rc) {
        const inmueble = await this.catastro.getInmuebleRc(rc);
        if (!inmueble) {
            throw new Error("No se pudo obtener el inmueble desde Catastro");
        }
        const unidades = this.extractUnitsFromCatastroResponse(inmueble);
        return this.upsertUnits(buildingId, unidades);
    }
    extractUnitsFromCatastroResponse(payload) {
        // Estructura real de Catastro: inmuebles[0].unidadesConstructivas
        let unidadesArray;
        // Buscar en la estructura real de Catastro primero
        if (payload?.inmuebles && Array.isArray(payload.inmuebles) && payload.inmuebles.length > 0) {
            const primerInmueble = payload.inmuebles[0];
            if (primerInmueble?.unidadesConstructivas && Array.isArray(primerInmueble.unidadesConstructivas)) {
                unidadesArray = primerInmueble.unidadesConstructivas;
            }
        }
        // Fallback: buscar en otras estructuras posibles
        if (!unidadesArray) {
            unidadesArray = [
                payload?.unidades,
                payload?.data?.unidades,
                payload?.result?.unidades,
                payload?.unidadesConstructivas,
            ].find((arr) => Array.isArray(arr) && arr.length > 0);
        }
        if (unidadesArray?.length) {
            return unidadesArray.map((u, idx) => {
                // Construir identificador único: escalera-planta-puerta
                const identifier = [u.escalera, u.planta, u.puerta]
                    .filter(Boolean)
                    .join("-") || `UC-${idx + 1}`;
                // Construir nombre descriptivo
                const name = [u.escalera, u.planta, u.puerta]
                    .filter(Boolean)
                    .join("-") || `Unidad Constructiva ${idx + 1}`;
                return {
                    id: undefined, // Nuevas unidades, la BD generará el ID
                    name: name,
                    identifier: identifier,
                    floor: u.planta || null,
                    areaM2: u.superficieTotal ? parseFloat(u.superficieTotal) : null,
                    useType: u.uso || null,
                    status: null, // Catastro no proporciona estado de ocupación
                    rent: null,
                    tenant: null,
                    rooms: null,
                    baths: null,
                    rawData: u,
                };
            });
        }
        // Fallback: crear una sola unidad con el payload completo como rawData
        const referenciaCatastral = payload?.inmuebles?.[0]?.referenciaCatastral?.referenciaCatastral
            || payload?.referenciaCatastral
            || payload?.rc
            || null;
        return [
            {
                name: "Unidad Principal",
                identifier: referenciaCatastral,
                floor: null,
                areaM2: payload?.inmuebles?.[0]?.datosEconomicos?.superficieConstruida
                    ? parseFloat(payload.inmuebles[0].datosEconomicos.superficieConstruida)
                    : null,
                useType: payload?.inmuebles?.[0]?.datosEconomicos?.uso || null,
                status: null,
                rent: null,
                tenant: null,
                rooms: null,
                baths: null,
                rawData: payload,
            },
        ];
    }
}
exports.BuildingUnitService = BuildingUnitService;
//# sourceMappingURL=buildingUnitService.js.map