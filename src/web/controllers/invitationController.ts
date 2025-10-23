import { Request, Response } from 'express';
import { InvitationService } from '../../domain/services/invitationService';
import { 
  CreateInvitationRequest, 
  AcceptInvitationRequest,
  UserRole 
} from '../../types/user';

export class InvitationController {
  private invitationService = new InvitationService();

  /**
   * Crear una nueva invitación
   * POST /api/invitations
   */
  async createInvitation(req: Request, res: Response): Promise<void> {
    try {
      const { email, role, buildingId } = req.body as CreateInvitationRequest;
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
      if (![UserRole.TECNICO, UserRole.CFO, UserRole.PROPIETARIO].includes(role)) {
        res.status(400).json({ error: 'Solo se pueden invitar técnicos, CFOs y propietarios' });
        return;
      }

      const invitation = await this.invitationService.createInvitation({
        email,
        role,
        buildingId
      }, userAuthId);

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
    } catch (error) {
      console.error('Error en createInvitation:', error);
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      res.status(500).json({ error: message });
    }
  }

  /**
   * Obtener invitación por token (para validar antes del registro)
   * GET /api/invitations/validate/:token
   */
  async validateInvitation(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      console.error('Error en validateInvitation:', error);
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      res.status(500).json({ error: message });
    }
  }

  /**
   * Obtener invitaciones enviadas por el usuario autenticado
   * GET /api/invitations
   */
  async getUserInvitations(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      console.error('Error en getUserInvitations:', error);
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      res.status(500).json({ error: message });
    }
  }

  /**
   * Cancelar una invitación
   * DELETE /api/invitations/:id
   */
  async cancelInvitation(req: Request, res: Response): Promise<void> {
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

      res.json({
        success: true,
        message: 'Invitación cancelada exitosamente'
      });
    } catch (error) {
      console.error('Error en cancelInvitation:', error);
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      res.status(500).json({ error: message });
    }
  }

  /**
   * Obtener asignaciones CFO para un edificio
   * GET /api/invitations/building/:buildingId/cfos
   */
  async getBuildingCfoAssignments(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      console.error('Error en getBuildingCfoAssignments:', error);
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      res.status(500).json({ error: message });
    }
  }

  /**
   * Obtener asignaciones CFO para el usuario autenticado
   * GET /api/invitations/my-cfo-assignments
   */
  async getMyCfoAssignments(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      console.error('Error en getMyCfoAssignments:', error);
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      res.status(500).json({ error: message });
    }
  }

  /**
   * Limpiar invitaciones expiradas (endpoint administrativo)
   * POST /api/invitations/cleanup
   */
  async cleanupExpiredInvitations(req: Request, res: Response): Promise<void> {
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

      res.json({
        success: true,
        message: `${cleanedCount} invitaciones expiradas fueron marcadas como expiradas`
      });
    } catch (error) {
      console.error('Error en cleanupExpiredInvitations:', error);
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      res.status(500).json({ error: message });
    }
  }
}
