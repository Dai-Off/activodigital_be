-- Migración para agregar autenticación de dos factores (2FA) obligatoria
-- Agrega columnas para almacenar el secret TOTP y el estado de habilitación

-- 1. Agregar columnas para 2FA en la tabla users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;

-- 2. Crear índice para mejorar búsquedas por estado de 2FA
CREATE INDEX IF NOT EXISTS idx_users_two_factor_enabled ON users(two_factor_enabled);

-- 3. Comentarios para documentación
COMMENT ON COLUMN users.two_factor_secret IS 'Secret TOTP encriptado para Google Authenticator';
COMMENT ON COLUMN users.two_factor_enabled IS 'Indica si el usuario tiene 2FA habilitado y configurado';

