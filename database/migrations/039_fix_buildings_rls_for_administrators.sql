-- Migración para corregir la política RLS de buildings para incluir administradores
-- Los administradores deben poder ver todos los edificios que crearon (owner_id)

BEGIN;

-- Eliminar la política existente
DROP POLICY IF EXISTS buildings_access_policy ON buildings;

-- Crear nueva política que incluye administradores
CREATE POLICY buildings_access_policy ON buildings
    FOR ALL USING (
        -- El propietario puede acceder (usuario cuyo user_id = auth.uid() y su id = owner_id)
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.user_id = auth.uid() AND u.id = buildings.owner_id
        )
        OR
        -- El administrador puede acceder a edificios que creó (owner_id = su id)
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON r.id = u.role_id
            WHERE u.user_id = auth.uid() 
            AND r.name = 'administrador'
            AND u.id = buildings.owner_id
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
        OR
        -- El CFO asignado puede acceder
        EXISTS (
            SELECT 1 FROM building_cfo_assignments bcfa
            JOIN users u ON u.id = bcfa.cfo_id
            WHERE u.user_id = auth.uid() 
            AND bcfa.building_id = buildings.id 
            AND bcfa.status = 'active'
        )
        OR
        -- El propietario asignado puede acceder
        EXISTS (
            SELECT 1 FROM building_propietario_assignments bpa
            JOIN users u ON u.id = bpa.propietario_id
            WHERE u.user_id = auth.uid() 
            AND bpa.building_id = buildings.id 
            AND bpa.status = 'active'
        )
    );

COMMIT;

