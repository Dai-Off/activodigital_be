"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseDatabaseTransport = exports.SupabaseDatabaseTransport = void 0;
const winston_transport_1 = __importDefault(require("winston-transport"));
const supabase_1 = require("./supabase");
class SupabaseDatabaseTransport extends winston_transport_1.default {
    constructor(opts) {
        super(opts);
    }
    async log(info, callback) {
        setImmediate(() => this.emit('logged', info));
        if (process.env.NODE_ENV === 'production') {
            try {
                const supabase = (0, supabase_1.getSupabaseServiceRoleClient)();
                const { level, message, method, path, statusCode, ip, userId, userAgent } = info;
                await supabase
                    .from('api_logs')
                    .insert([
                    {
                        level,
                        message,
                        method,
                        path,
                        status_code: statusCode,
                        ip_address: ip,
                        user_id: userId,
                        user_agent: userAgent
                    }
                ]);
            }
            catch (err) {
                console.error('Error insertando log en Supabase DB:', err);
            }
        }
        callback();
    }
}
exports.SupabaseDatabaseTransport = SupabaseDatabaseTransport;
exports.supabaseDatabaseTransport = new SupabaseDatabaseTransport();
//# sourceMappingURL=SupabaseDatabaseTransport.js.map