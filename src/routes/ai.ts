import { Router } from "express";
import multer from "multer";
import { authenticateToken } from "../web/middlewares/authMiddleware";
import { AIInvoiceController } from "../web/controllers/aiInvoiceController";
import { AICertificateController } from "../web/controllers/aiCertificateController";
import { AIMemoriaController } from "../web/controllers/aiMemoriaController";
import { AILicenciaDRController } from "../web/controllers/AILicenciaDRController";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const aiInvoiceController = new AIInvoiceController();
const aiCertificateController = new AICertificateController();
const aiMemoriaController = new AIMemoriaController();
const aiLicenciaDRController = new AILicenciaDRController();

router.post(
  "/extract-memoria-calidades",
  authenticateToken,
  upload.single("file"),
  aiMemoriaController.extractMemoriaData,
);

router.post(
  "/extract-invoice",
  authenticateToken,
  upload.single("file"),
  aiInvoiceController.extractInvoiceData,
);

router.post(
  "/extract-invoice-async",
  authenticateToken,
  aiInvoiceController.extractInvoiceAsync,
);

router.get(
  "/invoice-job/:id",
  authenticateToken,
  aiInvoiceController.getInvoiceJob,
);

router.post(
  "/extract-certificate-async",
  authenticateToken,
  aiCertificateController.extractCertificateAsync,
);

router.get(
  "/certificate-job/:id",
  authenticateToken,
  aiCertificateController.getCertificateJob,
);

router.post(
  "/extract-licencia-dr",
  authenticateToken,
  upload.single("file"),
  aiLicenciaDRController.extractLicenciaDRData,
);

router.post(
  "/extract-licencia-dr-doc",
  authenticateToken,
  upload.single("file"),
  aiLicenciaDRController.extractLicenciaDRDoc,
);

router.post(
  "/generate-licencia-draft",
  authenticateToken,
  aiLicenciaDRController.generateLicenciaDraft,
);

export default router;
