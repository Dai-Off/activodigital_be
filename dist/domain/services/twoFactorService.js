"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorService = void 0;
const speakeasy_1 = __importDefault(require("speakeasy"));
const supabase_1 = require("../../lib/supabase");
const encryptionService_1 = require("./encryptionService");
const userService_1 = require("./userService");
/**
 * Servicio para manejar autenticación de dos factores (2FA) usando TOTP
 */
class TwoFactorService {
    constructor() {
        this.encryptionService = new encryptionService_1.EncryptionService();
        this.userService = new userService_1.UserService();
    }
    /**
     * Genera un secret TOTP y QR code para configurar Google Authenticator
     * @param userId - ID de la tabla users (no user_id de auth.users)
     */
    async setup2FA(userId) {
        const supabase = (0, supabase_1.getSupabaseClient)();
        // Obtener usuario por ID de la tabla users
        const { data: userData, error: fetchError } = await supabase
            .from('users')
            .select('id, user_id, email')
            .eq('id', userId)
            .single();
        if (fetchError || !userData) {
            throw new Error('Usuario no encontrado');
        }
        const authUserId = userData.user_id;
        // Generar secret TOTP
        const secret = speakeasy_1.default.generateSecret({
            name: `Activo Digital (${userData.email})`,
            issuer: 'Activo Digital',
            length: 32
        });
        // Encriptar el secret antes de guardarlo
        const encryptedSecret = this.encryptionService.encrypt(secret.base32);
        // Guardar secret encriptado en la base de datos usando el ID de la tabla users
        const { error: updateError } = await supabase
            .from('users')
            .update({
            two_factor_secret: encryptedSecret,
            // No activar todavía, solo guardar el secret
            two_factor_enabled: false
        })
            .eq('id', userId);
        if (updateError) {
            throw new Error(`Error al guardar secret 2FA: ${updateError.message}`);
        }
        // Generar URL del QR code
        const qrCodeUrl = secret.otpauth_url || '';
        // Formatear clave para entrada manual (agrupar en grupos de 4)
        const manualEntryKey = secret.base32.match(/.{1,4}/g)?.join(' ') || secret.base32;
        // Log para debugging: verificar que el secret guardado coincide
        console.log('Secret generado para userId:', userId, 'Secret base32:', secret.base32.substring(0, 8) + '...');
        // Verificar que el secret se guardó correctamente generando un token de prueba
        const testToken = speakeasy_1.default.totp({
            secret: secret.base32,
            encoding: 'base32'
        });
        console.log('Token de prueba inmediato después de setup:', testToken);
        return {
            secret: secret.base32, // Devolver sin encriptar para mostrar al usuario
            qrCodeUrl,
            manualEntryKey
        };
    }
    /**
     * Verifica el código 2FA durante la configuración inicial
     * @param userId - ID de la tabla users (no user_id de auth.users)
     */
    async verify2FASetup(userId, token) {
        const tokenString = String(token).trim();
        // 🔓 Modo desarrollo: bypass 2FA con código específico
        if (process.env.DEV_MODE_2FA === 'true' && (tokenString === '000000' || tokenString === '123456')) {
            console.warn('🔓 Modo Dev 2FA activado - Bypass de verificación setup para userId:', userId);
            const supabase = (0, supabase_1.getSupabaseClient)();
            // Activar 2FA para el usuario en modo dev
            await supabase
                .from('users')
                .update({ two_factor_enabled: true })
                .eq('id', userId);
            return { success: true, message: '2FA configurado correctamente (modo dev)' };
        }
        const supabase = (0, supabase_1.getSupabaseClient)();
        // Obtener secret encriptado de la base de datos usando el ID de la tabla users
        const { data: userData, error: fetchError } = await supabase
            .from('users')
            .select('two_factor_secret')
            .eq('id', userId)
            .single();
        if (fetchError || !userData?.two_factor_secret) {
            console.error('Error obteniendo secret 2FA:', fetchError);
            return { success: false, message: '2FA no configurado para este usuario' };
        }
        // Desencriptar secret
        let decryptedSecret;
        try {
            decryptedSecret = this.encryptionService.decrypt(userData.two_factor_secret);
            console.log('Secret desencriptado correctamente para userId:', userId);
            console.log('Secret desencriptado (primeros 8 chars):', decryptedSecret.substring(0, 8) + '...');
        }
        catch (error) {
            console.error('Error al desencriptar secret 2FA:', error);
            return { success: false, message: 'Error al desencriptar secret 2FA' };
        }
        // Verificar token con ventana de ±3 períodos (90 segundos) y asegurar que token sea string
        console.log('Verificando token:', tokenString, 'para userId:', userId);
        const verified = speakeasy_1.default.totp.verify({
            secret: decryptedSecret,
            encoding: 'base32',
            token: tokenString,
            window: 3 // Permite códigos de ±90 segundos para mayor tolerancia
        });
        console.log('Resultado de verificación:', verified);
        if (verified) {
            // Activar 2FA para el usuario usando el ID de la tabla users
            const { error: updateError } = await supabase
                .from('users')
                .update({ two_factor_enabled: true })
                .eq('id', userId);
            if (updateError) {
                console.error('Error al activar 2FA:', updateError);
                return { success: false, message: 'Error al activar 2FA' };
            }
            return { success: true, message: '2FA configurado correctamente' };
        }
        else {
            // Generar un código de prueba para ayudar con el debugging
            const testToken = speakeasy_1.default.totp({
                secret: decryptedSecret,
                encoding: 'base32'
            });
            console.log('Token de prueba generado:', testToken);
            return { success: false, message: 'Código inválido. Verifica el código en Google Authenticator.' };
        }
    }
    /**
     * Verifica el código 2FA durante el login
     */
    async verify2FALogin(email, token) {
        const tokenString = String(token).trim();
        // 🔓 Modo desarrollo: bypass 2FA con código específico
        if (process.env.DEV_MODE_2FA === 'true' && (tokenString === '000000' || tokenString === '123456')) {
            console.warn('🔓 Modo Dev 2FA activado - Bypass de verificación login para email:', email);
            const user = await this.userService.getUserByEmail(email);
            if (!user) {
                return { success: false, message: 'Usuario no encontrado' };
            }
            return { success: true, userId: user.userId, message: 'Login exitoso (modo dev)' };
        }
        const supabase = (0, supabase_1.getSupabaseClient)();
        // Obtener usuario por email
        const user = await this.userService.getUserByEmail(email);
        if (!user) {
            return { success: false, message: 'Usuario no encontrado' };
        }
        // Verificar que tenga 2FA habilitado
        if (!user.twoFactorEnabled) {
            return { success: false, message: '2FA no configurado para este usuario' };
        }
        // Obtener secret encriptado
        const { data: userData, error: fetchError } = await supabase
            .from('users')
            .select('two_factor_secret')
            .eq('user_id', user.userId)
            .single();
        if (fetchError || !userData?.two_factor_secret) {
            return { success: false, message: '2FA no configurado para este usuario' };
        }
        // Desencriptar secret
        let decryptedSecret;
        try {
            decryptedSecret = this.encryptionService.decrypt(userData.two_factor_secret);
        }
        catch (error) {
            return { success: false, message: 'Error al desencriptar secret 2FA' };
        }
        // Verificar token con ventana de ±3 períodos y asegurar que token sea string
        const verified = speakeasy_1.default.totp.verify({
            secret: decryptedSecret,
            encoding: 'base32',
            token: tokenString,
            window: 3 // Permite códigos de ±90 segundos para mayor tolerancia
        });
        if (verified) {
            return { success: true, userId: user.userId };
        }
        else {
            return { success: false, message: 'Código 2FA inválido' };
        }
    }
    /**
     * Verifica si un usuario tiene 2FA habilitado
     */
    async is2FAEnabled(userId) {
        const user = await this.userService.getUserByAuthId(userId);
        return user?.twoFactorEnabled || false;
    }
}
exports.TwoFactorService = TwoFactorService;
//# sourceMappingURL=twoFactorService.js.map