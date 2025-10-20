"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const libroDigitalController_1 = require("../web/controllers/libroDigitalController");
const aiDigitalBookController_1 = require("../web/controllers/aiDigitalBookController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const uploadMiddleware_1 = require("../web/middlewares/uploadMiddleware");
const router = (0, express_1.Router)();
const digitalBookController = new libroDigitalController_1.DigitalBookController();
const aiDigitalBookController = new aiDigitalBookController_1.AIDigitalBookController();
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.authenticateToken);
// NUEVO: Crear libro digital mediante IA procesando un documento
// Timeout extendido para procesamiento con IA (hasta 90 segundos)
router.post('/upload-ai', (req, res, next) => {
    // Establecer timeout de 90 segundos para procesamiento con IA
    req.setTimeout(90000);
    res.setTimeout(90000);
    next();
}, uploadMiddleware_1.upload.single('document'), aiDigitalBookController.uploadAndProcessDocument);
// Crear libro digital (por edificio) - carga manual
router.post('/', digitalBookController.createDigitalBook);
// Operaciones centradas en edificio y secciones
router.get('/building/:buildingId', digitalBookController.getBookByBuilding);
router.put('/:id/sections/:sectionType', digitalBookController.updateSection);
exports.default = router;
//# sourceMappingURL=librosDigitales.js.map