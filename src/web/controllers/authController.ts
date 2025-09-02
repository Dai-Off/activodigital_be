import { Request, Response } from 'express';
import { signUpUser, signInUser, getProfileByUserId } from '../../domain/services/authService';

export const signupController = async (req: Request, res: Response) => {
  try {
    const { email, password, full_name } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const result = await signUpUser({ email, password, fullName: full_name });
    return res.status(201).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const result = await signInUser({ email, password });
    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(401).json({ error: message });
  }
};

export const meController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const profile = await getProfileByUserId(userId);
    return res.status(200).json(profile);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

export const logoutController = async (_req: Request, res: Response) => {
  // Backend stateless: el frontend debe borrar tokens. Devolvemos 200 para UX simple.
  return res.status(200).json({ ok: true });
};


