import { Router } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import edificiosRouter from './edificios';
import librosDigitalesRouter from './librosDigitales';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ message: '¡Bienvenido a la API de Activo Digital Backend!' });
});

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/edificios', edificiosRouter);
router.use('/libros-digitales', librosDigitalesRouter);

export default router;


