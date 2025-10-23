-- Ejecutar esta función completa
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
    SELECT * INTO v_invitation 
    FROM invitations 
    WHERE token = p_token 
    AND status = 'pending' 
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitación no válida o expirada';
    END IF;
    
    SELECT r.name INTO v_role_name 
    FROM roles r 
    WHERE r.id = v_invitation.role_id;
    
    v_user_email := v_invitation.email;
    v_building_id := v_invitation.building_id;
    
    UPDATE invitations 
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = v_invitation.id;
    
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
    
    v_result := jsonb_build_object(
        'invitation_id', v_invitation.id,
        'role', v_role_name,
        'building_id', v_building_id,
        'email', v_user_email
    );
    
    RETURN v_result;
END;
$$;
