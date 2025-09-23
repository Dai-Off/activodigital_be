-- Script para inicializar roles básicos del sistema
-- Ejecutar este script cuando la base de datos esté vacía

-- 1. Crear tabla de roles si no existe
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insertar roles predefinidos (usa ON CONFLICT para evitar duplicados)      
INSERT INTO roles (name, description) VALUES
    ('tenedor', 'Usuario propietario que puede crear edificios y asignar técnicos'),                                                                           
    ('tecnico', 'Usuario técnico que gestiona libros digitales de edificios asignados'),
    ('administrador', 'Usuario administrador con acceso completo al sistema'),
    ('cfo', 'Usuario CFO con acceso a información financiera y reportes')                                                                        
ON CONFLICT (name) DO NOTHING;

-- 3. Verificar que se crearon correctamente
SELECT * FROM roles;
