export enum UserRole {
  TENEDOR = 'tenedor',
  TECNICO = 'tecnico'
}

export interface Role {
  id: string;
  name: UserRole;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  userId: string; // auth.users ID
  email: string;
  fullName: string | null;
  roleId: string;
  role?: Role; // Populated when needed
  createdAt?: string;
  updatedAt?: string;
}

export interface BuildingTechnicianAssignment {
  id: string;
  buildingId: string;
  technicianId: string;
  assignedBy: string;
  assignedAt: string;
  status: 'active' | 'inactive';
  
  // Populated relations
  technician?: User;
  assignedByUser?: User;
}

// DTOs para requests
export interface CreateUserRequest {
  email: string;
  password: string;
  fullName?: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  fullName?: string;
  roleId?: string;
}

export interface AssignTechnicianRequest {
  technicianEmail: string;
  buildingId: string;
}

// Respuestas de autenticación
export interface AuthResponse {
  user: {
    id: string;
    email: string;
  };
  userProfile: User;
  access_token: string;
  refresh_token: string;
}

export interface UserWithRole extends User {
  role: Role;
}
