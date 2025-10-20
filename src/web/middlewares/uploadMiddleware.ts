import multer from 'multer';

// Configuración de multer para almacenar archivos en memoria
const storage = multer.memoryStorage();

// Configuración de filtro de archivos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Aceptar solo PDFs y archivos de texto
  const allowedMimeTypes = ['application/pdf', 'text/plain'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se aceptan PDF y archivos de texto.'));
  }
};

// Configurar multer con límite de 10MB
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

