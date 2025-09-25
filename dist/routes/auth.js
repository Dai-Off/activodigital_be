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
router.get('/accept-assignment', authController_1.acceptAssignmentController); // Endpoint para aceptar asignaciones
router.get('/auto-accept', authController_1.autoAcceptController); // Endpoint para auto-aceptar invitaciones
router.post('/process-pending-assignments', authMiddleware_1.requireAuth, authController_1.processPendingAssignmentsController); // Procesar asignaciones pendientes
exports.default = router;
//# sourceMappingURL=auth.js.map