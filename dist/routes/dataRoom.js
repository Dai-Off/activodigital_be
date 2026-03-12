"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const dataRoomController_1 = require("../web/controllers/dataRoomController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const router = (0, express_1.Router)();
const controller = new dataRoomController_1.DataRoomController();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },
});
// GET /api/data-room/audit/:buildingId — estado de auditoría
router.get("/audit/:buildingId", authMiddleware_1.authenticateToken, controller.getAuditStatus);
// GET /api/data-room/dossier/:buildingId — descarga PDF combinado de documentos subidos
router.get("/dossier/:buildingId", authMiddleware_1.authenticateToken, controller.getDossier);
// POST /api/data-room/upload — sube un archivo al Data Room
router.post("/upload", authMiddleware_1.authenticateToken, upload.single("file"), controller.uploadFile);
// POST /api/data-room/upload-async — sube un archivo y lo encola para procesamiento
router.post("/upload-async", authMiddleware_1.authenticateToken, upload.single("file"), controller.uploadFileAsync);
// POST /api/data-room/upload-batch — sube hasta 5 archivos para clasificación IA automática
router.post("/upload-batch", authMiddleware_1.authenticateToken, upload.array("files", 5), controller.uploadFileBatch);
// GET /api/data-room/batch-jobs/:buildingId — lista de jobs del drag & drop
router.get("/batch-jobs/:buildingId", authMiddleware_1.authenticateToken, controller.getBatchJobs);
// POST /api/data-room/classify-job — clasifica manualmente un documento batch
router.post("/classify-job", authMiddleware_1.authenticateToken, controller.classifyJob);
// GET /api/data-room/job/:jobId — consulta el estado de un job de Data Room
router.get("/job/:jobId", authMiddleware_1.authenticateToken, controller.getJobStatus);
exports.default = router;
//# sourceMappingURL=dataRoom.js.map