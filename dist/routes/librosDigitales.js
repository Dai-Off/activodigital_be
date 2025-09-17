"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const libroDigitalController_1 = require("../web/controllers/libroDigitalController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const router = (0, express_1.Router)();
const digitalBookController = new libroDigitalController_1.DigitalBookController();
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.authenticateToken);
// CRUD básico de libros digitales
router.post('/', digitalBookController.createDigitalBook);
router.get('/', digitalBookController.getBooks);
router.get('/:id', digitalBookController.getBook);
router.put('/:id', digitalBookController.updateBook);
// Operaciones específicas
router.get('/building/:buildingId', digitalBookController.getBookByBuilding);
router.put('/:id/sections/:sectionType', digitalBookController.updateSection);
exports.default = router;
//# sourceMappingURL=librosDigitales.js.map