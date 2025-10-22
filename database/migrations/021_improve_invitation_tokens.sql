-- Migración para mejorar la generación de tokens y el template de email
-- Soluciona el problema del @ al inicio del link en los emails

BEGIN;

-- 1. Mejorar la función de generación de tokens para evitar caracteres problemáticos
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    token text;
    exists boolean;
BEGIN
    LOOP
        -- Generar token usando solo caracteres alfanuméricos seguros para URLs
        -- Usar base64url encoding que es más seguro para URLs
        token := replace(replace(encode(gen_random_bytes(24), 'base64'), '+', '-'), '/', '_');
        -- Remover padding = si existe
        token := rtrim(token, '=');
        
        -- Verificar que no exista
        SELECT EXISTS(SELECT 1 FROM invitations WHERE invitations.token = token) INTO exists;
        
        IF NOT exists THEN
            RETURN token;
        END IF;
    END LOOP;
END;
$$;

-- 2. Actualizar la función create_invitation para usar SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_invitation(
    p_email text,
    p_role_name text,
    p_building_id uuid,
    p_invited_by uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
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
    
    -- Generar token único mejorado
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

COMMIT;
