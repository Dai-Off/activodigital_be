-- Migración para implementar sistema de usuarios y roles
-- Cambia de 'profiles' a 'users' con relaciones a roles y edificios

-- 1. Crear tabla de roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar roles predefinidos
INSERT INTO roles (name, description) VALUES 
    ('tenedor', 'Usuario propietario que puede crear edificios y asignar técnicos'),
    ('tecnico', 'Usuario técnico que gestiona libros digitales de edificios asignados');

-- 2. Crear tabla de usuarios (reemplazo de profiles)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Migrar datos existentes de profiles a users (si existen)
-- Primero necesitamos obtener los IDs de los roles
DO $$
DECLARE
    tenedor_role_id UUID;
    tecnico_role_id UUID;
BEGIN
    -- Obtener IDs de roles
    SELECT id INTO tenedor_role_id FROM roles WHERE name = 'tenedor';
    SELECT id INTO tecnico_role_id FROM roles WHERE name = 'tecnico';
    
    -- Migrar datos de profiles existentes si la tabla existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        INSERT INTO users (user_id, email, full_name, role_id)
        SELECT 
            user_id,
            email,
            full_name,
            CASE 
                WHEN role = 'tenedor' THEN tenedor_role_id
                WHEN role = 'tecnico' THEN tecnico_role_id
                ELSE tenedor_role_id -- Por defecto asignar tenedor si no coincide
            END
        FROM profiles;
    END IF;
END $$;

-- 4. Crear tabla de asignaciones técnico-edificio
CREATE TABLE building_technician_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    
    -- Constraint para evitar asignaciones duplicadas
    UNIQUE(building_id, technician_id)
);

-- 5. Agregar campos faltantes a la tabla buildings
ALTER TABLE buildings 
ADD COLUMN price DECIMAL(15,2),
ADD COLUMN technician_email VARCHAR(255),
ADD COLUMN owner_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 6. Actualizar buildings existentes para asignar owner_id basado en user_id actual
UPDATE buildings 
SET owner_id = (
    SELECT u.id 
    FROM users u 
    WHERE u.user_id = buildings.user_id
);

-- 7. Actualizar digital_books para usar la nueva estructura
-- Agregar campo technician_id para identificar quién gestiona el libro
ALTER TABLE digital_books 
ADD COLUMN technician_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Actualizar libros existentes para asignar technician_id basado en user_id actual
UPDATE digital_books 
SET technician_id = (
    SELECT u.id 
    FROM users u 
    WHERE u.user_id = digital_books.user_id
);

-- 8. Índices para mejorar rendimiento
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_building_assignments_building_id ON building_technician_assignments(building_id);
CREATE INDEX idx_building_assignments_technician_id ON building_technician_assignments(technician_id);
CREATE INDEX idx_building_assignments_status ON building_technician_assignments(status);

CREATE INDEX idx_buildings_owner_id ON buildings(owner_id);
CREATE INDEX idx_buildings_price ON buildings(price);

CREATE INDEX idx_digital_books_technician_id ON digital_books(technician_id);

-- 9. Triggers para actualizar updated_at
CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Políticas de seguridad (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE building_technician_assignments ENABLE ROW LEVEL SECURITY;

-- Política para users: los usuarios pueden ver su propia información
CREATE POLICY users_own_data_policy ON users
    FOR ALL USING (auth.uid() = user_id);

-- Política para roles: todos los usuarios autenticados pueden leer roles
CREATE POLICY roles_read_policy ON roles
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Política para asignaciones: solo el propietario y técnico asignado pueden ver
CREATE POLICY assignments_policy ON building_technician_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.user_id = auth.uid() 
            AND (u.id = assigned_by OR u.id = technician_id)
        )
    );

-- 11. Actualizar políticas existentes de buildings
DROP POLICY IF EXISTS buildings_user_policy ON buildings;

-- Nueva política para buildings: propietarios y técnicos asignados pueden acceder
CREATE POLICY buildings_access_policy ON buildings
    FOR ALL USING (
        -- El propietario puede acceder
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.user_id = auth.uid() AND u.id = owner_id
        )
        OR
        -- El técnico asignado puede acceder
        EXISTS (
            SELECT 1 FROM building_technician_assignments bta
            JOIN users u ON u.id = bta.technician_id
            WHERE u.user_id = auth.uid() 
            AND bta.building_id = buildings.id 
            AND bta.status = 'active'
        )
    );

-- 12. Actualizar políticas de digital_books
DROP POLICY IF EXISTS digital_books_user_policy ON digital_books;

-- Nueva política para digital_books: solo técnicos asignados pueden gestionar
CREATE POLICY digital_books_technician_policy ON digital_books
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.user_id = auth.uid() AND u.id = technician_id
        )
        OR
        -- El propietario del edificio puede ver (solo lectura)
        EXISTS (
            SELECT 1 FROM buildings b
            JOIN users u ON u.id = b.owner_id
            WHERE u.user_id = auth.uid() 
            AND b.id = digital_books.building_id
        )
    );

-- 13. Comentarios para documentación
COMMENT ON TABLE roles IS 'Tabla de roles del sistema (tenedor, tecnico)';
COMMENT ON TABLE users IS 'Tabla de usuarios del sistema con roles asignados';
COMMENT ON TABLE building_technician_assignments IS 'Asignaciones de técnicos a edificios';

COMMENT ON COLUMN buildings.price IS 'Precio del edificio';
COMMENT ON COLUMN buildings.technician_email IS 'Email del técnico asignado para crear el libro digital';
COMMENT ON COLUMN buildings.owner_id IS 'ID del usuario propietario (tenedor) del edificio';

COMMENT ON COLUMN digital_books.technician_id IS 'ID del técnico que gestiona este libro digital';

-- 14. Eliminar tabla profiles después de migrar datos (comentado por seguridad)
-- DROP TABLE IF EXISTS profiles;
