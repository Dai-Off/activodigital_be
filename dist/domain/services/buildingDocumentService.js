"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingDocumentService = void 0;
const supabase_1 = require("../../lib/supabase");
const aiProcessingService_1 = require("./aiProcessingService");
class BuildingDocumentService {
    getSupabase() {
        return (0, supabase_1.getSupabaseClient)();
    }
    getAIService() {
        return new aiProcessingService_1.AIProcessingService();
    }
    async createBuildingDocument(data, userAuthId) {
        const documentData = {
            building_id: data.building_id,
            file_name: data.file_name,
            file_size: data.file_size,
            mime_type: data.mime_type,
            storage_bucket: data.storage_bucket || 'building-documents',
            storage_path: data.storage_path,
            storage_file_name: data.storage_file_name,
            category: data.category,
            expiration_date: data.expiration_date || null,
            uploaded_by: userAuthId,
        };
        const { data: document, error } = await this.getSupabase()
            .from("building_documents")
            .insert(documentData)
            .select()
            .single();
        if (error) {
            throw new Error(`Error al crear documento de edificio: ${error.message}`);
        }
        if (document && document.category && document.category !== "financial") {
            this.updateExpirationDateWithAI(document).catch((err) => {
                console.error("Error actualizando expiration_date con IA:", err);
            });
        }
        return this.mapToBuildingDocument(document);
    }
    async getBuildingDocumentsByBuilding(buildingId, category) {
        let query = this.getSupabase()
            .from("building_documents")
            .select("*")
            .eq("building_id", buildingId);
        if (category) {
            query = query.eq("category", category);
        }
        query = query.order("uploaded_at", { ascending: false });
        const { data, error } = await query;
        if (error) {
            throw new Error(`Error al obtener documentos de edificio: ${error.message}`);
        }
        return (data || []).map((doc) => this.mapToBuildingDocument(doc));
    }
    async getBuildingDocumentById(documentId) {
        const { data, error } = await this.getSupabase()
            .from("building_documents")
            .select("*")
            .eq("id", documentId)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return null; // Documento no encontrado
            }
            throw new Error(`Error al obtener documento: ${error.message}`);
        }
        return this.mapToBuildingDocument(data);
    }
    async updateBuildingDocument(documentId, data, userAuthId) {
        const updateData = {};
        if (data.expiration_date !== undefined)
            updateData.expiration_date = data.expiration_date;
        if (data.category !== undefined)
            updateData.category = data.category;
        const { data: document, error } = await this.getSupabase()
            .from("building_documents")
            .update(updateData)
            .eq("id", documentId)
            .select()
            .single();
        if (error) {
            throw new Error(`Error al actualizar documento: ${error.message}`);
        }
        return this.mapToBuildingDocument(document);
    }
    async deleteBuildingDocument(documentId) {
        const { error } = await this.getSupabase()
            .from("building_documents")
            .delete()
            .eq("id", documentId);
        if (error) {
            throw new Error(`Error al eliminar documento: ${error.message}`);
        }
    }
    mapToBuildingDocument(dbDoc) {
        return {
            id: dbDoc.id,
            building_id: dbDoc.building_id,
            file_name: dbDoc.file_name,
            file_size: dbDoc.file_size,
            mime_type: dbDoc.mime_type,
            storage_bucket: dbDoc.storage_bucket,
            storage_path: dbDoc.storage_path,
            storage_file_name: dbDoc.storage_file_name,
            category: dbDoc.category,
            expiration_date: dbDoc.expiration_date ? new Date(dbDoc.expiration_date).toISOString().split('T')[0] : null,
            uploaded_by: dbDoc.uploaded_by,
            uploaded_at: dbDoc.uploaded_at,
            created_at: dbDoc.created_at,
            updated_at: dbDoc.updated_at,
        };
    }
    async updateExpirationDateWithAI(dbDoc) {
        const supabase = this.getSupabase();
        const bucket = dbDoc.storage_bucket || "building-documents";
        const path = dbDoc.storage_path;
        if (!path)
            return;
        // 1) Generar URL firmada temporal
        const { data: signed, error: signedError } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, 60 * 60); // 1 hora
        if (signedError || !signed?.signedUrl) {
            console.error("No se pudo generar URL firmada para extracción de expiration_date:", signedError);
            return;
        }
        // 2) Pedir a la IA que detecte fecha de vencimiento
        const aiService = this.getAIService();
        const expiration = await aiService.extractDocumentExpirationFromUrl(signed.signedUrl);
        if (!expiration)
            return;
        // 3) Actualizar fila en Supabase
        const { error: updateError } = await supabase
            .from("building_documents")
            .update({ expiration_date: expiration })
            .eq("id", dbDoc.id);
        if (updateError) {
            console.error("Error actualizando expiration_date en building_documents:", updateError);
        }
    }
}
exports.BuildingDocumentService = BuildingDocumentService;
//# sourceMappingURL=buildingDocumentService.js.map