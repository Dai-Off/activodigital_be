import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton client for server-side usage. Prefers SERVICE role if available,
// falls back to ANON for read-only/basic access.
let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (supabaseClient) return supabaseClient;

  const url = (process.env.SUPABASE_URL || '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const anonKey = (process.env.SUPABASE_ANON_KEY || '').trim();

  if (!url) throw new Error('Missing env SUPABASE_URL');
  const keyToUse = serviceRoleKey || anonKey;
  if (!keyToUse) throw new Error('Missing env SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');

  if (url.startsWith('@')) {
    // eslint-disable-next-line no-console
    console.warn('SUPABASE_URL starts with @, please remove it. Using value as-is may fail.');
  }

  supabaseClient = createClient(url, keyToUse, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseClient;
};

// Back-compat named export used earlier
export const getSupabaseAdminClient = getSupabaseClient;


