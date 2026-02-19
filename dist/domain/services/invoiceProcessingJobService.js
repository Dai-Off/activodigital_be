"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceProcessingJobService = void 0;
const supabase_1 = require("../../lib/supabase");
class InvoiceProcessingJobService {
    getSupabase() {
        return (0, supabase_1.getSupabaseClient)();
    }
    async create(input) {
        const { data, error } = await this.getSupabase()
            .from('invoice_processing_jobs')
            .insert({
            user_id: input.user_id,
            building_id: input.building_id,
            document_url: input.document_url,
            document_filename: input.document_filename,
            status: 'queued',
            job_type: 'invoice',
        })
            .select()
            .single();
        if (error)
            throw new Error(`Error al crear job: ${error.message}`);
        return this.mapRow(data);
    }
    async getById(id) {
        const { data, error } = await this.getSupabase()
            .from('invoice_processing_jobs')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null;
            throw new Error(`Error al obtener job: ${error.message}`);
        }
        return this.mapRow(data);
    }
    async getByIdForUser(id, userId) {
        const { data, error } = await this.getSupabase()
            .from('invoice_processing_jobs')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null;
            throw new Error(`Error al obtener job: ${error.message}`);
        }
        return this.mapRow(data);
    }
    async setStatus(id, status, data) {
        const updates = {
            status,
            updated_at: new Date().toISOString(),
        };
        if (data?.extracted_data !== undefined)
            updates.extracted_data = data.extracted_data;
        if (data?.error_message !== undefined)
            updates.error_message = data.error_message;
        const { error } = await this.getSupabase()
            .from('invoice_processing_jobs')
            .update(updates)
            .eq('id', id);
        if (error)
            throw new Error(`Error al actualizar job: ${error.message}`);
    }
    mapRow(row) {
        return {
            id: row.id,
            user_id: row.user_id,
            building_id: row.building_id,
            document_url: row.document_url,
            document_filename: row.document_filename,
            status: row.status,
            job_type: row.job_type ?? 'invoice',
            extracted_data: row.extracted_data ?? null,
            error_message: row.error_message ?? null,
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }
}
exports.InvoiceProcessingJobService = InvoiceProcessingJobService;
//# sourceMappingURL=invoiceProcessingJobService.js.map