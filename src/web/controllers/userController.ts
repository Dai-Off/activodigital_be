import { Request, Response } from 'express';
import { UserService } from '../../domain/services/userService';
import { UserRole, AssignTechnicianRequest } from '../../types/user';

const userService = new UserService();

export const getUserProfile = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};


export const getTechnicians = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que el usuario sea propietario
    const user = await userService.getUserByAuthId(userId);
    if (!user || user.role.name !== UserRole.PROPIETARIO) {
      return res.status(403).json({ error: 'Solo los propietarios pueden ver técnicos' });
    }

    const technicians = await userService.getTechnicians();
    res.json(technicians);
  } catch (error) {
    console.error('Error al obtener técnicos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const assignTechnicianToBuilding = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que el usuario sea propietario
    const user = await userService.getUserByAuthId(userId);
    if (!user || user.role.name !== UserRole.PROPIETARIO) {
      return res.status(403).json({ error: 'Solo los propietarios pueden asignar técnicos' });
    }

    const { buildingId, technicianEmail }: AssignTechnicianRequest = req.body;

    if (!buildingId || !technicianEmail) {
      return res.status(400).json({ error: 'buildingId y technicianEmail son requeridos' });
    }

    // Verificar que el edificio pertenece al propietario
    const isOwner = await userService.isOwnerOfBuilding(userId, buildingId);
    if (!isOwner) {
      return res.status(403).json({ error: 'No eres propietario de este edificio' });
    }

    const assignment = await userService.assignTechnicianToBuilding(
      buildingId,
      technicianEmail,
      userId
    );

    res.json(assignment);
  } catch (error) {
    console.error('Error al asignar técnico:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    });
  }
};

