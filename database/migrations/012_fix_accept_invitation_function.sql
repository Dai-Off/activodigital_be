-- Migración para corregir la función accept_invitation
-- Corrige el problema de foreign key constraint en building_technician_assignments

BEGIN;

-- Corregir la función accept_invitation para usar el ID correcto de la tabla users
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
    v_user_profile_id uuid; -- Nuevo: ID del perfil en la tabla users
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
    
    -- Obtener el ID del perfil de usuario en la tabla users
    SELECT id INTO v_user_profile_id 
    FROM users 
    WHERE user_id = p_user_id;
    
    IF v_user_profile_id IS NULL THEN
        RAISE EXCEPTION 'Perfil de usuario no encontrado';
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
    
    -- Crear asignación según el rol usando el ID correcto de la tabla users
    IF v_role_name = 'tecnico' THEN
        INSERT INTO building_technician_assignments (building_id, technician_id, assigned_by, status)
        VALUES (v_building_id, v_user_profile_id, v_invitation.invited_by, 'active');
    ELSIF v_role_name = 'cfo' THEN
        INSERT INTO building_cfo_assignments (building_id, cfo_id, assigned_by, status)
        VALUES (v_building_id, v_user_profile_id, v_invitation.invited_by, 'active');
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
