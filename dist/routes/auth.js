"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../web/controllers/authController");
const authMiddleware_1 = require("../web/middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post('/signup', authController_1.signupController);
router.post('/login', authController_1.loginController);
router.get('/me', authMiddleware_1.requireAuth, authController_1.meController);
router.post('/logout', authController_1.logoutController);
exports.default = router;
//# sourceMappingURL=auth.js.map