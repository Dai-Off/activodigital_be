"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutController = exports.meController = exports.loginController = exports.signupController = void 0;
const authService_1 = require("../../domain/services/authService");
const signupController = async (req, res) => {
    try {
        const { email, password, full_name } = req.body ?? {};
        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }
        const result = await (0, authService_1.signUpUser)({ email, password, fullName: full_name });
        return res.status(201).json(result);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};
exports.signupController = signupController;
const loginController = async (req, res) => {
    try {
        const { email, password } = req.body ?? {};
        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }
        const result = await (0, authService_1.signInUser)({ email, password });
        return res.status(200).json(result);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(401).json({ error: message });
    }
};
exports.loginController = loginController;
const meController = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'unauthorized' });
        const profile = await (0, authService_1.getProfileByUserId)(userId);
        return res.status(200).json(profile);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};
exports.meController = meController;
const logoutController = async (_req, res) => {
    // Backend stateless: el frontend debe borrar tokens. Devolvemos 200 para UX simple.
    return res.status(200).json({ ok: true });
};
exports.logoutController = logoutController;
//# sourceMappingURL=authController.js.map