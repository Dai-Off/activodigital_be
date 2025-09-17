"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = exports.authenticateToken = void 0;
const supabase_1 = require("../../lib/supabase");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        if (!token)
            return res.status(401).json({ error: 'missing bearer token' });
        const supabase = (0, supabase_1.getSupabaseAnonClient)();
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data?.user)
            return res.status(401).json({ error: 'invalid token' });
        // Asignar el usuario al request
        req.user = {
            id: data.user.id,
            email: data.user.email
        };
        return next();
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(401).json({ error: message });
    }
};
exports.authenticateToken = authenticateToken;
// Alias para compatibilidad
exports.requireAuth = exports.authenticateToken;
//# sourceMappingURL=authMiddleware.js.map