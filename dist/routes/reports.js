"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportController_1 = require("../web/controllers/reportController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const requestLogger_1 = require("../web/middlewares/requestLogger");
const router = (0, express_1.Router)();
const reportController = new reportController_1.ReportController();
router.use(requestLogger_1.requestLogger);
router.use(authMiddleware_1.requireAuth);
router.get('/fields', reportController.getReportableFields.bind(reportController));
router.get('/', reportController.getReports.bind(reportController));
router.post('/', reportController.generateReport.bind(reportController));
router.delete('/:id', reportController.deleteReport.bind(reportController));
exports.default = router;
//# sourceMappingURL=reports.js.map