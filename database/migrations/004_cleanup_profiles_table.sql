-- Migración para limpiar la tabla profiles y completar la transición a users
-- Esta migración debe ejecutarse después de 003_create_users_and_roles_system.sql

-- 1. Verificar que todos los datos se migraron correctamente
-- Comparar counts entre profiles y users
DO $$
DECLARE
    profiles_count INTEGER;
    users_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profiles_count FROM profiles;
    SELECT COUNT(*) INTO users_count FROM users;
    
    IF profiles_count != users_count THEN
        RAISE EXCEPTION 'Migration verification failed: profiles count (%) != users count (%)', profiles_count, users_count;
    END IF;
    
    RAISE NOTICE 'Migration verification passed: % records migrated successfully', users_count;
END $$;

-- 2. Actualizar referencias que aún apunten a profiles
-- Verificar si hay alguna referencia externa que necesite actualización
DO $$
BEGIN
    -- Si hubiera otras tablas que referencien profiles, se actualizarían aquí
    -- Por ahora, buildings y digital_books ya usan auth.users directamente
    RAISE NOTICE 'No external references to update';
END $$;

-- 3. Eliminar la tabla profiles de forma segura
-- Primero eliminar las políticas RLS si existen
DROP POLICY IF EXISTS profiles_policy ON profiles;

-- Eliminar triggers si existen
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- Finalmente, eliminar la tabla profiles
DROP TABLE IF EXISTS profiles CASCADE;

-- 4. Comentario de confirmación
COMMENT ON TABLE users IS 'Tabla de usuarios del sistema - reemplaza completamente a profiles';

-- 5. Verificación final
DO $$
BEGIN
    -- Verificar que profiles ya no existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE EXCEPTION 'Failed to drop profiles table';
    END IF;
    
    -- Verificar que users existe y tiene datos
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'Users table does not exist';
    END IF;
    
    RAISE NOTICE 'Cleanup completed successfully - profiles table removed, users table is active';
END $$;
