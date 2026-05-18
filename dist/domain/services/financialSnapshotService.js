"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialSnapshotService = void 0;
const supabase_1 = require("../../lib/supabase");
const embeddingHelper_1 = require("../../lib/embeddingHelper");
const tirCalculator_1 = require("../../utils/tirCalculator");
const epbdCalculator_1 = require("../../utils/epbdCalculator");
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
            .select("*, buildings(price, name, typology, address, province, images, energy_certificates(primary_energy_kwh_per_m2_year, rating))")
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
        // 1. Obtener todos los edificios con su información base y certificados
        const { data: buildings, error: bError } = await this.getSupabase()
            .from("buildings")
            .select("*, energy_certificates(primary_energy_kwh_per_m2_year, rating)")
            .eq("deleted", false)
            .order("name", { ascending: true });
        if (bError) {
            throw new Error(`Error al obtener edificios: ${bError.message}`);
        }
        // 2. Obtener los últimos snapshots para cada edificio
        const { data: snapshots, error: sError } = await this.getSupabase()
            .from("financial_snapshots")
            .select("*")
            .order("created_at", { ascending: false });
        if (sError) {
            throw new Error(`Error al obtener financial snapshots: ${sError.message}`);
        }
        // 3. Mapear buildings -> snapshots (tomando el último snapshot de cada uno)
        const buildingLatestSnapshot = new Map();
        for (const snap of snapshots || []) {
            if (!buildingLatestSnapshot.has(snap.building_id)) {
                buildingLatestSnapshot.set(snap.building_id, snap);
            }
        }
        // 4. Construir la lista final de Snapshots (reales o virtuales)
        const result = buildings.map((b) => {
            const existingSnapshot = buildingLatestSnapshot.get(b.id);
            // Si existe el snapshot, lo mapeamos normalmente (incluye lógica de simulación interna)
            if (existingSnapshot) {
                // Inyectamos la relación buildings para que mapToFinancialSnapshot funcione igual
                return this.mapToFinancialSnapshot({
                    ...existingSnapshot,
                    buildings: b,
                });
            }
            // Si NO existe, creamos un "Virtual Snapshot" para que el Radar tenga qué mostrar
            return this.mapToVirtualSnapshot(b);
        });
        return result;
    }
    /**
     * Crea un objeto FinancialSnapshot virtual para edificios que no tienen estudio cargado.
     */
    mapToVirtualSnapshot(building) {
        const certs = building.energy_certificates;
        let currentConsumption = null;
        let currentRating = null;
        if (certs && Array.isArray(certs) && certs.length > 0) {
            currentConsumption = parseFloat(certs[0].primary_energy_kwh_per_m2_year);
            currentRating = certs[0].rating;
        }
        const savingsPct = epbdCalculator_1.DEFAULT_SAVINGS_PCT;
        const potentialLetter = (0, epbdCalculator_1.calculatePotentialRating)(currentConsumption, savingsPct, building.typology, currentRating, building.province);
        return {
            building_id: building.id,
            period_start: new Date().toISOString(),
            period_end: new Date().toISOString(),
            currency: "EUR",
            ingresos_brutos_anuales_eur: 0,
            walt_meses: 0,
            concentracion_top1_pct_noi: 0,
            opex_total_anual_eur: 0,
            opex_energia_anual_eur: 0,
            activo: building.name,
            direccion: building.address,
            topologia: building.typology,
            images: (building.images || []).map((img) => ({
                id: img.id,
                url: img.url,
                title: img.title,
                filename: img.filename || img.title,
                isMain: img.isMain,
                uploadedAt: img.uploadedAt || new Date().toISOString(),
            })),
            estado_actual: currentRating || "-",
            potencial: {
                letra: potentialLetter,
                variacion: savingsPct.toString(),
                is_simulated: true,
            },
            tir: { valor: 0, plazo: "-" },
            cash_on_cash: { valor: 0, multiplicador: 0 },
            capex: { total: 0, descripcion: "Sin datos", estimated: 0 },
            subvencion: { valor: 0, porcentaje: 0 },
            green_premium: { valor: 0, roi: 0 },
            plazo: "-",
            taxonomia: { porcentaje: 0 },
            estado: { etiqueta: "Pendiente", score: 0, pendientes: "Crear snapshot" },
        };
    }
    async getFinancialSnapshotById(id, userAuthId) {
        const { data: snapshot, error } = await this.getSupabase()
            .from("financial_snapshots")
            .select("*, buildings(price, name, typology, address, province, images, energy_certificates(primary_energy_kwh_per_m2_year, rating))")
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
        // Basic values from DB
        const purchasePrice = dbRow?.buildings?.price
            ? parseFloat(dbRow.buildings.price)
            : 0;
        const rehabCapex = dbRow.estimated_rehab_capex_eur
            ? parseFloat(dbRow.estimated_rehab_capex_eur)
            : 0;
        const grossRevenue = dbRow.gross_annual_revenue_eur
            ? parseFloat(dbRow.gross_annual_revenue_eur)
            : 0;
        const opex = dbRow.total_annual_opex_eur
            ? parseFloat(dbRow.total_annual_opex_eur)
            : 0;
        // Deuda
        const loanAmount = dbRow.outstanding_principal_eur
            ? parseFloat(dbRow.outstanding_principal_eur)
            : 0;
        const interestRate = 3.5; // Placeholder since it's not in the snapshot directly, could be added later
        const loanTermYears = 20; // Placeholder
        let calculatedProjectIRR = dbRow?.tir_value;
        let calculatedCashOnCashIRR = dbRow?.cash_on_cash_value;
        let calculatedCashOnCashMultiplicador = dbRow?.cash_on_cash_multiplicador;
        // Si hay datos financieros mínimos (Precio, Ingresos), calculamos la TIR al vuelo
        const otherRevenue = dbRow.other_annual_revenue_eur
            ? parseFloat(dbRow.other_annual_revenue_eur)
            : 0;
        if (purchasePrice > 0 && (grossRevenue > 0 || otherRevenue > 0)) {
            const tirResults = (0, tirCalculator_1.calculate5YearTIR)({
                purchasePrice,
                rehabCapex,
                annualRevenue: grossRevenue + otherRevenue,
                annualOpex: opex,
                // Optional debt params
                ...(loanAmount > 0 && {
                    loanAmount,
                    interestRate,
                    loanTermYears,
                }),
            });
            calculatedProjectIRR = tirResults.projectIRR;
            calculatedCashOnCashMultiplicador = tirResults.equityMultiple;
            // Cálculo de Cash on Cash como Yield Anual (Rentabilidad sobre el capital desembolsado)
            // CoC = (Net Operating Income - ServicioDeuda) / (Inversion inicial - Préstamo)
            const totalInvestment = purchasePrice + rehabCapex;
            const equity = totalInvestment - loanAmount;
            const netOperatingIncome = grossRevenue + otherRevenue - opex;
            const annualDebtService = dbRow.annual_debt_service_eur
                ? parseFloat(dbRow.annual_debt_service_eur)
                : 0;
            if (equity > 0) {
                calculatedCashOnCashIRR = Number((((netOperatingIncome - annualDebtService) / equity) * 100).toFixed(2));
            }
            else {
                calculatedCashOnCashIRR = 0;
            }
        }
        // 4. Calcular Potencial y Rating Actual
        let currentConsumption = null;
        let currentRating = null;
        const certs = dbRow?.buildings?.energy_certificates;
        if (certs && Array.isArray(certs) && certs.length > 0) {
            currentConsumption = parseFloat(certs[0].primary_energy_kwh_per_m2_year);
            currentRating = certs[0].rating;
        }
        const rawSavingsPct = dbRow.estimated_energy_savings_pct
            ? parseFloat(dbRow.estimated_energy_savings_pct)
            : null;
        const isSimulated = rawSavingsPct === null || rawSavingsPct === undefined;
        const savingsPct = isSimulated ? epbdCalculator_1.DEFAULT_SAVINGS_PCT : rawSavingsPct;
        let potentialLetter = dbRow?.potencial_status_letter;
        const calculatedLetter = (0, epbdCalculator_1.calculatePotentialRating)(currentConsumption, savingsPct, dbRow?.buildings?.typology, currentRating, dbRow?.buildings?.province);
        potentialLetter =
            potentialLetter && potentialLetter !== "-"
                ? potentialLetter
                : calculatedLetter;
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
            estado_actual: currentRating || "-",
            potencial: {
                letra: potentialLetter,
                variacion: savingsPct?.toString() || "0",
                is_simulated: isSimulated,
            },
            // Usamos los cálculos dinámicos o guardados:
            tir: { valor: calculatedProjectIRR, plazo: dbRow?.tir_term || "5 años" },
            cash_on_cash: {
                valor: calculatedCashOnCashIRR,
                multiplicador: calculatedCashOnCashMultiplicador !== undefined
                    ? calculatedCashOnCashMultiplicador
                    : dbRow?.cash_on_cash_multiplicador,
            },
            // Mapeo de CAPEX: usamos el total real o el estimado de rehabilitación como fallback
            capex: {
                total: dbRow?.capex_total ??
                    (dbRow.estimated_rehab_capex_eur
                        ? parseFloat(dbRow.estimated_rehab_capex_eur)
                        : 0),
                descripcion: dbRow?.capex_description ||
                    (dbRow.estimated_rehab_capex_eur
                        ? "Estimación de rehabilitación"
                        : "Sin datos"),
                estimated: dbRow?.estimated_rehab_capex_eur
                    ? parseFloat(dbRow.estimated_rehab_capex_eur)
                    : 0,
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
            estado: {
                etiqueta: "Pendiente",
                score: dbRow?.status_score || 0,
                pendientes: dbRow?.status_tag || "Snapshot cargado",
            },
            created_at: dbRow.created_at,
            updated_at: dbRow.updated_at,
        };
    }
}
exports.FinancialSnapshotService = FinancialSnapshotService;
//# sourceMappingURL=financialSnapshotService.js.map