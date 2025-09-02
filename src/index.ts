import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { getSupabaseClient } from './lib/supabase';

dotenv.config();

const app = express();
const port: number = Number(process.env.PORT) || 3000;

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Ruta de prueba
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: '¡Bienvenido a la API de Activo Digital Backend!' });
});

// Health Supabase
app.get('/health/supabase', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    // Lightweight operation: get current timestamp via Postgres now()
    const { data, error } = await supabase.rpc('now');
    const connected = !error;
    res.json({ ok: true, connected, serverTime: data ?? null, error: error?.message ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ ok: false, connected: false, error: message });
  }
});

// Debug envs (safe: masks secrets)
app.get('/debug/env', (_req: Request, res: Response) => {
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

// Health Auth (baja nivel: consulta /auth/v1/settings con API key)
app.get('/health/supabase-auth', async (_req: Request, res: Response) => {
  try {
    const url = (process.env.SUPABASE_URL || '').trim();
    const apiKey = ((process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) || '').trim();
    if (!url || !apiKey) {
      return res.status(400).json({ ok: false, error: 'Faltan SUPABASE_URL o API key' });
    }
    const resp = await fetch(`${url}/auth/v1/settings`, {
      headers: {
        apikey: apiKey,
        authorization: `Bearer ${apiKey}`,
      },
    });
    const text = await resp.text();
    let json: unknown = null;
    try { json = JSON.parse(text); } catch { /* leave as text */ }
    return res.status(200).json({
      ok: resp.ok,
      status: resp.status,
      statusText: resp.statusText,
      body: json ?? text,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
});

// Manejo de errores
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Prefer console.error, avoids leaking internals to clients
  // In production consider structured logging
  // eslint-disable-next-line no-console
  console.error(err.stack);
  res.status(500).json({ error: '¡Algo salió mal en el servidor!' });
});

// Iniciar el servidor
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

export default app;


