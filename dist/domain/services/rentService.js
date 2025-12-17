"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentService = void 0;
const supabase_1 = require("../../lib/supabase");
class RentService {
    getSupabase() {
        return (0, supabase_1.getSupabaseClient)();
    }
    // ========== FACTURAS (con pago incluido) ==========
    async createRentInvoice(data, userAuthId) {
        const totalAmount = data.rentAmount + (data.additionalCharges || 0);
        const invoiceData = {
            building_id: data.buildingId,
            unit_id: data.unitId,
            invoice_month: data.invoiceMonth,
            invoice_number: data.invoiceNumber || null,
            rent_amount: data.rentAmount,
            additional_charges: data.additionalCharges || 0,
            total_amount: totalAmount,
            status: "pending",
            due_date: data.dueDate,
            notes: data.notes || null,
            // Campos de pago inicialmente null
            payment_date: null,
            payment_amount: null,
            payment_method: null,
            payment_reference_number: null,
            payment_notes: null,
        };
        const { data: invoice, error } = await this.getSupabase()
            .from("rent_invoices")
            .insert(invoiceData)
            .select()
            .single();
        if (error) {
            throw new Error(`Error al crear factura: ${error.message}`);
        }
        return this.mapToRentInvoice(invoice);
    }
    async getRentInvoicesByBuilding(buildingId, userAuthId) {
        const { data, error } = await this.getSupabase()
            .from("rent_invoices")
            .select("*")
            .eq("building_id", buildingId)
            .order("invoice_month", { ascending: false });
        if (error) {
            throw new Error(`Error al obtener facturas: ${error.message}`);
        }
        return (data || []).map(this.mapToRentInvoice);
    }
    async getRentInvoicesByMonth(buildingId, month, // YYYY-MM
    userAuthId) {
        // Convertir YYYY-MM a YYYY-MM-01
        const invoiceMonth = `${month}-01`;
        const { data: invoices, error: invoicesError } = await this.getSupabase()
            .from("rent_invoices")
            .select("*")
            .eq("building_id", buildingId)
            .eq("invoice_month", invoiceMonth)
            .order("created_at", { ascending: true });
        if (invoicesError) {
            throw new Error(`Error al obtener facturas: ${invoicesError.message}`);
        }
        return (invoices || []).map(this.mapToRentInvoice);
    }
    async getRentInvoiceById(id, userAuthId) {
        const { data: invoice, error: invoiceError } = await this.getSupabase()
            .from("rent_invoices")
            .select("*")
            .eq("id", id)
            .single();
        if (invoiceError || !invoice) {
            return null;
        }
        return this.mapToRentInvoice(invoice);
    }
    async updateRentInvoice(id, data, userAuthId) {
        // Obtener factura actual para calcular nuevo total
        const { data: currentInvoice, error: fetchError } = await this.getSupabase()
            .from("rent_invoices")
            .select("*")
            .eq("id", id)
            .single();
        if (fetchError || !currentInvoice) {
            return null;
        }
        const updateData = {};
        if (data.invoiceNumber !== undefined)
            updateData.invoice_number = data.invoiceNumber;
        if (data.rentAmount !== undefined)
            updateData.rent_amount = data.rentAmount;
        if (data.additionalCharges !== undefined)
            updateData.additional_charges = data.additionalCharges;
        if (data.dueDate !== undefined)
            updateData.due_date = data.dueDate;
        if (data.notes !== undefined)
            updateData.notes = data.notes;
        // Campos de pago
        if (data.paymentDate !== undefined)
            updateData.payment_date = data.paymentDate;
        if (data.paymentAmount !== undefined)
            updateData.payment_amount = data.paymentAmount;
        if (data.paymentMethod !== undefined)
            updateData.payment_method = data.paymentMethod;
        if (data.paymentReferenceNumber !== undefined)
            updateData.payment_reference_number = data.paymentReferenceNumber;
        if (data.paymentNotes !== undefined)
            updateData.payment_notes = data.paymentNotes;
        // Recalcular total_amount si cambió rentAmount o additionalCharges
        if (data.rentAmount !== undefined || data.additionalCharges !== undefined) {
            const rentAmount = data.rentAmount !== undefined
                ? data.rentAmount
                : parseFloat(currentInvoice.rent_amount);
            const additionalCharges = data.additionalCharges !== undefined
                ? data.additionalCharges
                : parseFloat(currentInvoice.additional_charges || "0");
            updateData.total_amount = rentAmount + additionalCharges;
        }
        const { data: invoice, error } = await this.getSupabase()
            .from("rent_invoices")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();
        if (error) {
            throw new Error(`Error al actualizar factura: ${error.message}`);
        }
        return invoice ? this.mapToRentInvoice(invoice) : null;
    }
    async deleteRentInvoice(id, userAuthId) {
        const { error } = await this.getSupabase()
            .from("rent_invoices")
            .delete()
            .eq("id", id);
        if (error) {
            throw new Error(`Error al eliminar factura: ${error.message}`);
        }
    }
    // ========== RESUMEN MENSUAL ==========
    async getMonthlyRentSummary(buildingId, month, // YYYY-MM
    userAuthId) {
        const invoices = await this.getRentInvoicesByMonth(buildingId, month, userAuthId);
        // Calcular totales
        const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const totalCollected = invoices.reduce((sum, inv) => sum + (inv.paymentAmount || 0), 0);
        // Limitar el porcentaje a 100% máximo (si hay sobrepagos)
        const collectionPercentage = totalInvoiced > 0
            ? Math.min((totalCollected / totalInvoiced) * 100, 100)
            : 0;
        // Contar por estado
        const paidInvoices = invoices.filter((inv) => inv.status === "paid");
        const pendingInvoices = invoices.filter((inv) => inv.status === "pending");
        const overdueInvoices = invoices.filter((inv) => inv.status === "overdue");
        // Calcular montos por estado
        const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.totalAmount - (inv.paymentAmount || 0)), 0);
        const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.totalAmount - (inv.paymentAmount || 0)), 0);
        // Parsear mes
        const [year, monthNum] = month.split("-").map(Number);
        return {
            buildingId,
            month,
            year,
            monthNumber: monthNum,
            totalInvoiced,
            totalCollected,
            collectionPercentage: Math.round(collectionPercentage * 100) / 100, // Redondear a 2 decimales
            paidCount: paidInvoices.length,
            pendingCount: pendingInvoices.length,
            overdueCount: overdueInvoices.length,
            paidAmount,
            pendingAmount,
            overdueAmount,
            invoices,
        };
    }
    // ========== MAPPERS ==========
    mapToRentInvoice(row) {
        return {
            id: row.id,
            buildingId: row.building_id,
            unitId: row.unit_id,
            invoiceMonth: row.invoice_month,
            invoiceNumber: row.invoice_number,
            rentAmount: parseFloat(row.rent_amount),
            additionalCharges: parseFloat(row.additional_charges || "0"),
            totalAmount: parseFloat(row.total_amount),
            status: row.status,
            dueDate: row.due_date,
            notes: row.notes,
            // Campos de pago
            paymentDate: row.payment_date,
            paymentAmount: row.payment_amount ? parseFloat(row.payment_amount) : null,
            paymentMethod: row.payment_method,
            paymentReferenceNumber: row.payment_reference_number,
            paymentNotes: row.payment_notes,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
exports.RentService = RentService;
//# sourceMappingURL=rentService.js.map