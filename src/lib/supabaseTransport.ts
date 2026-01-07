import Transport from 'winston-transport';
import { getSupabaseServiceRoleClient } from './supabase';

class SupabaseStorageTransport extends Transport {
  private bucketName: string;

  constructor(opts: any) {
    super(opts);
    this.bucketName = opts.bucketName || 'logs';
  }

  private getStartOfWeekDate(): string {
    const now = new Date();
    const day = now.getDay(); // 0 (Dom) a 6 (Sab)
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Ajustar al lunes
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  async log(info: any, callback: () => void) {
    setImmediate(() => this.emit('logged', info));

    if (process.env.NODE_ENV === 'production') {
      try {
        const supabase = getSupabaseServiceRoleClient();
        const { level, message, timestamp, ip, userId, userAgent } = info;
        
        const logLine = `${timestamp} [${level.toUpperCase()}]: ${message} | IP: ${ip} | User: ${userId} | UA: ${userAgent}\n`;
        
        // Nombre del archivo basado en el lunes de la semana actual
        // Ejemplo: access-week-2025-01-05.log
        const weekDate = this.getStartOfWeekDate();
        const fileName = `access-week-${weekDate}.log`;

        const { data: existingFile } = await supabase.storage
          .from(this.bucketName)
          .download(fileName);

        let finalContent = logLine;

        if (existingFile) {
          const currentText = await existingFile.text();
          finalContent = currentText + logLine; // Concatenamos el nuevo log
        }

        await supabase.storage
          .from(this.bucketName)
          .upload(fileName, finalContent, {
            upsert: true, 
            contentType: 'text/plain'
          });
          
      } catch (err) {
        console.error('Error enviando log a Supabase Storage:', err);
      }
    }

    callback();
  }
}

export const supabaseStorageTransport = new SupabaseStorageTransport({ bucketName: 'logs' });