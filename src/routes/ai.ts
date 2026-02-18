import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../web/middlewares/authMiddleware';
import { AIInvoiceController } from '../web/controllers/aiInvoiceController';
import { AICertificateController } from '../web/controllers/aiCertificateController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const aiInvoiceController = new AIInvoiceController();
const aiCertificateController = new AICertificateController();

router.post(
  '/extract-invoice',
  authenticateToken,
  upload.single('file'),
  aiInvoiceController.extractInvoiceData
);

router.post(
  '/extract-invoice-async',
  authenticateToken,
  aiInvoiceController.extractInvoiceAsync
);

router.get(
  '/invoice-job/:id',
  authenticateToken,
  aiInvoiceController.getInvoiceJob
);

router.post(
  '/extract-certificate-async',
  authenticateToken,
  aiCertificateController.extractCertificateAsync
);

router.get(
  '/certificate-job/:id',
  authenticateToken,
  aiCertificateController.getCertificateJob
);

export default router;
