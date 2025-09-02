"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const router = (0, express_1.Router)();
router.get('/supabase', async (_req, res) => {
    try {
        const supabase = (0, supabase_1.getSupabaseClient)();
        const { data, error } = await supabase.rpc('now');
        const connected = !error;
        res.json({ ok: true, connected, serverTime: data ?? null, error: error?.message ?? null });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({ ok: false, connected: false, error: message });
    }
});
// Debug envs (masked)
router.get('/env', (_req, res) => {
    const mask = (val) => {
        if (!val)
            return null;
        if (val.length <= 8)
            return '********';
        return `${val.slice(0, 4)}...${val.slice(-4)}`;
    };
    res.json({
        SUPABASE_URL: process.env.SUPABASE_URL || null,
        SUPABASE_URL_hasAtPrefix: (process.env.SUPABASE_URL || '').startsWith('@'),
        SUPABASE_ANON_KEY: mask(process.env.SUPABASE_ANON_KEY),
        SUPABASE_SERVICE_ROLE_KEY: mask(process.env.SUPABASE_SERVICE_ROLE_KEY),
        NODE_ENV: process.env.NODE_ENV || null,
    });
});
exports.default = router;
//# sourceMappingURL=health.js.map