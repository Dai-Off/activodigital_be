"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const userController_1 = require("../web/controllers/userController");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.authenticateToken);
// Rutas de roles de usuario
router.get('/roles', userController_1.getRoles);
router.get('/all-users', userController_1.getAllUsers);
router.post('/create', userController_1.createUser);
router.put('/edit/:userId', userController_1.editUser);
// Rutas de perfil de usuario
router.get('/profile', userController_1.getUserProfile);
router.put('/profile', userController_1.updateUserProfile);
// Rutas para gestión de técnicos (solo propietarios)
router.get('/technicians', userController_1.getTechnicians);
router.post('/assign-technician', userController_1.assignTechnicianToBuilding);
exports.default = router;
//# sourceMappingURL=users.js.map