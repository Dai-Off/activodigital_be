"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signUpUser = signUpUser;
exports.signInUser = signInUser;
exports.getProfileByUserId = getProfileByUserId;
const supabase_1 = require("../../lib/supabase");
async function signUpUser(params) {
    const { email, password, fullName } = params;
    const supabase = (0, supabase_1.getSupabaseClient)();
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
async function signInUser(params) {
    const { email, password } = params;
    const supabase = (0, supabase_1.getSupabaseAnonClient)();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data?.session)
        throw new Error(error?.message || 'Invalid credentials');
    return {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: { id: data.user.id, email: data.user.email },
    };
}
async function getProfileByUserId(userId) {
    const supabase = (0, supabase_1.getSupabaseClient)();
    const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, role, created_at, updated_at')
        .eq('user_id', userId)
        .single();
    if (error)
        throw new Error(error.message);
    return data;
}
//# sourceMappingURL=authService.js.map