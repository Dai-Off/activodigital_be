import crypto from 'crypto';

/**
 * Servicio de encriptación para secrets de 2FA
 * Usa AES-256-CBC para encriptar/desencriptar los secrets TOTP
 */
export class EncryptionService {
  private algorithm = 'aes-256-cbc';
  private key: Buffer;

  constructor() {
    // Obtener la clave de encriptación desde variables de entorno
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY no está configurada en las variables de entorno');
    }
    
    // Convertir la clave a un buffer de 32 bytes (256 bits) para AES-256
    this.key = crypto.scryptSync(encryptionKey, 'salt', 32);
  }

  /**
   * Encripta un texto usando AES-256-CBC
   */
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16); // Vector de inicialización
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combinar IV y texto encriptado (IV se necesita para desencriptar)
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Desencripta un texto usando AES-256-CBC
   */
  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Formato de texto encriptado inválido');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

