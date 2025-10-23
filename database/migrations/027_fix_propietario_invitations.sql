-- Migración para corregir el sistema de invitaciones de propietarios
-- Asegura que las invitaciones de propietarios se procesen correctamente

BEGIN;

-- 1. Actualizar la función accept_invitation para manejar propietarios correctamente
CREATE OR REPLACE FUNCTION accept_invitation(
    p_token text,
    p_user_id uuid,
    p_full_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_invitation invitations%ROWTYPE;
    v_user_email text;
    v_role_name text;
    v_building_id uuid;
    v_result jsonb;
BEGIN
    -- Buscar la invitación
    SELECT * INTO v_invitation 
    FROM invitations 
    WHERE token = p_token 
    AND status = 'pending' 
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitación no válida o expirada';
    END IF;
    
    -- Obtener información del rol y edificio
    SELECT r.name INTO v_role_name 
    FROM roles r 
    WHERE r.id = v_invitation.role_id;
    
    v_user_email := v_invitation.email;
    v_building_id := v_invitation.building_id;
    
    -- Actualizar la invitación como aceptada
    UPDATE invitations 
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = v_invitation.id;
    
    -- Crear asignación según el rol
    IF v_role_name = 'tecnico' THEN
        INSERT INTO building_technician_assignments (building_id, technician_id, assigned_by, status)
        VALUES (v_building_id, p_user_id, v_invitation.invited_by, 'active')
        ON CONFLICT (building_id, technician_id) DO NOTHING;
    ELSIF v_role_name = 'cfo' THEN
        INSERT INTO building_cfo_assignments (building_id, cfo_id, assigned_by, status)
        VALUES (v_building_id, p_user_id, v_invitation.invited_by, 'active')
        ON CONFLICT (building_id, cfo_id) DO NOTHING;
    ELSIF v_role_name = 'propietario' THEN
        INSERT INTO building_propietario_assignments (building_id, propietario_id, assigned_by, status)
        VALUES (v_building_id, p_user_id, v_invitation.invited_by, 'active')
        ON CONFLICT (building_id, propietario_id) DO NOTHING;
    END IF;
    
    -- Retornar información útil
    v_result := jsonb_build_object(
        'invitation_id', v_invitation.id,
        'role', v_role_name,
        'building_id', v_building_id,
        'email', v_user_email
    );
    
    RETURN v_result;
END;
$$;

-- 2. Crear función para procesar asignaciones pendientes automáticamente
CREATE OR REPLACE FUNCTION process_pending_assignments_for_user(p_email text)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_record users%ROWTYPE;
    v_invitation invitations%ROWTYPE;
    v_role_name text;
    v_building_owner_id uuid;
    v_processed_count integer := 0;
BEGIN
    -- Buscar el usuario por email
    SELECT * INTO v_user_record FROM users WHERE email = p_email;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Buscar invitaciones pendientes para este usuario
    FOR v_invitation IN 
        SELECT i.* FROM invitations i
        JOIN roles r ON r.id = i.role_id
        WHERE i.email = p_email 
        AND i.status = 'pending' 
        AND i.expires_at > NOW()
    LOOP
        -- Obtener el nombre del rol
        SELECT r.name INTO v_role_name 
        FROM roles r 
        WHERE r.id = v_invitation.role_id;
        
        -- Obtener el propietario del edificio
        SELECT owner_id INTO v_building_owner_id 
        FROM buildings 
        WHERE id = v_invitation.building_id;
        
        -- Crear asignación según el rol
        IF v_role_name = 'tecnico' THEN
            INSERT INTO building_technician_assignments (building_id, technician_id, assigned_by, status)
            VALUES (v_invitation.building_id, v_user_record.id, v_building_owner_id, 'active')
            ON CONFLICT (building_id, technician_id) DO NOTHING;
        ELSIF v_role_name = 'cfo' THEN
            INSERT INTO building_cfo_assignments (building_id, cfo_id, assigned_by, status)
            VALUES (v_invitation.building_id, v_user_record.id, v_building_owner_id, 'active')
            ON CONFLICT (building_id, cfo_id) DO NOTHING;
        ELSIF v_role_name = 'propietario' THEN
            INSERT INTO building_propietario_assignments (building_id, propietario_id, assigned_by, status)
            VALUES (v_invitation.building_id, v_user_record.id, v_building_owner_id, 'active')
            ON CONFLICT (building_id, propietario_id) DO NOTHING;
        END IF;
        
        v_processed_count := v_processed_count + 1;
    END LOOP;
    
    RETURN v_processed_count;
END;
$$;

-- 3. Crear índices adicionales para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_invitations_email_status ON invitations(email, status);
CREATE INDEX IF NOT EXISTS idx_invitations_email_expires ON invitations(email, expires_at);

-- 4. Comentarios para documentación
COMMENT ON FUNCTION process_pending_assignments_for_user(text) IS 'Procesa automáticamente las asignaciones pendientes para un usuario específico';

COMMIT;
