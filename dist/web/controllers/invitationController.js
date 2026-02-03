"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationController = void 0;
const invitationService_1 = require("../../domain/services/invitationService");
const user_1 = require("../../types/user");
const TrazabilityService_1 = require("../../domain/trazability/TrazabilityService");
const interfaceTrazability_1 = require("../../domain/trazability/interfaceTrazability");
class InvitationController {
    constructor() {
        this.invitationService = new invitationService_1.InvitationService();
    }
    /**
     * Crear una nueva invitación
     * POST /api/invitations
     */
    async createInvitation(req, res) {
        try {
            const { email, role, buildingId } = req.body;
            const userAuthId = req.user?.id;
            if (!userAuthId) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }
            if (!email || !role || !buildingId) {
                res.status(400).json({ error: 'Email, rol y buildingId son requeridos' });
                return;
            }
            // Validar que el rol sea válido para invitaciones
            if (![user_1.UserRole.TECNICO, user_1.UserRole.CFO, user_1.UserRole.PROPIETARIO].includes(role)) {
                res.status(400).json({ error: 'Solo se pueden invitar técnicos, CFOs y propietarios' });
                return;
            }
            const invitation = await this.invitationService.createInvitation({
                email,
                role,
                buildingId
            }, userAuthId);
            TrazabilityService_1.trazabilityService.registerTrazability({ authUserId: req?.user?.id || null, buildingId, action: interfaceTrazability_1.ActionsValues['CREAR'], module: interfaceTrazability_1.ModuleValues.CALENDARIO, description: "Crear invitación" }).catch(err => console.error("Fallo trazabilidad:", err));
            res.status(201).json({
                success: true,
                message: 'Invitación enviada exitosamente',
                invitation: {
                    id: invitation.id,
                    email: invitation.email,
                    role: invitation.role?.name,
                    status: invitation.status,
                    expiresAt: invitation.expiresAt
                }
            });
        }
        catch (error) {
            console.error('Error en createInvitation:', error);
            const message = error instanceof Error ? error.message : 'Error interno del servidor';
            res.status(500).json({ error: message });
        }
    }
    /**
     * Obtener invitación por token (para validar antes del registro)
     * GET /api/invitations/validate/:token
     */
    async validateInvitation(req, res) {
        try {
            const { token } = req.params;
            if (!token) {
                res.status(400).json({ error: 'Token de invitación requerido' });
                return;
            }
            const invitation = await this.invitationService.getInvitationByToken(token);
            if (!invitation) {
                res.status(404).json({ error: 'Invitación no encontrada o expirada' });
                return;
            }
            if (invitation.status !== 'pending') {
                res.status(400).json({ error: 'Invitación ya fue utilizada o cancelada' });
                return;
            }
            // Verificar que no haya expirado
            const now = new Date();
            const expiresAt = new Date(invitation.expiresAt);
            if (now > expiresAt) {
                res.status(400).json({ error: 'Invitación expirada' });
                return;
            }
            res.json({
                success: true,
                invitation: {
                    id: invitation.id,
                    email: invitation.email,
                    role: invitation.role?.name,
                    building: invitation.building,
                    invitedBy: invitation.invitedByUser?.fullName,
                    expiresAt: invitation.expiresAt
                }
            });
        }
        catch (error) {
            console.error('Error en validateInvitation:', error);
            const message = error instanceof Error ? error.message : 'Error interno del servidor';
            res.status(500).json({ error: message });
        }
    }
    /**
     * Obtener invitaciones enviadas por el usuario autenticado
     * GET /api/invitations
     */
    async getUserInvitations(req, res) {
        try {
            const userAuthId = req.user?.id;
            if (!userAuthId) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }
            const invitations = await this.invitationService.getInvitationsByUser(userAuthId);
            res.json({
                success: true,
                invitations: invitations.map(invitation => ({
                    id: invitation.id,
                    email: invitation.email,
                    role: invitation.role?.name,
                    building: invitation.building,
                    status: invitation.status,
                    createdAt: invitation.createdAt,
                    expiresAt: invitation.expiresAt,
                    acceptedAt: invitation.acceptedAt
                }))
            });
        }
        catch (error) {
            console.error('Error en getUserInvitations:', error);
            const message = error instanceof Error ? error.message : 'Error interno del servidor';
            res.status(500).json({ error: message });
        }
    }
    /**
     * Cancelar una invitación
     * DELETE /api/invitations/:id
     */
    async cancelInvitation(req, res) {
        try {
            const { id } = req.params;
            const userAuthId = req.user?.id;
            if (!userAuthId) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }
            if (!id) {
                res.status(400).json({ error: 'ID de invitación requerido' });
                return;
            }
            await this.invitationService.cancelInvitation(id, userAuthId);
            TrazabilityService_1.trazabilityService.registerTrazability({ authUserId: userAuthId, buildingId: null, action: interfaceTrazability_1.ActionsValues['ELIMINAR'], module: interfaceTrazability_1.ModuleValues.CALENDARIO, description: "Cancelar invitación" }).catch(err => console.error("Fallo trazabilidad:", err));
            res.json({
                success: true,
                message: 'Invitación cancelada exitosamente'
            });
        }
        catch (error) {
            console.error('Error en cancelInvitation:', error);
            const message = error instanceof Error ? error.message : 'Error interno del servidor';
            res.status(500).json({ error: message });
        }
    }
    /**
     * Obtener asignaciones CFO para un edificio
     * GET /api/invitations/building/:buildingId/cfos
     */
    async getBuildingCfoAssignments(req, res) {
        try {
            const { buildingId } = req.params;
            const userAuthId = req.user?.id;
            if (!userAuthId) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }
            if (!buildingId) {
                res.status(400).json({ error: 'ID de edificio requerido' });
                return;
            }
            const assignments = await this.invitationService.getCfoAssignmentsForBuilding(buildingId);
            res.json({
                success: true,
                assignments: assignments.map(assignment => ({
                    id: assignment.id,
                    cfo: {
                        id: assignment.cfo?.id,
                        email: assignment.cfo?.email,
                        fullName: assignment.cfo?.fullName
                    },
                    assignedAt: assignment.assignedAt,
                    status: assignment.status
                }))
            });
        }
        catch (error) {
            console.error('Error en getBuildingCfoAssignments:', error);
            const message = error instanceof Error ? error.message : 'Error interno del servidor';
            res.status(500).json({ error: message });
        }
    }
    /**
     * Obtener asignaciones CFO para el usuario autenticado
     * GET /api/invitations/my-cfo-assignments
     */
    async getMyCfoAssignments(req, res) {
        try {
            const userAuthId = req.user?.id;
            if (!userAuthId) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }
            const assignments = await this.invitationService.getCfoAssignmentsForUser(userAuthId);
            res.json({
                success: true,
                assignments: assignments.map(assignment => ({
                    id: assignment.id,
                    buildingId: assignment.buildingId,
                    assignedAt: assignment.assignedAt,
                    status: assignment.status
                }))
            });
        }
        catch (error) {
            console.error('Error en getMyCfoAssignments:', error);
            const message = error instanceof Error ? error.message : 'Error interno del servidor';
            res.status(500).json({ error: message });
        }
    }
    /**
     * Limpiar invitaciones expiradas (endpoint administrativo)
     * POST /api/invitations/cleanup
     */
    async cleanupExpiredInvitations(req, res) {
        try {
            const userAuthId = req.user?.id;
            if (!userAuthId) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }
            // TODO: Verificar que el usuario sea administrador
            // const user = await this.userService.getUserByAuthId(userAuthId);
            // if (user?.role.name !== UserRole.ADMINISTRADOR) {
            //   res.status(403).json({ error: 'Acceso denegado' });
            //   return;
            // }
            const cleanedCount = await this.invitationService.cleanupExpiredInvitations();
            TrazabilityService_1.trazabilityService.registerTrazability({ authUserId: userAuthId, buildingId: null, action: interfaceTrazability_1.ActionsValues['ELIMINAR'], module: interfaceTrazability_1.ModuleValues.CALENDARIO, description: "Invitación marcada como expirada" }).catch(err => console.error("Fallo trazabilidad:", err));
            res.json({
                success: true,
                message: `${cleanedCount} invitaciones expiradas fueron marcadas como expiradas`
            });
        }
        catch (error) {
            console.error('Error en cleanupExpiredInvitations:', error);
            const message = error instanceof Error ? error.message : 'Error interno del servidor';
            res.status(500).json({ error: message });
        }
    }
}
exports.InvitationController = InvitationController;
//# sourceMappingURL=invitationController.js.map