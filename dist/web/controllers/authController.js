"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPendingAssignmentsController = exports.smartInvitationController = exports.validateInvitationController = exports.acceptAssignmentController = exports.autoAcceptController = exports.signupWithInvitationController = exports.logoutController = exports.meController = exports.loginController = exports.signupController = void 0;
const authService_1 = require("../../domain/services/authService");
const userService_1 = require("../../domain/services/userService");
const edificioService_1 = require("../../domain/services/edificioService");
const user_1 = require("../../types/user");
const signupController = async (req, res) => {
    try {
        const { email, password, full_name } = req.body ?? {};
        // Validar campos requeridos
        if (!email || !password) {
            return res.status(400).json({
                error: 'email and password are required'
            });
        }
        // Forzar rol por defecto a propietario (con compatibilidad en servicio)
        const forcedRole = user_1.UserRole.PROPIETARIO;
        const result = await (0, authService_1.signUpUser)({
            email,
            password,
            fullName: full_name,
            role: forcedRole
        });
        return res.status(201).json(result);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};
exports.signupController = signupController;
const loginController = async (req, res) => {
    try {
        const { email, password } = req.body ?? {};
        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }
        const result = await (0, authService_1.signInUser)({ email, password });
        return res.status(200).json(result);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(401).json({ error: message });
    }
};
exports.loginController = loginController;
const meController = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'unauthorized' });
        const profile = await (0, authService_1.getProfileByUserId)(userId);
        return res.status(200).json(profile);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};
exports.meController = meController;
const logoutController = async (_req, res) => {
    // Backend stateless: el frontend debe borrar tokens. Devolvemos 200 para UX simple.
    return res.status(200).json({ ok: true });
};
exports.logoutController = logoutController;
/**
 * Registro con invitación
 * POST /api/auth/register-with-invitation
 */
