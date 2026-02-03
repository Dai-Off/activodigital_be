"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIInvoiceController = void 0;
const aiProcessingService_1 = require("../../domain/services/aiProcessingService");
class AIInvoiceController {
    constructor() {
        this.aiProcessingService = new aiProcessingService_1.AIProcessingService();
        this.extractInvoiceData = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ error: 'Usuario no autenticado' });
                    return;
                }
                if (!req.file) {
                    res.status(400).json({ error: 'No se ha proporcionado ningún archivo' });
                    return;
                }
                const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
                if (!allowedMimeTypes.includes(req.file.mimetype)) {
                    res.status(400).json({
                        error: 'Formato de archivo no soportado. Solo se aceptan imágenes (JPEG, PNG) y PDF.',
                        supportedFormats: allowedMimeTypes
                    });
                    return;
                }
                const extractedData = await this.aiProcessingService.extractInvoiceData(req.file.buffer);
                res.status(200).json({
                    success: true,
                    data: extractedData
                });
            }
            catch (error) {
                console.error('Error al extraer datos de factura:', error);
                res.status(500).json({
                    error: 'Error al procesar la factura',
                    details: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        };
    }
}
exports.AIInvoiceController = AIInvoiceController;
//# sourceMappingURL=aiInvoiceController.js.map