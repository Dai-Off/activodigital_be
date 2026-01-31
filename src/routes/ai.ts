import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../web/middlewares/authMiddleware';
import { AIInvoiceController } from '../web/controllers/aiInvoiceController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const aiInvoiceController = new AIInvoiceController();

router.post(
  '/extract-invoice',
  authenticateToken,
  upload.single('file'),
  aiInvoiceController.extractInvoiceData
);

export default router;
