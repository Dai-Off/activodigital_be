import { Router } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import edificiosRouter from './edificios';
import librosDigitalesRouter from './librosDigitales';
import usersRouter from './users';
import invitationsRouter from './invitations';
import certificatesEnergeticosRouter from './certificadosEnergeticos';
import esgRouter from './esg';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ message: '¡Bienvenido a la API de Activo Digital Backend!' });
});

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/edificios', edificiosRouter);
router.use('/libros-digitales', librosDigitalesRouter);
router.use('/invitations', invitationsRouter);
router.use('/certificados-energeticos', certificatesEnergeticosRouter);
router.use('/esg', esgRouter);

export default router;


