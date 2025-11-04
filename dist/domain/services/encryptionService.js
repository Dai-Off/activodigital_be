"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Servicio de encriptación para secrets de 2FA
 * Usa AES-256-CBC para encriptar/desencriptar los secrets TOTP
 */
class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-cbc';
        // Obtener la clave de encriptación desde variables de entorno
        const encryptionKey = process.env.ENCRYPTION_KEY;
        if (!encryptionKey) {
            throw new Error('ENCRYPTION_KEY no está configurada en las variables de entorno');
        }
        // Convertir la clave a un buffer de 32 bytes (256 bits) para AES-256
        this.key = crypto_1.default.scryptSync(encryptionKey, 'salt', 32);
    }
    /**
     * Encripta un texto usando AES-256-CBC
     */
    encrypt(text) {
        const iv = crypto_1.default.randomBytes(16); // Vector de inicialización
        const cipher = crypto_1.default.createCipheriv(this.algorithm, this.key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // Combinar IV y texto encriptado (IV se necesita para desencriptar)
        return iv.toString('hex') + ':' + encrypted;
    }
    /**
     * Desencripta un texto usando AES-256-CBC
     */
    decrypt(encryptedText) {
        const parts = encryptedText.split(':');
        if (parts.length !== 2) {
            throw new Error('Formato de texto encriptado inválido');
        }
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const decipher = crypto_1.default.createDecipheriv(this.algorithm, this.key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
exports.EncryptionService = EncryptionService;
//# sourceMappingURL=encryptionService.js.map