import { Router } from 'express';
import { authenticateToken } from '../web/middlewares/authMiddleware';
import {
  getUserProfile,
  updateUserProfile,
  getRoles,
  getTechnicians,
  assignTechnicianToBuilding,
  getTechnicianAssignments,
  getTechnicianBuildings
} from '../web/controllers/userController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de perfil de usuario
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// Rutas de roles
router.get('/roles', getRoles);

// Rutas para técnicos
router.get('/technicians', getTechnicians);
router.post('/assign-technician', assignTechnicianToBuilding);
router.get('/technician/assignments', getTechnicianAssignments);
router.get('/technician/buildings', getTechnicianBuildings);

export default router;
