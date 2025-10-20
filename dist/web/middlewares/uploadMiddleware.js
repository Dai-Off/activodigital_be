"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
// Configuración de multer para almacenar archivos en memoria
const storage = multer_1.default.memoryStorage();
// Configuración de filtro de archivos
const fileFilter = (req, file, cb) => {
    // Aceptar solo PDFs y archivos de texto
    const allowedMimeTypes = ['application/pdf', 'text/plain'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Tipo de archivo no permitido. Solo se aceptan PDF y archivos de texto.'));
    }
};
// Configurar multer con límite de 10MB
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});
//# sourceMappingURL=uploadMiddleware.js.map