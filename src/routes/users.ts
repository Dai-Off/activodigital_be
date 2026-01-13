import { Router } from 'express';
import { requireAuth } from '../web/middlewares/authMiddleware';
import {
  getUserProfile,
  updateUserProfile,
  getTechnicians,
  assignTechnicianToBuilding,
  getRoles,
  getAllUsers,
  createUser,
  editUser,
  deleteUser
} from '../web/controllers/userController';

import { requestLogger } from '../web/middlewares/requestLogger';

const router = Router();


// Todas las rutas requieren autenticación
router.use(requireAuth);

// Logger middleware - loguea todas las peticiones a este router
router.use(requestLogger);

// Rutas de roles de usuario
router.get('/roles', getRoles);
router.get('/all-users', getAllUsers);
router.post('/create', createUser);
router.put('/edit/:userId', editUser);
router.delete('/delete/:userId', deleteUser);

// Rutas de perfil de usuario
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// Rutas para gestión de técnicos (solo propietarios)
router.get('/technicians', getTechnicians);
router.post('/assign-technician', assignTechnicianToBuilding);

export default router;
