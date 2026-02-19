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
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const aiInvoiceController = new aiInvoiceController_1.AIInvoiceController();
const aiCertificateController = new aiCertificateController_1.AICertificateController();
router.post('/extract-invoice', authMiddleware_1.authenticateToken, upload.single('file'), aiInvoiceController.extractInvoiceData);
router.post('/extract-invoice-async', authMiddleware_1.authenticateToken, aiInvoiceController.extractInvoiceAsync);
router.get('/invoice-job/:id', authMiddleware_1.authenticateToken, aiInvoiceController.getInvoiceJob);
router.post('/extract-certificate-async', authMiddleware_1.authenticateToken, aiCertificateController.extractCertificateAsync);
router.get('/certificate-job/:id', authMiddleware_1.authenticateToken, aiCertificateController.getCertificateJob);
exports.default = router;
//# sourceMappingURL=ai.js.map