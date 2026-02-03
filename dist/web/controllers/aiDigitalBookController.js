"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIDigitalBookController = void 0;
const pdf_parse_1 = require("pdf-parse");
const aiProcessingService_1 = require("../../domain/services/aiProcessingService");
const libroDigitalService_1 = require("../../domain/services/libroDigitalService");
const notificationService_1 = require("../../domain/services/notificationService");
const libroDigital_1 = require("../../types/libroDigital");
const TrazabilityService_1 = require("../../domain/trazability/TrazabilityService");
const interfaceTrazability_1 = require("../../domain/trazability/interfaceTrazability");
class AIDigitalBookController {
    constructor() {
        this.aiProcessingService = new aiProcessingService_1.AIProcessingService();
        this.digitalBookService = new libroDigitalService_1.DigitalBookService();
        this.notificationService = new notificationService_1.NotificationService();
        /**
         * Carga un documento, lo procesa con IA y crea el libro digital automáticamente
         */
        this.uploadAndProcessDocument = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: "Usuario no autenticado" });
                    return;
                }
                // Validar que se haya subido un archivo
                if (!req.file) {
                    res
                        .status(400)
                        .json({ error: "No se ha proporcionado ningún archivo" });
                    return;
                }
                // Obtener buildingId del body
                const { buildingId } = req.body;
                if (!buildingId) {
                    res.status(400).json({ error: "buildingId es requerido" });
                    return;
                }
                console.log("Procesando documento:", req.file.originalname);
                console.log("Para edificio:", buildingId);
                // Extraer texto del documento
                let documentText = "";
                try {
                    if (req.file.mimetype === "application/pdf") {
                        const dataBuffer = req.file.buffer;
                        const parser = new pdf_parse_1.PDFParse({ data: dataBuffer });
                        try {
                            const result = await parser.getText();
                            documentText = result.text ?? "";
                            await parser.destroy();
                        }
                        catch (pdfError) {
                            await parser.destroy().catch(() => { });
                            throw pdfError;
                        }
                        console.log(`PDF procesado: ${req.file.originalname}`);
                        console.log("Texto extraído:", documentText.length, "caracteres");
                    }
                    else if (req.file.mimetype === "text/plain") {
                        // Procesar archivo de texto
                        documentText = req.file.buffer.toString("utf-8");
                        console.log("Texto extraído del archivo:", documentText.length, "caracteres");
                    }
                    else {
                        res.status(400).json({
                            error: "Formato de archivo no soportado. Solo se aceptan PDF y archivos de texto.",
                            supportedFormats: ["application/pdf", "text/plain"],
                        });
                        return;
                    }
                }
                catch (error) {
                    console.error("Error al extraer texto del documento:", error);
                    res.status(500).json({ error: "Error al extraer texto del documento" });
                    return;
                }
                // Validar que se haya extraído texto suficiente para que la IA extraiga datos
                const trimmedLength = documentText.trim().length;
                if (!documentText || trimmedLength < 100) {
                    res.status(400).json({
                        error: trimmedLength === 0
                            ? "El PDF no contiene texto extraíble. Si es un documento escaneado (solo imágenes), conviértelo antes con OCR."
                            : "El documento no contiene suficiente texto para procesar (mínimo 100 caracteres).",
                        minLength: 100,
                        foundLength: trimmedLength,
                    });
                    return;
                }
                console.log("Procesando con IA...");
                // Procesar el texto con IA
                let sections;
                try {
                    sections = await this.aiProcessingService.processDocumentText(documentText);
                    console.log("Secciones generadas:", sections.length);
                    console.log("Primera sección:", JSON.stringify(sections[0], null, 2));
                }
                catch (error) {
                    console.error("Error al procesar con IA:", error);
                    res.status(500).json({
                        error: "Error al procesar el documento con IA",
                        details: error instanceof Error ? error.message : "Error desconocido",
                    });
                    return;
                }
                // Validar las secciones generadas
                if (!this.aiProcessingService.validateSections(sections)) {
                    res.status(500).json({
                        error: "Error en la validación de las secciones generadas",
                        sectionsCount: sections.length,
                    });
                    return;
                }
                console.log("Creando libro digital...");
                // Crear el libro digital con las secciones generadas
                try {
                    console.log("Secciones antes de crear libro:", JSON.stringify(sections, null, 2));
                    const book = await this.digitalBookService.createDigitalBook({
                        buildingId,
                        source: libroDigital_1.BookSource.PDF,
                        sections,
                    }, userId, true); // true = sobrescribir si existe
                    console.log("Libro digital creado exitosamente:", book.id);
                    console.log("Secciones del libro creado:", JSON.stringify(book.sections, null, 2));
                    // Extraer y guardar campos ambientales de la sección de sostenibilidad
                    const sustainabilitySection = sections.find((s) => s.type === "sustainability_and_esg");
                    if (sustainabilitySection && sustainabilitySection.content) {
                        console.log("Actualizando campos ambientales desde sección de sostenibilidad...");
                        try {
                            await this.digitalBookService.updateCamposAmbientalesFromSection(book.id, sustainabilitySection.content);
                            console.log("Campos ambientales actualizados correctamente");
                        }
                        catch (error) {
                            console.error("Error al actualizar campos ambientales:", error);
                        }
                    }
                    res.status(201).json({
                        data: book,
                        message: "Libro digital creado exitosamente mediante IA",
                        metadata: {
                            fileName: req.file.originalname,
                            fileSize: req.file.size,
                            mimeType: req.file.mimetype,
                            extractedTextLength: documentText.length,
                            sectionsGenerated: sections.length,
                        },
                    });
                }
                catch (error) {
                    console.error("Error al crear libro digital:", error);
                    if (error instanceof Error &&
                        error.message.includes("ya tiene un libro digital")) {
                        res.status(409).json({ error: error.message });
                    }
                    else if (error instanceof Error &&
                        error.message.includes("permisos")) {
                        res.status(403).json({ error: error.message });
                    }
                    else {
                        res.status(500).json({
                            error: "Error al crear el libro digital",
                            details: error instanceof Error ? error.message : "Error desconocido",
                        });
                    }
                    return;
                }
                TrazabilityService_1.trazabilityService.registerTrazability({ authUserId: userId, buildingId, action: interfaceTrazability_1.ActionsValues['CREAR'], module: interfaceTrazability_1.ModuleValues.EDIFICIOS, description: "Cargar libro digital (automáticamente)" }).catch(err => console.error("Fallo trazabilidad:", err));
            }
            catch (error) {
                console.error("Error general en uploadAndProcessDocument:", error);
                res.status(500).json({
                    error: "Error interno del servidor",
                    details: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
    }
}
exports.AIDigitalBookController = AIDigitalBookController;
//# sourceMappingURL=aiDigitalBookController.js.map