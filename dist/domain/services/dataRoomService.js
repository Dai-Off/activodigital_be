"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataRoomService = void 0;
const supabase_1 = require("../../lib/supabase");
const pdf_lib_1 = require("pdf-lib");
const BUCKET = "data-room-audit";
const UPLOADED_STATUSES = [
    "uploaded",
    "verified",
    "accepted",
    "acepted",
    "review",
];
class DataRoomService {
    getSupabase() {
        return (0, supabase_1.getSupabaseClient)();
    }
    async getAuditStatus(buildingId) {
        const { data, error } = await this.getSupabase()
            .from("data-room-audit")
            .select("*")
            .eq("building_id", buildingId);
        if (error) {
            console.error("Error al obtener auditoría del Data Room:", error);
            throw error;
        }
        return data || [];
    }
    async uploadAndRecord(buildingId, checklistId, file) {
        const supabase = this.getSupabase();
        const timestamp = Date.now();
        const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
        const storagePath = `${buildingId}/data-room/${checklistId}_${timestamp}_${sanitizedOriginalName}`;
        const { data: storageData, error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
        });
        if (uploadError) {
            console.error("Error subiendo archivo a Storage:", uploadError);
            throw uploadError;
        }
        const { data, error: auditError } = await supabase
            .from("data-room-audit")
            .upsert({
            building_id: buildingId,
            checklist_id: checklistId,
            file_name: file.originalname,
            storage_path: storagePath,
            status: "queued",
            uploaded_at: new Date().toISOString(),
        }, { onConflict: "building_id,checklist_id" })
            .select()
            .single();
        if (auditError) {
            console.error("Error registrando auditoría en DB:", auditError);
            throw auditError;
        }
        return data;
    }
    /**
     * Genera un PDF combinado con todos los documentos subidos para un edificio.
     * Soporta PDFs (merge directo) e imágenes PNG/JPG (embebidas en una página).
     */
    async generateDossier(buildingId) {
        const supabase = this.getSupabase();
        // 1. Obtener registros con storage_path
        const { data: records, error } = await supabase
            .from("data-room-audit")
            .select("checklist_id, file_name, storage_path, status")
            .eq("building_id", buildingId)
            .in("status", UPLOADED_STATUSES);
        if (error)
            throw error;
        if (!records || records.length === 0) {
            throw new Error("No hay documentos subidos para este edificio");
        }
        const mergedPdf = await pdf_lib_1.PDFDocument.create();
        for (const record of records) {
            if (!record.storage_path)
                continue;
            // 2. Descargar el archivo desde Storage
            const { data: fileData, error: downloadError } = await supabase.storage
                .from(BUCKET)
                .download(record.storage_path);
            if (downloadError || !fileData) {
                console.warn(`No se pudo descargar ${record.storage_path}:`, downloadError);
                continue;
            }
            const fileBuffer = Buffer.from(await fileData.arrayBuffer());
            const mimeType = fileData.type;
            try {
                if (mimeType === "application/pdf") {
                    // Merge PDF
                    const srcDoc = await pdf_lib_1.PDFDocument.load(fileBuffer);
                    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                }
                else if (mimeType === "image/png" ||
                    mimeType === "image/jpeg" ||
                    mimeType === "image/jpg") {
                    // Embeber imagen en una página A4
                    const page = mergedPdf.addPage([595, 842]); // A4 pts
                    const img = mimeType === "image/png"
                        ? await mergedPdf.embedPng(fileBuffer)
                        : await mergedPdf.embedJpg(fileBuffer);
                    const { width, height } = img.scaleToFit(555, 802);
                    page.drawImage(img, {
                        x: (595 - width) / 2,
                        y: (842 - height) / 2,
                        width,
                        height,
                    });
                }
                else {
                    // Tipo no soportado: agregar página de aviso
                    const page = mergedPdf.addPage([595, 842]);
                    page.drawText(`Documento: ${record.file_name ?? record.checklist_id}`, {
                        x: 50,
                        y: 420,
                        size: 14,
                    });
                    page.drawText(`(Tipo de archivo no soportado para previsualización: ${mimeType})`, {
                        x: 50,
                        y: 395,
                        size: 10,
                    });
                }
            }
            catch (embedErr) {
                console.warn(`Error procesando ${record.file_name}:`, embedErr);
            }
        }
        if (mergedPdf.getPageCount() === 0) {
            throw new Error("Ningún documento pudo procesarse para el dossier");
        }
        const pdfBytes = await mergedPdf.save();
        return Buffer.from(pdfBytes);
    }
    async updateAuditStatus(buildingId, checklistId, status) {
        const { error } = await this.getSupabase()
            .from("data-room-audit")
            .update({ status })
            .eq("building_id", buildingId)
            .eq("checklist_id", checklistId);
        if (error) {
            console.error("Error al actualizar estado de auditoría:", error);
            throw error;
        }
    }
}
exports.DataRoomService = DataRoomService;
//# sourceMappingURL=dataRoomService.js.map