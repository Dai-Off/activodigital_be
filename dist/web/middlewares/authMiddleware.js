"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const supabase_1 = require("../../lib/supabase");
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        if (!token)
            return res.status(401).json({ error: 'missing bearer token' });
        const supabase = (0, supabase_1.getSupabaseAnonClient)();
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data?.user)
            return res.status(401).json({ error: 'invalid token' });
        req.userId = data.user.id;
        return next();
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(401).json({ error: message });
    }
};
exports.requireAuth = requireAuth;
//# sourceMappingURL=authMiddleware.js.map