"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataRoomProcessingJobService = void 0;
const supabase_1 = require("../../lib/supabase");
class DataRoomProcessingJobService {
    getSupabase() {
        return (0, supabase_1.getSupabaseClient)();
    }
    async create(input) {
        const { data, error } = await this.getSupabase()
            .from('data_room_processing_jobs')
            .insert({
            user_id: input.user_id,
            building_id: input.building_id,
            checklist_id: input.checklist_id,
            temp_storage_path: input.temp_storage_path,
            file_name: input.file_name,
            mime_type: input.mime_type,
            status: 'queued',
        })
            .select()
            .single();
        if (error)
            throw new Error(`Error al crear job de Data Room: ${error.message}`);
        return this.mapRow(data);
    }
    async getById(id) {
        const { data, error } = await this.getSupabase()
            .from('data_room_processing_jobs')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null;
            throw new Error(`Error al obtener job de Data Room: ${error.message}`);
        }
        return this.mapRow(data);
    }
    async setStatus(id, status, data) {
        const updates = {
            status,
            updated_at: new Date().toISOString(),
        };
        if (data?.error_message !== undefined)
            updates.error_message = data.error_message;
        const { error } = await this.getSupabase()
            .from('data_room_processing_jobs')
            .update(updates)
            .eq('id', id);
        if (error)
            throw new Error(`Error al actualizar estado del job: ${error.message}`);
    }
    mapRow(row) {
        return {
            id: row.id,
            user_id: row.user_id,
            building_id: row.building_id,
            checklist_id: row.checklist_id,
            temp_storage_path: row.temp_storage_path,
            file_name: row.file_name,
            mime_type: row.mime_type,
            status: row.status,
            error_message: row.error_message ?? null,
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }
}
exports.DataRoomProcessingJobService = DataRoomProcessingJobService;
//# sourceMappingURL=dataRoomProcessingJobService.js.map