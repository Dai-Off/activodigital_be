import { Router } from "express";
import multer from "multer";
import { DataRoomController } from "../web/controllers/dataRoomController";
import { authenticateToken } from "../web/middlewares/authMiddleware";

const router = Router();
const controller = new DataRoomController();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

// GET /api/data-room/audit/:buildingId — estado de auditoría
router.get("/audit/:buildingId", authenticateToken, controller.getAuditStatus);

// GET /api/data-room/dossier/:buildingId — descarga PDF combinado de documentos subidos
router.get("/dossier/:buildingId", authenticateToken, controller.getDossier);

// POST /api/data-room/upload — sube un archivo al Data Room
router.post(
  "/upload",
  authenticateToken,
  upload.single("file"),
  controller.uploadFile,
);

// POST /api/data-room/upload-async — sube un archivo y lo encola para procesamiento
router.post(
  "/upload-async",
  authenticateToken,
  upload.single("file"),
  controller.uploadFileAsync,
);

// GET /api/data-room/job/:jobId — consulta el estado de un job de Data Room
router.get("/job/:jobId", authenticateToken, controller.getJobStatus);

export default router;
