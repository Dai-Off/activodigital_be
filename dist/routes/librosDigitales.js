"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const libroDigitalController_1 = require("../web/controllers/libroDigitalController");
const aiDigitalBookController_1 = require("../web/controllers/aiDigitalBookController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const uploadMiddleware_1 = require("../web/middlewares/uploadMiddleware");
const requestLogger_1 = require("../web/middlewares/requestLogger");
const router = (0, express_1.Router)();
const digitalBookController = new libroDigitalController_1.DigitalBookController();
const aiDigitalBookController = new aiDigitalBookController_1.AIDigitalBookController();
router.use(authMiddleware_1.requireAuth);
router.use(requestLogger_1.requestLogger);
router.post('/upload-ai', (req, res, next) => {
    req.setTimeout(90000);
    res.setTimeout(90000);
    next();
}, uploadMiddleware_1.upload.single('document'), aiDigitalBookController.uploadAndProcessDocument);
router.post('/', digitalBookController.createDigitalBook);
router.get('/building/:buildingId', digitalBookController.getBookByBuilding);
router.put('/:id/sections/:sectionType', digitalBookController.updateSection);
exports.default = router;
//# sourceMappingURL=librosDigitales.js.map