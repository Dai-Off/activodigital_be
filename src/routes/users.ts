import { Router } from 'express';
import { authenticateToken } from '../web/middlewares/authMiddleware';
import {
  getUserProfile,
  updateUserProfile,
  getTechnicians,
  assignTechnicianToBuilding,
  getRoles,
  getAllUsers,
  createUser,
  editUser
} from '../web/controllers/userController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de roles de usuario
router.get('/roles', getRoles);
router.get('/all-users', getAllUsers);
router.post('/create', createUser);
router.put('/edit/:userId', editUser);

// Rutas de perfil de usuario
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// Rutas para gestión de técnicos (solo propietarios)
router.get('/technicians', getTechnicians);
router.post('/assign-technician', assignTechnicianToBuilding);

export default router;
