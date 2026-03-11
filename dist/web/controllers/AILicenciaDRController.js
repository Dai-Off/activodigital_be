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
exports.AILicenciaDRController = void 0;
const aiProcessingService_1 = require("../../domain/services/aiProcessingService");
class AILicenciaDRController {
    constructor() {
        this.aiProcessingService = new aiProcessingService_1.AIProcessingService();
        this.extractLicenciaDRData = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: "Usuario no autenticado" });
                    return;
                }
                if (!req.file) {
                    res.status(400).json({ error: "No se ha proporcionado ningún archivo" });
                    return;
                }
                if (req.file.mimetype !== "application/pdf") {
                    res.status(400).json({
                        error: "Formato de archivo no soportado. Debe ser un PDF.",
                        supportedFormats: ["application/pdf"],
                    });
                    return;
                }
                const pdfParse = (await Promise.resolve().then(() => __importStar(require("pdf-parse")))).default;
                const data = await pdfParse(req.file.buffer);
                const documentText = data?.text ?? "";
                if (!documentText) {
                    res.status(400).json({ error: "El documento PDF está vacío o protegido." });
                    return;
                }
                const extractedData = await this.aiProcessingService.extractLicenciaDRRequirements(documentText);
                res.status(200).json({ success: true, data: extractedData });
            }
            catch (error) {
                console.error("Error extractLicenciaDRData:", error);
                res.status(500).json({ error: "Error interno al extraer los requisitos" });
            }
        };
        this.extractLicenciaDRDoc = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: "Usuario no autenticado" });
                    return;
                }
                if (!req.file) {
                    res.status(400).json({ error: "No se ha proporcionado ningún archivo" });
                    return;
                }
                const requirementName = req.body.requirementName || "Requisito general";
                const pdfParse = (await Promise.resolve().then(() => __importStar(require("pdf-parse")))).default;
                const data = await pdfParse(req.file.buffer);
                const documentText = data?.text ?? "";
                if (!documentText) {
                    res.status(400).json({ error: "El documento está vacío o protegido." });
                    return;
                }
                const extractedData = await this.aiProcessingService.extractLicenciaDRDocData(documentText, requirementName);
                res.status(200).json({ success: true, data: extractedData });
            }
            catch (error) {
                console.error("Error extractLicenciaDRDoc:", error);
                res.status(500).json({ error: "Error interno al analizar el documento" });
            }
        };
        this.generateLicenciaDraft = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: "Usuario no autenticado" });
                    return;
                }
                const { buildingData, extractedData } = req.body;
                console.log(`[AILicenciaDRController] Generating draft. extractedData:`, JSON.stringify(extractedData));
                if (!buildingData) {
                    res.status(400).json({ error: "Faltan datos del edificio" });
                    return;
                }
                const pdfBuffer = await this.aiProcessingService.generateLicenciaDraft(buildingData, extractedData || {});
                res.setHeader("Content-Type", "application/pdf");
                res.setHeader("Content-Disposition", "attachment; filename=borrador_licencia_dr.pdf");
                res.setHeader("Content-Length", pdfBuffer.length.toString());
                res.status(200).send(pdfBuffer);
            }
            catch (error) {
                console.error("Error generateLicenciaDraft:", error);
                res.status(500).json({ error: "Error al generar el borrador en PDF" });
            }
        };
    }
}
exports.AILicenciaDRController = AILicenciaDRController;
//# sourceMappingURL=AILicenciaDRController.js.map