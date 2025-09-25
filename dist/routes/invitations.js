"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invitationController_1 = require("../web/controllers/invitationController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const router = (0, express_1.Router)();
const invitationController = new invitationController_1.InvitationController();
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.authenticateToken);
// Crear una nueva invitación
router.post('/', invitationController.createInvitation.bind(invitationController));
// Obtener invitaciones enviadas por el usuario autenticado
router.get('/', invitationController.getUserInvitations.bind(invitationController));
// Validar una invitación por token (público, sin autenticación)
router.get('/validate/:token', async (req, res) => {
    // Remover la autenticación para esta ruta específica
    const { token } = req.params;
    const invitationController = new invitationController_1.InvitationController();
    try {
        if (!token) {
            return res.status(400).json({ error: 'Token de invitación requerido' });
        }
        const invitation = await invitationController.validateInvitation(req, res);
    }
    catch (error) {
        console.error('Error validando invitación:', error);
        const message = error instanceof Error ? error.message : 'Error interno del servidor';
        res.status(500).json({ error: message });
    }
});
// Cancelar una invitación
router.delete('/:id', invitationController.cancelInvitation.bind(invitationController));
// Obtener asignaciones CFO para un edificio
router.get('/building/:buildingId/cfos', invitationController.getBuildingCfoAssignments.bind(invitationController));
// Obtener asignaciones CFO para el usuario autenticado
router.get('/my-cfo-assignments', invitationController.getMyCfoAssignments.bind(invitationController));
// Limpiar invitaciones expiradas (endpoint administrativo)
router.post('/cleanup', invitationController.cleanupExpiredInvitations.bind(invitationController));
exports.default = router;
//# sourceMappingURL=invitations.js.map