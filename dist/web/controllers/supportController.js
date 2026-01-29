"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportController = void 0;
const emailService_1 = require("../../domain/services/emailService");
class SupportController {
    constructor() {
        this.emailService = new emailService_1.EmailService();
        /**
         * Crea un ticket de soporte enviando un email a soporte@empresa.com
         */
        this.createSupportTicket = async (req, res) => {
            try {
                const { subject, message, category, email, context } = req.body;
                // Validar campos requeridos
                if (!subject || !message || !category) {
                    res.status(400).json({
                        success: false,
                        error: "Faltan campos obligatorios: subject, message y category son requeridos",
                    });
                    return;
                }
                // Validar formato de email si se proporciona
                if (email) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(email)) {
                        res.status(400).json({
                            success: false,
                            error: "El formato del email no es válido",
                        });
                        return;
                    }
                }
                // Si el usuario está autenticado, usar su email si no se proporciona uno
                const userEmail = email || req.user?.email;
                // Enviar email de soporte
                const result = await this.emailService.sendSupportEmail(subject, message, category, userEmail, context);
                const response = {
                    success: true,
                    message: "Ticket de soporte enviado exitosamente",
                    emailId: result.emailId,
                };
                res.status(200).json(response);
            }
            catch (error) {
                console.error("Error al crear ticket de soporte:", error);
                res.status(500).json({
                    success: false,
                    error: "Error al crear ticket de soporte",
                    details: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
    }
}
exports.SupportController = SupportController;
//# sourceMappingURL=supportController.js.map