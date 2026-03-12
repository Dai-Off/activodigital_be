"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIMemoriaController = void 0;
const aiProcessingService_1 = require("../../domain/services/aiProcessingService");
class AIMemoriaController {
    constructor() {
        this.aiProcessingService = new aiProcessingService_1.AIProcessingService();
        /**
         * Extrae datos de la Memoria de Calidades y devuelve el resultado.
         */
        this.extractMemoriaData = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: "Usuario no autenticado" });
                    return;
                }
                if (!req.file) {
                    res
                        .status(400)
                        .json({ error: "No se ha proporcionado ningún archivo" });
                    return;
                }
                if (req.file.mimetype !== "application/pdf") {
                    res.status(400).json({
                        error: "Formato de archivo no soportado. Para la Memoria de Calidades solo se acepta PDF.",
                        supportedFormats: ["application/pdf"],
                    });
                    return;
                }
                // 1) Extraer texto del PDF
                const pdfParse = (await Promise.resolve().then(() => __importStar(require("pdf-parse")))).default;
                const data = await pdfParse(req.file.buffer);
                const documentText = data?.text ?? "";
                if (!documentText || documentText.trim().length < 100) {
                    res.status(400).json({
                        error: "El documento no contiene suficiente texto extraíble para ser analizado.",
                    });
                    return;
                }
                // 2) Procesar con IA
                const extractedData = await this.aiProcessingService.extractMemoriaCalidadesData(documentText);
                res.status(200).json({
                    success: true,
                    data: extractedData,
                });
            }
            catch (error) {
                console.error("Error al extraer datos de memoria de calidades:", error);
                res.status(500).json({
                    error: "Error al procesar la memoria de calidades",
                    details: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
    }
}
exports.AIMemoriaController = AIMemoriaController;
//# sourceMappingURL=aiMemoriaController.js.map