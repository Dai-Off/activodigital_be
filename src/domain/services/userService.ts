import { getSupabaseClient } from '../../lib/supabase';
import {
  User,
  Role,
  UserRole,
  CreateUserRequest,
  UpdateUserRequest,
  UserWithRole,
  BuildingTechnicianAssignment
} from '../../types/user';
import { ActionsValues, ModuleValues, TrazabilityServiceParams } from '../trazability/interfaceTrazability';
import { TrazabilityService } from '../trazability/TrazabilityService';

export class UserService {
  private trazabilityService = new TrazabilityService()
  private getSupabase() {
    return getSupabaseClient();
  }

  // Obtener usuario por ID de auth
  async getUserByAuthId(authUserId: string): Promise<UserWithRole | null> {
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
  async getUserByEmail(email: string): Promise<UserWithRole | null> {
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
  async getRoles(): Promise<Role[]> {
    const { data, error } = await this.getSupabase()
      .from('roles')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Error al obtener roles: ${error.message}`);
    }

    return data.map((r) => this.mapToRole(r));
  }

  async getAllUsersService(): Promise<User[]> {
    const { data, error } = await this.getSupabase()
      .from('users')
      .select(`
        *,
        roles(*)
      `)
      .order('email');
    if (error) {
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }

    return data.map((r) => this.mapToUser(r));
  }

  async createUser(data: CreateUserRequest & { authUserId: string }): Promise<User> {
    let userId = data?.userId;
    let authUserIdCreate = data.authUserId;
    let buildingIDE = data?.buildingId;

    const { data: found, error } = await this.getSupabase()
      .from('users')
      .select('id')
      .eq('email', data.email)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Error verificando duplicados: ${error.message}`);
    }
    if (found) {
      const errorDup: any = new Error('Ya existe un usuario con este correo.');
      errorDup.status = 400;
      throw errorDup;
    }
    if (!data.role) {
      throw new Error("Datos insuficientes para crear usuario");
    }
    const userData: Omit<CreateUserRequest, 'password'> = {
      email: data.email,
      fullName: data.fullName,
      role: data.role
    };

    if (!authUserIdCreate) {
      const { data: authData, error: authError } = await this.getSupabase()?.auth?.admin.createUser({
        email: data.email,
        email_confirm: true,
      });
      if (authError || !authData?.user) {
        throw new Error(authError?.message || 'Failed to create user');
      }
      authUserIdCreate = authData.user.id;
    }

    // ! ejemplo de insertar trazabilidad
    // await this.insertTrazability({
    //   action: ActionsValues.CREAR, description: 'Agregó un usuario al sistema', module:
    //     ModuleValues.ELECTRICIDAD, buildingId: buildingIDE ?? 'd3016ddf-7616-4012-8101-5932b1b5996a', authUserId: userId ?? null
    // })

    return this.createUserProfile(authUserIdCreate, userData);
  }

  async insertTrazability(data: TrazabilityServiceParams) {
    await this.trazabilityService.registerTrazability(data);
  }

  async editUser(userId: string, update: UpdateUserRequest & { email?: string }): Promise<User> {
    if (update.email) {
      const { data: found, error } = await this.getSupabase()
        .from('users')
        .select('id')
        .eq('email', update.email)
        .neq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') {
        throw new Error(`Error verificando duplicados: ${error.message}`);
      }
      if (found) {
        const errorDup: any = new Error('Ya existe un usuario con este correo.');
        errorDup.status = 400;
        throw errorDup;
      }
    }

