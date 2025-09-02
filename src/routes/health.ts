import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../lib/supabase';

const router = Router();

router.get('/supabase', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('now');
    const connected = !error;
    res.json({ ok: true, connected, serverTime: data ?? null, error: error?.message ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ ok: false, connected: false, error: message });
  }
});

// Debug envs (masked)
router.get('/env', (_req: Request, res: Response) => {
  const mask = (val?: string): string | null => {
    if (!val) return null;
    if (val.length <= 8) return '********';
    return `${val.slice(0, 4)}...${val.slice(-4)}`;
  };

  res.json({
    SUPABASE_URL: process.env.SUPABASE_URL || null,
    SUPABASE_URL_hasAtPrefix: (process.env.SUPABASE_URL || '').startsWith('@'),
    SUPABASE_ANON_KEY: mask(process.env.SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: mask(process.env.SUPABASE_SERVICE_ROLE_KEY),
    NODE_ENV: process.env.NODE_ENV || null,
  });
});

export default router;


