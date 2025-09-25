import { Router } from 'express';
import { InvitationController } from '../web/controllers/invitationController';
import { authenticateToken } from '../web/middlewares/authMiddleware';

const router = Router();
const invitationController = new InvitationController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Crear una nueva invitación
router.post('/', invitationController.createInvitation.bind(invitationController));

// Obtener invitaciones enviadas por el usuario autenticado
router.get('/', invitationController.getUserInvitations.bind(invitationController));

// Validar una invitación por token (público, sin autenticación)
router.get('/validate/:token', async (req, res) => {
  // Remover la autenticación para esta ruta específica
  const { token } = req.params;
  const invitationController = new InvitationController();
  
  try {
    if (!token) {
      return res.status(400).json({ error: 'Token de invitación requerido' });
    }

    const invitation = await invitationController.validateInvitation(req, res);
  } catch (error) {
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

export default router;
