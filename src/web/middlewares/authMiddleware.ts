import { NextFunction, Request, Response } from 'express';
import { getSupabaseAnonClient } from '../../lib/supabase';

// Extender el tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      };
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'missing bearer token' });

    const supabase = getSupabaseAnonClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'invalid token' });

    // Asignar el usuario al request
    req.user = {
      id: data.user.id,
      email: data.user.email
    };
    
    return next();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(401).json({ error: message });
  }
};

// Alias para compatibilidad
export const requireAuth = authenticateToken;


