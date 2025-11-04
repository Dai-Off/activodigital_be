import { Router } from 'express';
import { 
  signupController, 
  loginController, 
  meController, 
  logoutController,
  signupWithInvitationController,
  validateInvitationController,
  acceptAssignmentController,
  autoAcceptController,
  processPendingAssignmentsController,
  smartInvitationController,
  setup2FAController,
  verify2FASetupController,
  verify2FALoginController
} from '../web/controllers/authController';
import { requireAuth } from '../web/middlewares/authMiddleware';

const router = Router();

router.post('/signup', signupController);
router.post('/login', loginController);
router.get('/me', requireAuth, meController);
router.post('/logout', logoutController);

// Nuevos endpoints para invitaciones
router.post('/register-with-invitation', signupWithInvitationController);
router.get('/validate-invitation', validateInvitationController);
router.get('/invitation/:token', smartInvitationController); // Endpoint inteligente para manejar invitaciones
router.get('/accept-assignment', acceptAssignmentController); // Endpoint para aceptar asignaciones
router.get('/auto-accept', autoAcceptController); // Endpoint para auto-aceptar invitaciones
router.post('/process-pending-assignments', requireAuth, processPendingAssignmentsController); // Procesar asignaciones pendientes

// Endpoints para 2FA
router.post('/setup-2fa', setup2FAController);
router.post('/verify-2fa-setup', verify2FASetupController);
router.post('/verify-2fa-login', verify2FALoginController);

export default router;


