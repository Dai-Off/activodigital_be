"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceInvoiceService = void 0;
const supabase_1 = require("../../lib/supabase");
class ServiceInvoiceService {
    getSupabase() {
        return (0, supabase_1.getSupabaseClient)();
    }
    async createServiceInvoice(data, userAuthId) {
        const invoiceData = {
            building_id: data.building_id,
            service_type: data.service_type,
            invoice_number: data.invoice_number || null,
            invoice_date: data.invoice_date,
            amount_eur: data.amount_eur,
            units: data.units || null,
            period_start: data.period_start || null,
            period_end: data.period_end || null,
            document_url: data.document_url || null,
            document_filename: data.document_filename || null,
            notes: data.notes || null,
            provider: data.provider || null,
            created_by: userAuthId,
        };
        const { data: invoice, error } = await this.getSupabase()
            .from("service_invoices")
            .insert(invoiceData)
            .select()
            .single();
        if (error) {
            throw new Error(`Error al crear factura de servicio: ${error.message}`);
        }
        // El trigger de la base de datos recalculará service_expenses automáticamente
        return this.mapToServiceInvoice(invoice);
    }
    async getServiceInvoicesByBuilding(buildingId, userAuthId, serviceType, year, month) {
        let query = this.getSupabase()
            .from("service_invoices")
            .select("*")
            .eq("building_id", buildingId);
        if (serviceType) {
            query = query.eq("service_type", serviceType);
        }
        query = query.order("invoice_date", { ascending: false });
        const { data, error } = await query;
        if (error) {
            throw new Error(`Error al obtener facturas de servicio: ${error.message}`);
        }
        let invoices = (data || []).map((inv) => this.mapToServiceInvoice(inv));
        // Filtrar por año y mes si se especifican (PostgREST no soporta EXTRACT directamente)
        if (year) {
            invoices = invoices.filter((inv) => new Date(inv.invoice_date).getFullYear() === year);
        }
        if (month) {
            invoices = invoices.filter((inv) => new Date(inv.invoice_date).getMonth() + 1 === month);
        }
        return invoices;
    }
    async getServiceInvoiceById(id, userAuthId) {
        const { data: invoice, error } = await this.getSupabase()
            .from("service_invoices")
            .select("*")
            .eq("id", id)
            .single();
        if (error) {
            if (error.code === "PGRST116") {
                return null;
            }
            throw new Error(`Error al obtener factura de servicio: ${error.message}`);
        }
        return this.mapToServiceInvoice(invoice);
    }
    async updateServiceInvoice(id, data, userAuthId) {
        const updateData = {};
        if (data.service_type !== undefined)
            updateData.service_type = data.service_type;
        if (data.invoice_number !== undefined)
            updateData.invoice_number = data.invoice_number;
        if (data.invoice_date !== undefined)
            updateData.invoice_date = data.invoice_date;
        if (data.amount_eur !== undefined)
            updateData.amount_eur = data.amount_eur;
        if (data.units !== undefined)
            updateData.units = data.units;
        if (data.period_start !== undefined)
            updateData.period_start = data.period_start;
        if (data.period_end !== undefined)
            updateData.period_end = data.period_end;
        if (data.document_url !== undefined)
            updateData.document_url = data.document_url;
        if (data.document_filename !== undefined)
            updateData.document_filename = data.document_filename;
        if (data.notes !== undefined)
            updateData.notes = data.notes;
        if (data.provider !== undefined)
            updateData.provider = data.provider;
        const { data: invoice, error } = await this.getSupabase()
            .from("service_invoices")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();
        if (error) {
            if (error.code === "PGRST116") {
                return null;
            }
            throw new Error(`Error al actualizar factura de servicio: ${error.message}`);
        }
        // El trigger de la base de datos recalculará service_expenses automáticamente
        return this.mapToServiceInvoice(invoice);
    }
    async deleteServiceInvoice(id, userAuthId) {
        const { error } = await this.getSupabase()
            .from("service_invoices")
            .delete()
            .eq("id", id);
        if (error) {
            throw new Error(`Error al eliminar factura de servicio: ${error.message}`);
        }
        // El trigger de la base de datos recalculará service_expenses automáticamente
    }
    mapToServiceInvoice(dbRow) {
        return {
            id: dbRow.id,
            building_id: dbRow.building_id,
            service_type: dbRow.service_type,
            invoice_number: dbRow.invoice_number ?? null,
            invoice_date: dbRow.invoice_date,
            amount_eur: parseFloat(dbRow.amount_eur),
            units: dbRow.units ?? null,
            period_start: dbRow.period_start ?? null,
            period_end: dbRow.period_end ?? null,
            document_url: dbRow.document_url ?? null,
            document_filename: dbRow.document_filename ?? null,
            notes: dbRow.notes ?? null,
            provider: dbRow.provider ?? null,
            created_at: dbRow.created_at,
            updated_at: dbRow.updated_at,
            created_by: dbRow.created_by ?? null,
        };
    }
}
exports.ServiceInvoiceService = ServiceInvoiceService;
//# sourceMappingURL=serviceInvoiceService.js.map