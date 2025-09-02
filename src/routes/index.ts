import { Router } from 'express';
import healthRouter from './health';
import authRouter from './auth';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ message: '¡Bienvenido a la API de Activo Digital Backend!' });
});

router.use('/health', healthRouter);
router.use('/auth', authRouter);

export default router;


