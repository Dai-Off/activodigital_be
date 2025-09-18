"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const supabase_1 = require("../../lib/supabase");
const user_1 = require("../../types/user");
class UserService {
    getSupabase() {
        return (0, supabase_1.getSupabaseClient)();
    }
    // Obtener usuario por ID de auth
    async getUserByAuthId(authUserId) {
        const { data, error } = await this.getSupabase()
            .from('users')
            .select(`
        *,
        role:roles(*)
      `)
            .eq('user_id', authUserId)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return null; // No encontrado
            }
            throw new Error(`Error al obtener usuario: ${error.message}`);
        }
        return this.mapToUserWithRole(data);
    }
    // Obtener usuario por email
    async getUserByEmail(email) {
        const { data, error } = await this.getSupabase()
            .from('users')
            .select(`
        *,
        role:roles(*)
      `)
            .eq('email', email)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return null; // No encontrado
            }
            throw new Error(`Error al obtener usuario: ${error.message}`);
        }
        return this.mapToUserWithRole(data);
    }
    // Obtener todos los roles
    async getRoles() {
        const { data, error } = await this.getSupabase()
            .from('roles')
            .select('*')
            .order('name');
        if (error) {
            throw new Error(`Error al obtener roles: ${error.message}`);
        }
        return data.map(this.mapToRole);
    }
    // Obtener rol por nombre
    async getRoleByName(name) {
        const { data, error } = await this.getSupabase()
            .from('roles')
            .select('*')
            .eq('name', name)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Error al obtener rol: ${error.message}`);
        }
        return this.mapToRole(data);
    }
    // Crear usuario en la tabla users (después de crear en auth)
    async createUserProfile(authUserId, userData) {
        // Obtener el rol
        const role = await this.getRoleByName(userData.role);
        if (!role) {
            throw new Error(`Rol '${userData.role}' no encontrado`);
        }
        const userProfileData = {
            user_id: authUserId,
            email: userData.email,
            full_name: userData.fullName || null,
            role_id: role.id
        };
        const { data, error } = await this.getSupabase()
            .from('users')
            .insert(userProfileData)
            .select()
            .single();
        if (error) {
            throw new Error(`Error al crear perfil de usuario: ${error.message}`);
        }
        return this.mapToUser(data);
    }
    // Actualizar usuario
    async updateUser(userId, updateData) {
        const { data, error } = await this.getSupabase()
            .from('users')
            .update({
            full_name: updateData.fullName,
            role_id: updateData.roleId
        })
            .eq('id', userId)
            .select()
            .single();
        if (error) {
            throw new Error(`Error al actualizar usuario: ${error.message}`);
        }
        return this.mapToUser(data);
    }
    // Obtener técnicos disponibles
    async getTechnicians() {
        const { data, error } = await this.getSupabase()
            .from('users')
            .select(`
        *,
        role:roles(*)
      `)
            .eq('roles.name', user_1.UserRole.TECNICO);
        if (error) {
            throw new Error(`Error al obtener técnicos: ${error.message}`);
        }
        return data.map(this.mapToUserWithRole);
    }
    // Asignar técnico a edificio
    async assignTechnicianToBuilding(buildingId, technicianEmail, assignedByUserId) {
        // Buscar el técnico por email
        const technician = await this.getUserByEmail(technicianEmail);
        if (!technician) {
            throw new Error('Técnico no encontrado');
        }
        if (technician.role.name !== user_1.UserRole.TECNICO) {
            throw new Error('El usuario especificado no es un técnico');
        }
        // Obtener el usuario que asigna
        const assignedByUser = await this.getUserByAuthId(assignedByUserId);
        if (!assignedByUser) {
            throw new Error('Usuario asignador no encontrado');
        }
        const assignmentData = {
            building_id: buildingId,
            technician_id: technician.id,
            assigned_by: assignedByUser.id,
            status: 'active'
        };
        const { data, error } = await this.getSupabase()
            .from('building_technician_assignments')
            .insert(assignmentData)
            .select()
            .single();
        if (error) {
            throw new Error(`Error al asignar técnico: ${error.message}`);
        }
        return this.mapToAssignment(data);
    }
    // Obtener asignaciones de un técnico
    async getTechnicianAssignments(technicianAuthId) {
        const user = await this.getUserByAuthId(technicianAuthId);
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        const { data, error } = await this.getSupabase()
            .from('building_technician_assignments')
            .select(`
        *,
        technician:users!technician_id(*),
        assigned_by_user:users!assigned_by(*)
      `)
            .eq('technician_id', user.id)
            .eq('status', 'active')
            .order('assigned_at', { ascending: false });
        if (error) {
            throw new Error(`Error al obtener asignaciones: ${error.message}`);
        }
        return data.map(this.mapToAssignment);
    }
    // Obtener edificios asignados a un técnico
    async getTechnicianBuildings(technicianAuthId) {
        const assignments = await this.getTechnicianAssignments(technicianAuthId);
        return assignments.map(assignment => assignment.buildingId);
    }
    // Verificar si un usuario es propietario de un edificio
    async isOwnerOfBuilding(userAuthId, buildingId) {
        const user = await this.getUserByAuthId(userAuthId);
        if (!user)
            return false;
        const { data, error } = await this.getSupabase()
            .from('buildings')
            .select('id')
            .eq('id', buildingId)
            .eq('owner_id', user.id)
            .single();
        return !error && !!data;
    }
    // Verificar si un técnico tiene acceso a un edificio
    async technicianHasAccessToBuilding(technicianAuthId, buildingId) {
        const user = await this.getUserByAuthId(technicianAuthId);
        if (!user)
            return false;
        const { data, error } = await this.getSupabase()
            .from('building_technician_assignments')
            .select('id')
            .eq('building_id', buildingId)
            .eq('technician_id', user.id)
            .eq('status', 'active')
            .single();
        return !error && !!data;
    }
    // Mappers
    mapToUser(data) {
        return {
            id: data.id,
            userId: data.user_id,
            email: data.email,
            fullName: data.full_name,
            roleId: data.role_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }
    mapToRole(data) {
        return {
            id: data.id,
            name: data.name,
            description: data.description,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }
    mapToUserWithRole(data) {
        return {
            ...this.mapToUser(data),
            role: this.mapToRole(data.role)
        };
    }
    mapToAssignment(data) {
        return {
            id: data.id,
            buildingId: data.building_id,
            technicianId: data.technician_id,
            assignedBy: data.assigned_by,
            assignedAt: data.assigned_at,
            status: data.status,
            technician: data.technician ? this.mapToUser(data.technician) : undefined,
            assignedByUser: data.assigned_by_user ? this.mapToUser(data.assigned_by_user) : undefined
        };
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map