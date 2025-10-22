-- Migración para corregir el problema de RLS en la función create_invitation
-- El problema es que las funciones PostgreSQL están sujetas a RLS por defecto

BEGIN;

-- Hacer que la función create_invitation sea SECURITY DEFINER
-- Esto significa que ejecutará con los privilegios del usuario que creó la función (superusuario)
-- y podrá insertar en la tabla invitations sin restricciones RLS
CREATE OR REPLACE FUNCTION create_invitation(
    p_email text,
    p_role_name text,
    p_building_id uuid,
    p_invited_by uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER  -- Esta es la clave: ejecuta con privilegios del creador
AS $$
DECLARE
    v_role_id uuid;
    v_invitation_id uuid;
    v_token text;
BEGIN
    -- Obtener el ID del rol
    SELECT id INTO v_role_id FROM roles WHERE name = p_role_name;
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Rol % no encontrado', p_role_name;
    END IF;
    
    -- Generar token único
    v_token := generate_invitation_token();
    
    -- Crear la invitación
    INSERT INTO invitations (email, role_id, building_id, invited_by, token, expires_at)
    VALUES (
        p_email,
        v_role_id,
        p_building_id,
        p_invited_by,
        v_token,
        NOW() + INTERVAL '7 days' -- Las invitaciones expiran en 7 días
    )
    RETURNING id INTO v_invitation_id;
    
    RETURN v_invitation_id;
END;
$$;

-- También hacer SECURITY DEFINER a la función accept_invitation para consistencia
CREATE OR REPLACE FUNCTION accept_invitation(
    p_token text,
    p_user_id uuid,
    p_full_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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
        VALUES (v_building_id, p_user_id, v_invitation.invited_by, 'active');
    ELSIF v_role_name = 'cfo' THEN
        INSERT INTO building_cfo_assignments (building_id, cfo_id, assigned_by, status)
        VALUES (v_building_id, p_user_id, v_invitation.invited_by, 'active');
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

COMMIT;
