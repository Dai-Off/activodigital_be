import { getSupabaseClient, getSupabaseAnonClient } from '../../lib/supabase';

type SignUpParams = {
  email: string;
  password: string;
  fullName?: string;
};

export async function signUpUser(params: SignUpParams) {
  const { email, password, fullName } = params;
  const supabase = getSupabaseClient();

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

  // 2) Insertar perfil con rol por defecto 'tenedor'
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      email,
      full_name: fullName ?? null,
      role: 'tenedor',
    });
  if (profileError) {
    // TODO: opcional: revertir usuario en Auth si falla profiles
    throw new Error(profileError.message);
  }

  return { user_id: userId, email, role: 'tenedor' };
}

type SignInParams = { email: string; password: string };
export async function signInUser(params: SignInParams) {
  const { email, password } = params;
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data?.session) throw new Error(error?.message || 'Invalid credentials');
  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: { id: data.user.id, email: data.user.email },
  };
}

export async function getProfileByUserId(userId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, email, full_name, role, created_at, updated_at')
    .eq('user_id', userId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}


