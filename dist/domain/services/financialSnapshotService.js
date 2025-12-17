"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialSnapshotService = void 0;
const supabase_1 = require("../../lib/supabase");
const embeddingHelper_1 = require("../../lib/embeddingHelper");
class FinancialSnapshotService {
    getSupabase() {
        return (0, supabase_1.getSupabaseClient)();
    }
    async createFinancialSnapshot(data, userAuthId) {
        // Normalizar ratios a 0-1 si vienen como 0-100
        let concentracion = data.concentracion_top1_pct_noi;
        if (concentracion > 1) {
            concentracion = concentracion / 100;
        }
        let mora = data.mora_pct_12m;
        if (mora !== null && mora !== undefined && mora > 1) {
            mora = mora / 100;
        }
        const snapData = {
            building_id: data.building_id,
            period_start: data.period_start,
            period_end: data.period_end,
            currency: data.currency,
            gross_annual_revenue_eur: data.ingresos_brutos_anuales_eur,
            other_annual_revenue_eur: data.otros_ingresos_anuales_eur ?? null,
            walt_months: data.walt_meses,
            top_tenant_concentration_pct: concentracion,
            has_indexation_clause: data.indexacion_ok ?? null,
            delinquency_rate_12m: mora ?? null,
            total_annual_opex_eur: data.opex_total_anual_eur,
            annual_energy_opex_eur: data.opex_energia_anual_eur,
            annual_maintenance_opex_eur: data.opex_mantenimiento_anual_eur ?? null,
            annual_insurance_opex_eur: data.opex_seguros_anual_eur ?? null,
            annual_other_opex_eur: data.opex_otros_anual_eur ?? null,
            dscr: data.dscr ?? null,
            annual_debt_service_eur: data.servicio_deuda_anual_eur ?? null,
            has_high_prepayment_penalty: data.penalidad_prepago_alta ?? null,
            outstanding_principal_eur: data.principal_pendiente_eur ?? null,
            estimated_rehab_capex_eur: data.capex_rehab_estimado_eur ?? null,
            estimated_energy_savings_pct: data.ahorro_energia_pct_estimado ?? null,
            estimated_price_uplift_pct: data.uplift_precio_pct_estimado ?? null,
            estimated_rehab_duration_weeks: data.lead_time_rehab_semanas ?? null,
            // Supabase maneja JSONB automáticamente, no necesita JSON.stringify()
            meta: data.meta ?? null,
        };
        console.log("Insertando/actualizando snapshot con datos:", JSON.stringify(snapData, null, 2));
        // Intentar hacer UPSERT (actualizar si existe, insertar si no)
        const { data: snapshot, error } = await this.getSupabase()
            .from("financial_snapshots")
            .upsert(snapData, {
            onConflict: "building_id,period_start,period_end",
            ignoreDuplicates: false,
        })
            .select()
            .single();
        if (error) {
            throw new Error(`Error al crear/actualizar financial snapshot: ${error.message}`);
        }
        (0, embeddingHelper_1.generateBuildingEmbedding)(snapshot.building_id).catch((err) => {
            console.error("Error generando embeddings:", err);
        });
        return this.mapToFinancialSnapshot(snapshot);
    }
    async getFinancialSnapshotsByBuilding(buildingId, userAuthId) {
        const { data: snapshots, error } = await this.getSupabase()
            .from("financial_snapshots")
            .select("*")
            .eq("building_id", buildingId)
            .order("created_at", { ascending: false });
        if (error) {
            throw new Error(`Error al obtener financial snapshots: ${error.message}`);
        }
        // Si no hay snapshots, devolver array vacío
        if (!snapshots || snapshots.length === 0) {
            return [];
        }
        return snapshots.map((s) => this.mapToFinancialSnapshot(s));
    }
    async getAllFinancialSnapshotsBuilding() {
        const { data: snapshots, error } = await this.getSupabase()
            .from("financial_snapshots")
            .select("*, buildings(name, typology, address, images )")
            .order("created_at", { ascending: false });
        if (error) {
            throw new Error(`Error al obtener financial snapshots: ${error.message}`);
        }
        // Si no hay snapshots, devolver array vacío
        if (!snapshots || snapshots.length === 0) {
            return [];
        }
        return snapshots.map((s) => this.mapToFinancialSnapshot(s));
    }
    async getFinancialSnapshotById(id, userAuthId) {
        const { data: snapshot, error } = await this.getSupabase()
            .from("financial_snapshots")
            .select("*")
            .eq("id", id)
            .single();
        if (error) {
            if (error.code === "PGRST116") {
                return null;
            }
            throw new Error(`Error al obtener financial snapshot: ${error.message}`);
        }
        return this.mapToFinancialSnapshot(snapshot);
    }
    async updateFinancialSnapshot(id, data, userAuthId) {
        const updateData = {};
        if (data.period_start !== undefined)
            updateData.period_start = data.period_start;
        if (data.period_end !== undefined)
            updateData.period_end = data.period_end;
        if (data.currency !== undefined)
            updateData.currency = data.currency;
        if (data.ingresos_brutos_anuales_eur !== undefined)
            updateData.gross_annual_revenue_eur = data.ingresos_brutos_anuales_eur;
        if (data.otros_ingresos_anuales_eur !== undefined)
            updateData.other_annual_revenue_eur = data.otros_ingresos_anuales_eur;
        if (data.walt_meses !== undefined)
            updateData.walt_months = data.walt_meses;
        if (data.concentracion_top1_pct_noi !== undefined)
            updateData.top_tenant_concentration_pct = data.concentracion_top1_pct_noi;
        if (data.indexacion_ok !== undefined)
            updateData.has_indexation_clause = data.indexacion_ok;
        if (data.mora_pct_12m !== undefined)
            updateData.delinquency_rate_12m = data.mora_pct_12m;
        if (data.opex_total_anual_eur !== undefined)
            updateData.total_annual_opex_eur = data.opex_total_anual_eur;
        if (data.opex_energia_anual_eur !== undefined)
            updateData.annual_energy_opex_eur = data.opex_energia_anual_eur;
        if (data.opex_mantenimiento_anual_eur !== undefined)
            updateData.annual_maintenance_opex_eur =
                data.opex_mantenimiento_anual_eur;
        if (data.opex_seguros_anual_eur !== undefined)
            updateData.annual_insurance_opex_eur = data.opex_seguros_anual_eur;
        if (data.opex_otros_anual_eur !== undefined)
            updateData.annual_other_opex_eur = data.opex_otros_anual_eur;
        if (data.dscr !== undefined)
            updateData.dscr = data.dscr;
        if (data.servicio_deuda_anual_eur !== undefined)
            updateData.annual_debt_service_eur = data.servicio_deuda_anual_eur;
        if (data.penalidad_prepago_alta !== undefined)
            updateData.has_high_prepayment_penalty = data.penalidad_prepago_alta;
        if (data.principal_pendiente_eur !== undefined)
            updateData.outstanding_principal_eur = data.principal_pendiente_eur;
        if (data.capex_rehab_estimado_eur !== undefined)
            updateData.estimated_rehab_capex_eur = data.capex_rehab_estimado_eur;
        if (data.ahorro_energia_pct_estimado !== undefined)
            updateData.estimated_energy_savings_pct =
                data.ahorro_energia_pct_estimado;
        if (data.uplift_precio_pct_estimado !== undefined)
            updateData.estimated_price_uplift_pct = data.uplift_precio_pct_estimado;
        if (data.lead_time_rehab_semanas !== undefined)
            updateData.estimated_rehab_duration_weeks = data.lead_time_rehab_semanas;
        // Supabase maneja JSONB automáticamente, no necesita JSON.stringify()
        if (data.meta !== undefined)
            updateData.meta = data.meta;
        const { data: snapshot, error } = await this.getSupabase()
            .from("financial_snapshots")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();
        if (error) {
            if (error.code === "PGRST116") {
                return null;
            }
            throw new Error(`Error al actualizar financial snapshot: ${error.message}`);
        }
        (0, embeddingHelper_1.generateBuildingEmbedding)(snapshot.building_id).catch((err) => {
            console.error("Error generando embeddings:", err);
        });
        return this.mapToFinancialSnapshot(snapshot);
    }
    async deleteFinancialSnapshot(id, userAuthId) {
        const { error } = await this.getSupabase()
            .from("financial_snapshots")
            .delete()
            .eq("id", id);
        if (error) {
            throw new Error(`Error al eliminar financial snapshot: ${error.message}`);
        }
    }
    mapToFinancialSnapshot(dbRow) {
        return {
            id: dbRow.id,
            building_id: dbRow.building_id,
            period_start: dbRow.period_start,
            period_end: dbRow.period_end,
            currency: dbRow.currency,
            ingresos_brutos_anuales_eur: parseFloat(dbRow.gross_annual_revenue_eur),
            otros_ingresos_anuales_eur: dbRow.other_annual_revenue_eur
                ? parseFloat(dbRow.other_annual_revenue_eur)
                : null,
            walt_meses: dbRow.walt_months,
            concentracion_top1_pct_noi: parseFloat(dbRow.top_tenant_concentration_pct),
            indexacion_ok: dbRow.has_indexation_clause,
            mora_pct_12m: dbRow.delinquency_rate_12m
                ? parseFloat(dbRow.delinquency_rate_12m)
                : null,
            opex_total_anual_eur: parseFloat(dbRow.total_annual_opex_eur),
            opex_energia_anual_eur: parseFloat(dbRow.annual_energy_opex_eur),
            opex_mantenimiento_anual_eur: dbRow.annual_maintenance_opex_eur
                ? parseFloat(dbRow.annual_maintenance_opex_eur)
                : null,
            opex_seguros_anual_eur: dbRow.annual_insurance_opex_eur
                ? parseFloat(dbRow.annual_insurance_opex_eur)
                : null,
            opex_otros_anual_eur: dbRow.annual_other_opex_eur
                ? parseFloat(dbRow.annual_other_opex_eur)
                : null,
            dscr: dbRow.dscr ? parseFloat(dbRow.dscr) : null,
            servicio_deuda_anual_eur: dbRow.annual_debt_service_eur
                ? parseFloat(dbRow.annual_debt_service_eur)
                : null,
            penalidad_prepago_alta: dbRow.has_high_prepayment_penalty,
            principal_pendiente_eur: dbRow.outstanding_principal_eur
                ? parseFloat(dbRow.outstanding_principal_eur)
                : null,
            capex_rehab_estimado_eur: dbRow.estimated_rehab_capex_eur
                ? parseFloat(dbRow.estimated_rehab_capex_eur)
                : null,
            ahorro_energia_pct_estimado: dbRow.estimated_energy_savings_pct
                ? parseFloat(dbRow.estimated_energy_savings_pct)
                : null,
            uplift_precio_pct_estimado: dbRow.estimated_price_uplift_pct
                ? parseFloat(dbRow.estimated_price_uplift_pct)
                : null,
            lead_time_rehab_semanas: dbRow.estimated_rehab_duration_weeks,
            // Supabase devuelve JSONB ya como objeto, no necesita JSON.parse()
            meta: dbRow.meta || undefined,
            activo: dbRow?.buildings?.name,
            direccion: dbRow?.buildings?.address,
            topologia: dbRow?.buildings?.typology,
            images: (dbRow?.buildings?.images || []).map((img) => ({
                id: img.id,
                url: img.url,
                title: img.title,
                filename: img.filename || img.title,
                isMain: img.isMain,
                uploadedAt: img.uploadedAt || new Date().toISOString(),
            })),
            estado_actual: dbRow?.current_status,
            potencial: {
                letra: dbRow?.potencial_status_letter,
                variacion: dbRow?.potential_variation,
            },
            tir: { valor: dbRow?.tir_value, plazo: dbRow?.tir_term },
            cash_on_cash: {
                valor: dbRow?.cash_on_cash_value,
                multiplicador: dbRow?.cash_on_cash_multiplicador,
            },
            capex: {
                total: dbRow?.capex_total,
                descripcion: dbRow?.capex_description,
                estimated: dbRow?.estimated_rehab_capex_eur,
            },
            subvencion: {
                valor: dbRow?.subvention_value,
                porcentaje: dbRow?.subvention_porcent,
            },
            green_premium: {
                valor: dbRow?.green_premium_value,
                roi: dbRow?.green_premium_roi,
            },
            plazo: dbRow?.term,
            taxonomia: { porcentaje: dbRow?.taxonomy },
            estado: { etiqueta: dbRow?.status_tag, score: dbRow?.status_score },
            created_at: dbRow.created_at,
            updated_at: dbRow.updated_at,
        };
    }
}
exports.FinancialSnapshotService = FinancialSnapshotService;
//# sourceMappingURL=financialSnapshotService.js.map