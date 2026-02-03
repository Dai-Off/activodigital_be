"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireAuth = exports.authenticateToken = void 0;
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
/**
 * Middleware de autenticación opcional
 * Intenta autenticar al usuario si hay token, pero no falla si no lo hay
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        if (!token) {
            // No hay token, continuar sin autenticación
            return next();
        }
        // Intentar autenticar
        const supabase = (0, supabase_1.getSupabaseAnonClient)();
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data?.user) {
            // Token válido, asignar usuario
            req.user = {
                id: data.user.id,
                email: data.user.email
            };
        }
        // Si hay error, simplemente continuar sin usuario autenticado
        return next();
    }
    catch (err) {
        // En caso de error, continuar sin autenticación
        return next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=authMiddleware.js.map