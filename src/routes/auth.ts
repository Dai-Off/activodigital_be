import { Router } from 'express';
import { signupController, loginController, meController, logoutController } from '../web/controllers/authController';
import { requireAuth } from '../web/middlewares/authMiddleware';

const router = Router();

router.post('/signup', signupController);
router.post('/login', loginController);
router.get('/me', requireAuth, meController);
router.post('/logout', logoutController);

export default router;


