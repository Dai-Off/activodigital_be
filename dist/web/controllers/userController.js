"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editUser = exports.createUser = exports.assignTechnicianToBuilding = exports.getTechnicians = exports.updateUserProfile = exports.getAllUsers = exports.getRoles = exports.getUserProfile = void 0;
const userService_1 = require("../../domain/services/userService");
const userService = new userService_1.UserService();
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Usuario no autenticado" });
        }
        const user = await userService.getUserByAuthId(userId);
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        res.json(user);
    }
    catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.getUserProfile = getUserProfile;
const getRoles = async (req, res) => {
    try {
        const roles = await userService.getRoles();
        if (!roles) {
            return res.status(404).json({ error: "Rol no encontrado" });
        }
        res.json(roles);
    }
    catch (error) {
        console.error("Error al obtener rol:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.getRoles = getRoles;
const getAllUsers = async (req, res) => {
    try {
        const usuarios = await userService.getAllUsersService();
        res.json(usuarios);
    }
    catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.getAllUsers = getAllUsers;
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Usuario no autenticado" });
        }
        const { fullName } = req.body;
        const user = await userService.getUserByAuthId(userId);
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        const updatedUser = await userService.updateUser(user.id, { fullName });
        res.json(updatedUser);
    }
    catch (error) {
        console.error("Error al actualizar perfil:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.updateUserProfile = updateUserProfile;
const getTechnicians = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Usuario no autenticado" });
        }
        // Todos los usuarios pueden ver técnicos
        const technicians = await userService.getTechnicians();
        res.json(technicians);
    }
    catch (error) {
        console.error("Error al obtener técnicos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.getTechnicians = getTechnicians;
const assignTechnicianToBuilding = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Usuario no autenticado" });
        }
        // Todos los usuarios pueden asignar técnicos a cualquier edificio
        const { buildingId, technicianEmail } = req.body;
        if (!buildingId || !technicianEmail) {
            return res
                .status(400)
                .json({ error: "buildingId y technicianEmail son requeridos" });
        }
        const assignment = await userService.assignTechnicianToBuilding(buildingId, technicianEmail, userId);
        res.json(assignment);
    }
    catch (error) {
        console.error("Error al asignar técnico:", error);
        res.status(500).json({
            error: error instanceof Error ? error.message : "Error interno del servidor",
        });
    }
};
exports.assignTechnicianToBuilding = assignTechnicianToBuilding;
const createUser = async (req, res) => {
    try {
        const { email, role, fullName } = req.body;
        if (!email || !role || !fullName) {
            return res
                .status(400)
                .json({ error: "email, fullname y  role son requeridos" });
        }
        const usuario = await userService.createUser({ ...req.body, userId: req?.user?.id });
        res.status(201).json({ message: 'Usuario creado correctamente', usuario });
    }
    catch (error) {
        console.error("Error al crear usuario:", error);
        res
            .status(error.status || 500)
            .json({ error: error.message || "Error interno del servidor" });
    }
};
exports.createUser = createUser;
const editUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId) {
            return res.status(400).json({ error: "userId requerido en parámetro" });
        }
        const { fullName, roleId, email } = req.body;
        const usuario = await userService.editUser(userId, {
            fullName,
            roleId,
            email,
        });
        res.status(200).json({ message: "Usuario editado correctamente", usuario });
    }
    catch (error) {
        console.error("Error al editar usuario:", error);
        res
            .status(error.status || 500)
            .json({ error: error.message || "Error interno del servidor" });
    }
};
exports.editUser = editUser;
//# sourceMappingURL=userController.js.map