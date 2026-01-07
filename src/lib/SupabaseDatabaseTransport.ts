import Transport from 'winston-transport';
import { getSupabaseServiceRoleClient } from './supabase';

export class SupabaseDatabaseTransport extends Transport {
  constructor(opts?: any) {
    super(opts);
  }

  async log(info: any, callback: () => void) {
    setImmediate(() => this.emit('logged', info));

    if (process.env.NODE_ENV === 'production') {
      try {
        const supabase = getSupabaseServiceRoleClient();
        
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
          
      } catch (err) {
        console.error('Error insertando log en Supabase DB:', err);
      }
    }

    callback();
  }
}

export const supabaseDatabaseTransport = new SupabaseDatabaseTransport();