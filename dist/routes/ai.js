"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const aiInvoiceController_1 = require("../web/controllers/aiInvoiceController");
const aiCertificateController_1 = require("../web/controllers/aiCertificateController");
const aiMemoriaController_1 = require("../web/controllers/aiMemoriaController");
const AILicenciaDRController_1 = require("../web/controllers/AILicenciaDRController");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const aiInvoiceController = new aiInvoiceController_1.AIInvoiceController();
const aiCertificateController = new aiCertificateController_1.AICertificateController();
const aiMemoriaController = new aiMemoriaController_1.AIMemoriaController();
const aiLicenciaDRController = new AILicenciaDRController_1.AILicenciaDRController();
router.post("/extract-memoria-calidades", authMiddleware_1.authenticateToken, upload.single("file"), aiMemoriaController.extractMemoriaData);
router.post("/extract-invoice", authMiddleware_1.authenticateToken, upload.single("file"), aiInvoiceController.extractInvoiceData);
router.post("/extract-invoice-async", authMiddleware_1.authenticateToken, aiInvoiceController.extractInvoiceAsync);
router.get("/invoice-job/:id", authMiddleware_1.authenticateToken, aiInvoiceController.getInvoiceJob);
router.post("/extract-certificate-async", authMiddleware_1.authenticateToken, aiCertificateController.extractCertificateAsync);
router.get("/certificate-job/:id", authMiddleware_1.authenticateToken, aiCertificateController.getCertificateJob);
router.post("/extract-licencia-dr", authMiddleware_1.authenticateToken, upload.single("file"), aiLicenciaDRController.extractLicenciaDRData);
router.post("/extract-licencia-dr-doc", authMiddleware_1.authenticateToken, upload.single("file"), aiLicenciaDRController.extractLicenciaDRDoc);
router.post("/generate-licencia-draft", authMiddleware_1.authenticateToken, aiLicenciaDRController.generateLicenciaDraft);
exports.default = router;
//# sourceMappingURL=ai.js.map