    let roleId = update.roleId;
    if ((update as any).role) {
      const role = await this.getRoleByName((update as any).role as UserRole);
      if (role) roleId = role.id;
    }
    const updatePayload: UpdateUserRequest = {
      ...update,
      roleId,
    };
    return this.updateUser(userId, updatePayload);
  }

  // Obtener rol por nombre
  async getRoleByName(name: UserRole): Promise<Role | null> {
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
  async createUserProfile(authUserId: string, userData: Omit<CreateUserRequest, 'password'>): Promise<User> {
    // Buscar el rol preferentemente por el nombre actual ('administrador')
    const roleNamesToTry: UserRole[] =
      userData.role === UserRole.ADMINISTRADOR
        ? [UserRole.ADMINISTRADOR]
        : [userData.role];

    let role: Role | null = null;
    for (const roleName of roleNamesToTry) {
      // eslint-disable-next-line no-await-in-loop
      role = await this.getRoleByName(roleName);
      if (role) break;
    }
    // Si no se encuentra rol, confiar en el DEFAULT/trigger de la DB
    const roleIdToUse = role ? role.id : null;

    const userProfileData = {
      user_id: authUserId,
      email: userData.email,
      full_name: userData.fullName || null,
      role_id: roleIdToUse
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

  async updateUser(userId: string, updateData: UpdateUserRequest): Promise<User> {
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
  async getTechnicians(): Promise<UserWithRole[]> {
    const { data, error } = await this.getSupabase()
      .from('users')
      .select(`
        *,
        role:roles(*)
      `)
      .eq('roles.name', UserRole.TECNICO);

    if (error) {
      throw new Error(`Error al obtener técnicos: ${error.message}`);
    }

    return data.map(this.mapToUserWithRole);
  }

  // Asignar técnico a edificio
  async assignTechnicianToBuilding(
    buildingId: string,
    technicianEmail: string,
    assignedByUserId: string
  ): Promise<BuildingTechnicianAssignment> {
    // Buscar el técnico por email
    const technician = await this.getUserByEmail(technicianEmail);
    if (!technician) {
      throw new Error('Técnico no encontrado');
    }

    if (technician.role.name !== UserRole.TECNICO) {
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
  async getTechnicianAssignments(technicianAuthId: string): Promise<BuildingTechnicianAssignment[]> {
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

    return data.map((item) => this.mapToAssignment(item));
  }

  // Obtener edificios asignados a un técnico
  async getTechnicianBuildings(technicianAuthId: string): Promise<string[]> {
    const assignments = await this.getTechnicianAssignments(technicianAuthId);
    return assignments.map(assignment => assignment.buildingId);
  }

  // Obtener edificios asignados a un CFO
  async getCfoBuildings(cfoAuthId: string): Promise<string[]> {
    const user = await this.getUserByAuthId(cfoAuthId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const { data, error } = await this.getSupabase()
      .from('building_cfo_assignments')
      .select('building_id')
      .eq('cfo_id', user.id)
      .eq('status', 'active');

    if (error) {
      throw new Error(`Error al obtener edificios CFO: ${error.message}`);
    }

    return data.map((item: any) => item.building_id);
  }

  // Obtener edificios asignados a un propietario
  async getPropietarioBuildings(propietarioAuthId: string): Promise<string[]> {
    const user = await this.getUserByAuthId(propietarioAuthId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const { data, error } = await this.getSupabase()
      .from('building_propietario_assignments')
      .select('building_id')
      .eq('propietario_id', user.id)
      .eq('status', 'active');

    if (error) {
      throw new Error(`Error al obtener edificios del propietario: ${error.message}`);
    }

    return data.map((item: any) => item.building_id);
  }

  // Verificar si un usuario es propietario de un edificio
  async isOwnerOfBuilding(userAuthId: string, buildingId: string): Promise<boolean> {
    const user = await this.getUserByAuthId(userAuthId);
    if (!user) return false;

    const { data, error } = await this.getSupabase()
      .from('buildings')
      .select('id')
      .eq('id', buildingId)
      .eq('owner_id', user.id)
      .single();

    return !error && !!data;
  }

  // Verificar si un técnico tiene acceso a un edificio
  async technicianHasAccessToBuilding(technicianAuthId: string, buildingId: string): Promise<boolean> {
    const user = await this.getUserByAuthId(technicianAuthId);
    if (!user) return false;

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
  private mapToUser(data: any): User {
    return {
      id: data.id,
      userId: data.user_id,
      email: data.email,
      fullName: data.full_name,
      roleId: data.role_id,
      role: {
        id: data?.roles?.id ?? null,
        name: data?.roles?.name ?? null,
      },
      twoFactorEnabled: data.two_factor_enabled ?? false,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapToRole(data: any): Role {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapToUserWithRole(data: any): UserWithRole {
    return {
      ...this.mapToUser(data),
      role: this.mapToRole(data.role)
    };
  }

  private mapToAssignment(data: any): BuildingTechnicianAssignment {
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
