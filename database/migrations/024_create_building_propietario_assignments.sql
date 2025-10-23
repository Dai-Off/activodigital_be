-- Migración para crear tabla de asignaciones propietario-edificio
-- Esto permite que los administradores asignen edificios a propietarios específicos

BEGIN;

-- 1. Crear tabla de asignaciones propietario-edificio
CREATE TABLE IF NOT EXISTS building_propietario_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    propietario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    
    -- Constraint para evitar asignaciones duplicadas
    UNIQUE(building_id, propietario_id)
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_building_propietario_assignments_building_id ON building_propietario_assignments(building_id);
CREATE INDEX IF NOT EXISTS idx_building_propietario_assignments_propietario_id ON building_propietario_assignments(propietario_id);
CREATE INDEX IF NOT EXISTS idx_building_propietario_assignments_assigned_by ON building_propietario_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_building_propietario_assignments_status ON building_propietario_assignments(status);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE building_propietario_assignments ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS
-- Policy 1: Los usuarios pueden ver asignaciones de edificios a los que tienen acceso
CREATE POLICY "Users can view propietario assignments for accessible buildings" ON building_propietario_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM buildings b
            JOIN users u ON u.id = auth.uid()::text
            WHERE b.id = building_propietario_assignments.building_id
            AND (
                b.owner_id = u.id OR -- Administrador del edificio
                u.id = building_propietario_assignments.propietario_id OR -- Propietario asignado
                EXISTS (
                    SELECT 1 FROM building_technician_assignments bta
                    WHERE bta.building_id = b.id AND bta.technician_id = u.id AND bta.status = 'active'
                ) OR -- Técnico asignado
                EXISTS (
                    SELECT 1 FROM building_cfo_assignments bca
                    WHERE bca.building_id = b.id AND bca.cfo_id = u.id AND bca.status = 'active'
                ) -- CFO asignado
            )
        )
    );

-- Policy 2: Solo administradores pueden insertar asignaciones
CREATE POLICY "Only administrators can create propietario assignments" ON building_propietario_assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON r.id = u.role_id
            WHERE u.user_id = auth.uid()::text
            AND r.name = 'administrador'
            AND u.id = assigned_by
        )
    );

-- Policy 3: Solo administradores pueden actualizar asignaciones
CREATE POLICY "Only administrators can update propietario assignments" ON building_propietario_assignments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON r.id = u.role_id
            WHERE u.user_id = auth.uid()::text
            AND r.name = 'administrador'
        )
    );

-- Policy 4: Solo administradores pueden eliminar asignaciones
CREATE POLICY "Only administrators can delete propietario assignments" ON building_propietario_assignments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON r.id = u.role_id
            WHERE u.user_id = auth.uid()::text
            AND r.name = 'administrador'
        )
    );

COMMIT;
