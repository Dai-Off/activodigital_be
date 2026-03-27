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
            storage_bucket: data.storage_bucket || "building-documents",
            storage_path: data.storage_path,
            storage_file_name: data.storage_file_name,
            category: data.category,
            expiration_date: data.expiration_date || null,
            uploaded_by: userAuthId,
            metadata: data.metadata || {},
        };
        const { data: document, error } = await this.getSupabase()
            .from("building_documents")
            .insert(documentData)
            .select()
            .single();
        if (error) {
            throw new Error(`Error al crear documento de edificio: ${error.message}`);
        }
        const aiSupportedTypes = [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/gif",
            "image/webp",
            "application/pdf",
        ];
        if (document &&
            document.category &&
            aiSupportedTypes.includes(document.mime_type)) {
            this.processDocumentWithAI(document).catch((err) => {
                console.error("Error procesando documento con IA:", err);
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
        console.log(`[DEBUG] getBuildingDocumentsByBuilding: buildingId=${buildingId}, category=${category}`);
        const { data, error } = await query;
        console.log(`[DEBUG] Supabase result: count=${data?.length || 0}, error=${error?.message || "none"}`);
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
            if (error.code === "PGRST116") {
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
        if (data.metadata !== undefined)
            updateData.metadata = data.metadata;
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
            expiration_date: dbDoc.expiration_date
                ? new Date(dbDoc.expiration_date).toISOString().split("T")[0]
                : null,
            uploaded_by: dbDoc.uploaded_by,
            uploaded_at: dbDoc.uploaded_at,
            created_at: dbDoc.created_at,
            updated_at: dbDoc.updated_at,
            metadata: dbDoc.metadata || {},
        };
    }
    async processDocumentWithAI(dbDoc) {
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
            console.error("No se pudo generar URL firmada para extracción con IA:", signedError);
            return;
        }
        // 2) Extraer metadatos con IA
        const aiService = this.getAIService();
        const metadata = await aiService.extractDocumentMetadata(signed.signedUrl, dbDoc.mime_type, dbDoc.category);
        if (!metadata || Object.keys(metadata).length === 0)
            return;
        // 3) Preparar datos de actualización
        const updateData = { metadata };
        // Si la IA detectó fecha de vencimiento, actualizar también expiration_date
        const aiExpiration = metadata.key_fields?.expiration_date;
        if (aiExpiration && /^\d{4}-\d{2}-\d{2}$/.test(aiExpiration)) {
            updateData.expiration_date = aiExpiration;
        }
        // 4) Actualizar fila en Supabase
        const { error: updateError } = await supabase
            .from("building_documents")
            .update(updateData)
            .eq("id", dbDoc.id);
        if (updateError) {
            console.error("Error actualizando metadatos en building_documents:", updateError);
        }
    }
}
exports.BuildingDocumentService = BuildingDocumentService;
//# sourceMappingURL=buildingDocumentService.js.map