const signupWithInvitationController = async (req, res) => {
    try {
        const { email, password, full_name, invitation_token } = req.body ?? {};
        // Validar campos requeridos
        if (!email || !password || !invitation_token) {
            return res.status(400).json({
                error: 'email, password e invitation_token son requeridos'
            });
        }
        // Decodificar el token si viene URL-encoded
        const decodedToken = decodeURIComponent(invitation_token);
        console.log('Token de registro original:', invitation_token);
        console.log('Token de registro decodificado:', decodedToken);
        // Primero validar la invitación
        const invitation = await (0, authService_1.validateInvitation)(decodedToken);
        if (!invitation) {
            return res.status(400).json({
                error: 'Invitación no válida o expirada'
            });
        }
        // Verificar que el email coincida con la invitación
        if (invitation.email !== email) {
            return res.status(400).json({
                error: 'El email debe coincidir con la invitación'
            });
        }
        // Determinar el rol basado en la invitación
        const role = invitation.role?.name === 'tecnico' ? user_1.UserRole.TECNICO : user_1.UserRole.CFO;
        const result = await (0, authService_1.signUpUserWithInvitation)({
            email,
            password,
            fullName: full_name,
            role,
            invitationToken: decodedToken
        });
        // Transformar la respuesta para que coincida con lo que espera el frontend
        return res.status(201).json({
            access_token: result.access_token,
            user: {
                id: result.user.id,
                email: result.user.email,
                fullName: result.userProfile.fullName,
                role: {
                    name: result.userProfile.role?.name ?? null
                }
            }
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};
exports.signupWithInvitationController = signupWithInvitationController;
/**
 * Validar invitación
 * GET /api/auth/validate-invitation/:token
 */
const autoAcceptController = async (req, res) => {
    try {
        const { email, building } = req.query;
        if (!email || !building) {
            return res.status(400).json({ error: 'Email y building requeridos' });
        }
        const decodedEmail = decodeURIComponent(email);
        const buildingId = building;
        // Verificar que el usuario existe
        const userService = new userService_1.UserService();
        const user = await userService.getUserByEmail(decodedEmail);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        // Verificar que el edificio existe
        const buildingService = new edificioService_1.BuildingService();
        const buildingData = await buildingService.getBuildingById(buildingId);
        if (!buildingData) {
            return res.status(404).json({ error: 'Edificio no encontrado' });
        }
        // Verificar si ya tiene acceso al edificio
        const hasAccess = await buildingService.userHasAccessToBuilding(user.userId, buildingId);
        if (hasAccess) {
            return res.status(200).json({
                success: true,
                message: 'Ya tienes acceso a este edificio',
                redirect: '/activos',
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role?.name
                },
                building: {
                    id: buildingData.id,
                    name: buildingData.name,
                    address: buildingData.address
                }
            });
        }
        // Solo validar y retornar información para que el usuario vaya al login
        return res.status(200).json({
            success: true,
            message: 'Invitación válida. Por favor, inicia sesión para completar la asignación.',
            redirect: '/login',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role?.name
            },
            building: {
                id: buildingData.id,
                name: buildingData.name,
                address: buildingData.address
            }
        });
    }
    catch (error) {
        console.error('Error en autoAcceptController:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.autoAcceptController = autoAcceptController;
const acceptAssignmentController = async (req, res) => {
    try {
        const { email, building } = req.query;
        if (!email || !building) {
            return res.status(400).json({ error: 'Email y building requeridos' });
        }
        const decodedEmail = decodeURIComponent(email);
        const buildingId = building;
        // Verificar que el usuario existe
        const userService = new userService_1.UserService();
        const user = await userService.getUserByEmail(decodedEmail);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        // Verificar que el edificio existe
        const buildingService = new edificioService_1.BuildingService();
        const buildingData = await buildingService.getBuildingById(buildingId);
        if (!buildingData) {
            return res.status(404).json({ error: 'Edificio no encontrado' });
        }
        // Verificar si ya tiene acceso al edificio
        const hasAccess = await buildingService.userHasAccessToBuilding(user.userId, buildingId);
        if (hasAccess) {
            return res.status(200).json({
                success: true,
                message: 'Ya tienes acceso a este edificio',
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role?.name
                },
                building: {
                    id: buildingData.id,
                    name: buildingData.name,
                    address: buildingData.address
                }
            });
        }
        // Retornar información para que el frontend muestre la página de aceptación
        return res.status(200).json({
            success: true,
            message: 'Asignación pendiente de aceptación',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role?.name
            },
            building: {
                id: buildingData.id,
                name: buildingData.name,
                address: buildingData.address
            }
        });
    }
    catch (error) {
        console.error('Error en acceptAssignmentController:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.acceptAssignmentController = acceptAssignmentController;
const validateInvitationController = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            return res.status(400).json({
                error: 'Token de invitación requerido'
            });
        }
        // Decodificar el token que viene URL-encoded
        const decodedToken = decodeURIComponent(token);
        console.log('Token original:', token);
        console.log('Token decodificado:', decodedToken);
        const invitation = await (0, authService_1.validateInvitation)(decodedToken);
        if (!invitation) {
            return res.status(404).json({
                error: 'Invitación no encontrada o expirada'
            });
        }
        if (invitation.status !== 'pending') {
            return res.status(400).json({
                error: 'Invitación ya fue utilizada o cancelada'
            });
        }
        // Verificar que no haya expirado
        const now = new Date();
        const expiresAt = new Date(invitation.expiresAt);
        if (now > expiresAt) {
            return res.status(400).json({
                error: 'Invitación expirada'
            });
        }
        return res.status(200).json({
            success: true,
            invitation: {
                id: invitation.id,
                email: invitation.email,
                role: invitation.role?.name,
                buildingId: invitation.building?.id,
                buildingName: invitation.building?.name,
                invitedBy: invitation.invitedByUser?.fullName,
                expiresAt: invitation.expiresAt
            }
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};
exports.validateInvitationController = validateInvitationController;
/**
 * Endpoint inteligente para manejar invitaciones - determina si redirigir a login o register
 * GET /api/auth/invitation/:token
 */
const smartInvitationController = async (req, res) => {
    try {
        const { token } = req.params;
        if (!token) {
            return res.status(400).json({ error: 'Token de invitación requerido' });
        }
        // Decodificar el token que viene URL-encoded
        const decodedToken = decodeURIComponent(token);
        console.log('Token de invitación recibido:', decodedToken);
        // Validar la invitación
        const invitation = await (0, authService_1.validateInvitation)(decodedToken);
        if (!invitation) {
            return res.status(404).json({
                error: 'Invitación no encontrada o expirada'
            });
        }
        if (invitation.status !== 'pending') {
            return res.status(400).json({
                error: 'Invitación ya fue utilizada o cancelada'
            });
        }
        // Verificar que no haya expirado
        const now = new Date();
        const expiresAt = new Date(invitation.expiresAt);
        if (now > expiresAt) {
            return res.status(400).json({
                error: 'Invitación expirada'
            });
        }
        // Verificar si el usuario ya existe
        const userService = new userService_1.UserService();
        const existingUser = await userService.getUserByEmail(invitation.email);
        if (existingUser) {
            // Usuario existe - redirigir a login con información de la invitación
            return res.status(200).json({
                success: true,
                userExists: true,
                redirect: '/login',
                message: 'Usuario encontrado. Por favor, inicia sesión para completar la invitación.',
                invitation: {
                    id: invitation.id,
                    email: invitation.email,
                    role: invitation.role?.name,
                    buildingId: invitation.building?.id,
                    buildingName: invitation.building?.name,
                    invitedBy: invitation.invitedByUser?.fullName,
                    expiresAt: invitation.expiresAt
                }
            });
        }
        else {
            // Usuario no existe - redirigir a registro con información de la invitación
            return res.status(200).json({
                success: true,
                userExists: false,
                redirect: '/register',
                message: 'Por favor, regístrate para completar la invitación.',
                invitation: {
                    id: invitation.id,
                    email: invitation.email,
                    role: invitation.role?.name,
                    buildingId: invitation.building?.id,
                    buildingName: invitation.building?.name,
                    invitedBy: invitation.invitedByUser?.fullName,
                    expiresAt: invitation.expiresAt
                }
            });
        }
    }
    catch (error) {
        console.error('Error en smartInvitationController:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.smartInvitationController = smartInvitationController;
/**
 * Procesar asignaciones pendientes después del login
 * POST /api/auth/process-pending-assignments
 */
const processPendingAssignmentsController = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        const { email, buildingId } = req.body;
        if (!email || !buildingId) {
            return res.status(400).json({ error: 'Email y buildingId requeridos' });
        }
        // Verificar que el usuario existe y obtener su información
        const userService = new userService_1.UserService();
        const user = await userService.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        // Verificar que el edificio existe
        const buildingService = new edificioService_1.BuildingService();
        const buildingData = await buildingService.getBuildingById(buildingId);
        if (!buildingData) {
            return res.status(404).json({ error: 'Edificio no encontrado' });
        }
        // Verificar si ya tiene acceso al edificio
        const hasAccess = await buildingService.userHasAccessToBuilding(user.userId, buildingId);
        if (hasAccess) {
            return res.status(200).json({
                success: true,
                message: 'Ya tienes acceso a este edificio',
                building: {
                    id: buildingData.id,
                    name: buildingData.name,
                    address: buildingData.address
                }
            });
        }
        // Procesar la asignación
        try {
            // Obtener información completa del edificio incluyendo el propietario
            const { getSupabaseClient } = await Promise.resolve().then(() => __importStar(require('../../lib/supabase')));
            const supabase = getSupabaseClient();
            const { data: buildingWithOwner, error: buildingError } = await supabase
                .from('buildings')
                .select(`
          id,
          owner_id,
          owner:users!owner_id(
            id,
            user_id,
            email,
            full_name
          )
        `)
                .eq('id', buildingId)
                .single();
            if (buildingError || !buildingWithOwner) {
                throw new Error('No se pudo obtener información del edificio');
            }
            const buildingOwner = buildingWithOwner.owner;
            if (!buildingOwner || !Array.isArray(buildingOwner) || buildingOwner.length === 0) {
                throw new Error('No se pudo determinar el propietario del edificio');
            }
            const owner = buildingOwner[0]; // Tomar el primer (y único) propietario
            // Crear una asignación directa para el usuario existente
            if (user.role?.name === 'tecnico') {
                // Para técnicos, crear la relación building-technician
                await buildingService.assignTechnicianToBuilding(buildingId, user.userId, owner.user_id);
            }
            else if (user.role?.name === 'cfo') {
                // Para CFOs, crear la asignación CFO
                await buildingService.assignCfoToBuilding(buildingId, user.id, owner.user_id);
            }
            return res.status(200).json({
                success: true,
                message: 'Asignación procesada exitosamente',
                building: {
                    id: buildingData.id,
                    name: buildingData.name,
                    address: buildingData.address
                }
            });
        }
        catch (assignmentError) {
            console.error('Error al procesar asignación:', assignmentError);
            return res.status(500).json({
                error: 'Error al procesar la asignación',
                message: assignmentError instanceof Error ? assignmentError.message : 'Error desconocido'
            });
        }
    }
    catch (error) {
        console.error('Error en processPendingAssignmentsController:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.processPendingAssignmentsController = processPendingAssignmentsController;
//# sourceMappingURL=authController.js.map