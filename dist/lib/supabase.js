"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseAnonClient = exports.getSupabaseAdminClient = exports.getSupabaseClient = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
// Singleton client for server-side usage. Prefers SERVICE role if available,
// falls back to ANON for read-only/basic access.
let supabaseClient = null;
let anonClient = null;
const getSupabaseClient = () => {
    if (supabaseClient)
        return supabaseClient;
    const url = (process.env.SUPABASE_URL || '').trim();
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    const anonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
    if (!url)
        throw new Error('Missing env SUPABASE_URL');
    const keyToUse = serviceRoleKey || anonKey;
    if (!keyToUse)
        throw new Error('Missing env SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
    if (url.startsWith('@')) {
        // eslint-disable-next-line no-console
        console.warn('SUPABASE_URL starts with @, please remove it. Using value as-is may fail.');
    }
    supabaseClient = (0, supabase_js_1.createClient)(url, keyToUse, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
    return supabaseClient;
};
exports.getSupabaseClient = getSupabaseClient;
// Back-compat named export used earlier
exports.getSupabaseAdminClient = exports.getSupabaseClient;
// Public/Anon client (always uses anon key). Useful for end-user auth operations
const getSupabaseAnonClient = () => {
    if (anonClient)
        return anonClient;
    const url = (process.env.SUPABASE_URL || '').trim();
    const anonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
    if (!url)
        throw new Error('Missing env SUPABASE_URL');
    if (!anonKey)
        throw new Error('Missing env SUPABASE_ANON_KEY');
    if (url.startsWith('@')) {
        // eslint-disable-next-line no-console
        console.warn('SUPABASE_URL starts with @, please remove it. Using value as-is may fail.');
    }
    anonClient = (0, supabase_js_1.createClient)(url, anonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
    return anonClient;
};
exports.getSupabaseAnonClient = getSupabaseAnonClient;
//# sourceMappingURL=supabase.js.map