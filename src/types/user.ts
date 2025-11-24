export enum UserRole {
  PROPIETARIO = 'propietario',
  TECNICO = 'tecnico',
  ADMINISTRADOR = 'administrador',
  CFO = 'cfo'
}

export interface Role {
  id: string;
  name: UserRole;
  description?: string;
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
  twoFactorEnabled?: boolean;
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
  email?: string
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

// Tipos para el sistema de invitaciones
export interface Invitation {
  id: string;
  email: string;
  roleId: string;
  buildingId: string;
  invitedBy: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relaciones populadas
  role?: Role;
  building?: {
    id: string;
    name: string;
    address: string;
  };
  invitedByUser?: User;
}

export interface BuildingCfoAssignment {
  id: string;
  buildingId: string;
  cfoId: string;
  assignedBy: string;
  assignedAt: string;
  status: 'active' | 'inactive';
  
  // Relaciones populadas
  cfo?: User;
  assignedByUser?: User;
}

// DTOs para invitaciones
export interface CreateInvitationRequest {
  email: string;
  role: UserRole;
  buildingId: string;
}

export interface AcceptInvitationRequest {
  token: string;
  fullName?: string;
}

export interface AcceptInvitationResponse {
  invitationId: string;
  role: string;
  buildingId: string;
  email: string;
}