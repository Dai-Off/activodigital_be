"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTechnicianBuildings = exports.getTechnicianAssignments = exports.assignTechnicianToBuilding = exports.getTechnicians = exports.getRoles = exports.updateUserProfile = exports.getUserProfile = void 0;
const userService_1 = require("../../domain/services/userService");
const user_1 = require("../../types/user");
const userService = new userService_1.UserService();
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        const user = await userService.getUserByAuthId(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getUserProfile = getUserProfile;
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        const { fullName } = req.body;
        const user = await userService.getUserByAuthId(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const updatedUser = await userService.updateUser(user.id, { fullName });
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.updateUserProfile = updateUserProfile;
const getRoles = async (req, res) => {
    try {
        const roles = await userService.getRoles();
        res.json(roles);
    }
    catch (error) {
        console.error('Error al obtener roles:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getRoles = getRoles;
const getTechnicians = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        // Verificar que el usuario sea tenedor
        const user = await userService.getUserByAuthId(userId);
        if (!user || user.role.name !== user_1.UserRole.TENEDOR) {
            return res.status(403).json({ error: 'Solo los tenedores pueden ver técnicos' });
        }
        const technicians = await userService.getTechnicians();
        res.json(technicians);
    }
    catch (error) {
        console.error('Error al obtener técnicos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getTechnicians = getTechnicians;
const assignTechnicianToBuilding = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        // Verificar que el usuario sea tenedor
        const user = await userService.getUserByAuthId(userId);
        if (!user || user.role.name !== user_1.UserRole.TENEDOR) {
            return res.status(403).json({ error: 'Solo los tenedores pueden asignar técnicos' });
        }
        const { buildingId, technicianEmail } = req.body;
        if (!buildingId || !technicianEmail) {
            return res.status(400).json({ error: 'buildingId y technicianEmail son requeridos' });
        }
        // Verificar que el edificio pertenece al tenedor
        const isOwner = await userService.isOwnerOfBuilding(userId, buildingId);
        if (!isOwner) {
            return res.status(403).json({ error: 'No eres propietario de este edificio' });
        }
        const assignment = await userService.assignTechnicianToBuilding(buildingId, technicianEmail, userId);
        res.json(assignment);
    }
    catch (error) {
        console.error('Error al asignar técnico:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
};
exports.assignTechnicianToBuilding = assignTechnicianToBuilding;
const getTechnicianAssignments = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        // Verificar que el usuario sea técnico
        const user = await userService.getUserByAuthId(userId);
        if (!user || user.role.name !== user_1.UserRole.TECNICO) {
            return res.status(403).json({ error: 'Solo los técnicos pueden ver sus asignaciones' });
        }
        const assignments = await userService.getTechnicianAssignments(userId);
        res.json(assignments);
    }
    catch (error) {
        console.error('Error al obtener asignaciones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getTechnicianAssignments = getTechnicianAssignments;
const getTechnicianBuildings = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        // Verificar que el usuario sea técnico
        const user = await userService.getUserByAuthId(userId);
        if (!user || user.role.name !== user_1.UserRole.TECNICO) {
            return res.status(403).json({ error: 'Solo los técnicos pueden ver edificios asignados' });
        }
        const buildingIds = await userService.getTechnicianBuildings(userId);
        res.json(buildingIds);
    }
    catch (error) {
        console.error('Error al obtener edificios asignados:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getTechnicianBuildings = getTechnicianBuildings;
//# sourceMappingURL=userController.js.map