-- Migración para agregar roles de administrador y CFO
-- Ejecutar después de la migración 003

-- Insertar nuevos roles
INSERT INTO roles (name, description) VALUES
    ('administrador', 'Usuario administrador con acceso completo al sistema'),
    ('cfo', 'Usuario CFO con acceso a información financiera y reportes')
ON CONFLICT (name) DO NOTHING;

-- Verificar que se agregaron correctamente
SELECT * FROM roles ORDER BY name;
