import { getSupabaseClient, getSupabaseAnonClient } from '../../lib/supabase';
import { UserService } from './userService';
import { CreateUserRequest, AuthResponse, UserRole } from '../../types/user';

export async function signUpUser(params: CreateUserRequest): Promise<AuthResponse> {
  const { email, password, fullName, role } = params;
  const supabase = getSupabaseClient();
  const userService = new UserService();

  // 1) Crear usuario en Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError || !authData?.user) {
    throw new Error(authError?.message || 'Failed to create user');
  }

  const userId = authData.user.id;

  try {
    // 2) Crear perfil de usuario con el rol especificado
    const userProfile = await userService.createUserProfile(userId, {
      email,
      fullName,
      role
    });

    // 3) Obtener el usuario completo con rol
    const userWithRole = await userService.getUserByAuthId(userId);
    if (!userWithRole) {
      throw new Error('Error al obtener usuario creado');
    }

    // 4) Crear sesión para el usuario
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (sessionError || !sessionData.session) {
      throw new Error('Error al crear sesión');
    }

    return {
      user: { id: userId, email },
      userProfile: userWithRole,
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token
    };
  } catch (error) {
    // Revertir usuario en Auth si falla la creación del perfil
    await supabase.auth.admin.deleteUser(userId);
    throw error;
  }
}

type SignInParams = { email: string; password: string };
export async function signInUser(params: SignInParams): Promise<AuthResponse> {
  const { email, password } = params;
  const supabase = getSupabaseAnonClient();
  const userService = new UserService();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data?.session) throw new Error(error?.message || 'Invalid credentials');

  // Obtener el perfil completo del usuario
  const userProfile = await userService.getUserByAuthId(data.user.id);
  if (!userProfile) {
    throw new Error('Perfil de usuario no encontrado');
  }

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: { id: data.user.id, email: data.user.email || '' },
    userProfile
  };
}

export async function getProfileByUserId(userId: string) {
  const userService = new UserService();
  return await userService.getUserByAuthId(userId);
}


