"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../web/controllers/authController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post('/signup', authController_1.signupController);
router.post('/login', authController_1.loginController);
router.get('/me', authMiddleware_1.requireAuth, authController_1.meController);
router.post('/logout', authController_1.logoutController);
// Nuevos endpoints para invitaciones
router.post('/register-with-invitation', authController_1.signupWithInvitationController);
router.get('/validate-invitation', authController_1.validateInvitationController);
router.get('/invitation/:token', authController_1.smartInvitationController); // Endpoint inteligente para manejar invitaciones
router.get('/accept-assignment', authController_1.acceptAssignmentController); // Endpoint para aceptar asignaciones
router.get('/auto-accept', authController_1.autoAcceptController); // Endpoint para auto-aceptar invitaciones
router.post('/process-pending-assignments', authMiddleware_1.requireAuth, authController_1.processPendingAssignmentsController); // Procesar asignaciones pendientes
// Endpoints para 2FA
router.post('/setup-2fa', authController_1.setup2FAController);
router.post('/verify-2fa-setup', authController_1.verify2FASetupController);
router.post('/verify-2fa-login', authController_1.verify2FALoginController);
exports.default = router;
//# sourceMappingURL=auth.js.map