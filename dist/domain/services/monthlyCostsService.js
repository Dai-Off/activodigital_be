"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonthlyCostsService = void 0;
const supabase_1 = require("../../lib/supabase");
class MonthlyCostsService {
    getSupabase() {
        return (0, supabase_1.getSupabaseClient)();
    }
    // NOTA: Los gastos de servicios se calculan automáticamente desde las facturas de servicios
    // mediante triggers en la base de datos. Solo métodos de lectura disponibles.
    async getMonthlyCostsByBuilding(buildingId, userAuthId, year, month) {
        let query = this.getSupabase()
            .from("service_expenses")
            .select("*")
            .eq("building_id", buildingId);
        if (year) {
            query = query.eq("year", year);
        }
        if (month) {
            if (!year) {
                throw new Error('month parameter requires year parameter');
            }
            query = query.eq("month", month);
        }
        query = query.order("year", { ascending: false }).order("month", { ascending: false });
        const { data: costs, error } = await query;
        if (error) {
            throw new Error(`Error al obtener monthly costs: ${error.message}`);
        }
        if (!costs || costs.length === 0) {
            return [];
        }
        return costs.map((c) => this.mapToMonthlyCost(c));
    }
    async getMonthlyCostById(id, userAuthId) {
        const { data: monthlyCost, error } = await this.getSupabase()
            .from("service_expenses")
            .select("*")
            .eq("id", id)
            .single();
        if (error) {
            if (error.code === "PGRST116") {
                return null;
            }
            throw new Error(`Error al obtener monthly cost: ${error.message}`);
        }
        return this.mapToMonthlyCost(monthlyCost);
    }
    async getMonthlyCostsSummary(buildingId, userAuthId, year) {
        const costs = await this.getMonthlyCostsByBuilding(buildingId, userAuthId, year);
        if (costs.length === 0) {
            return {
                building_id: buildingId,
                year,
                total_annual_eur: 0,
                average_monthly_eur: 0,
                months_count: 0,
                breakdown: {
                    electricity_annual: 0,
                    water_annual: 0,
                    gas_annual: 0,
                    ibi_annual: 0,
                    waste_annual: 0,
                },
            };
        }
        const total_annual_eur = costs.reduce((sum, cost) => sum + (cost.total_monthly_eur || 0), 0);
        const average_monthly_eur = total_annual_eur / costs.length;
        const breakdown = costs.reduce((acc, cost) => ({
            electricity_annual: acc.electricity_annual + cost.electricity_eur,
            water_annual: acc.water_annual + cost.water_eur,
            gas_annual: acc.gas_annual + cost.gas_eur,
            ibi_annual: acc.ibi_annual + cost.ibi_eur,
            waste_annual: acc.waste_annual + cost.waste_eur,
        }), {
            electricity_annual: 0,
            water_annual: 0,
            gas_annual: 0,
            ibi_annual: 0,
            waste_annual: 0,
        });
        return {
            building_id: buildingId,
            year,
            total_annual_eur,
            average_monthly_eur,
            months_count: costs.length,
            breakdown,
        };
    }
    mapToMonthlyCost(dbRow) {
        return {
            id: dbRow.id,
            building_id: dbRow.building_id,
            year: dbRow.year,
            month: dbRow.month,
            electricity_eur: parseFloat(dbRow.electricity_eur),
            water_eur: parseFloat(dbRow.water_eur),
            gas_eur: parseFloat(dbRow.gas_eur),
            ibi_eur: parseFloat(dbRow.ibi_eur),
            waste_eur: parseFloat(dbRow.waste_eur),
            total_monthly_eur: dbRow.total_monthly_eur
                ? parseFloat(dbRow.total_monthly_eur)
                : undefined,
            electricity_units: dbRow.electricity_units ?? null,
            water_units: dbRow.water_units ?? null,
            gas_units: dbRow.gas_units ?? null,
            ibi_units: dbRow.ibi_units ?? null,
            waste_units: dbRow.waste_units ?? null,
            notes: dbRow.notes ?? null,
            created_at: dbRow.created_at,
            updated_at: dbRow.updated_at,
            created_by: dbRow.created_by ?? null,
        };
    }
}
exports.MonthlyCostsService = MonthlyCostsService;
//# sourceMappingURL=monthlyCostsService.js.map