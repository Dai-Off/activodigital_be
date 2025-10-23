-- Migración para implementar sistema de invitaciones
-- Permite invitar técnicos y CFOs por email y gestionar su registro

BEGIN;

-- 1. Crear tabla de invitaciones
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Evitar invitaciones duplicadas para el mismo email y edificio
    UNIQUE(email, building_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- 2. Crear tabla de asignaciones CFO-edificio (similar a building_technician_assignments)
CREATE TABLE building_cfo_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    cfo_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    
    -- Evitar asignaciones duplicadas
    UNIQUE(building_id, cfo_id)
);

-- 3. Crear índices para mejorar rendimiento
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_building_id ON invitations(building_id);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);

CREATE INDEX idx_building_cfo_assignments_building_id ON building_cfo_assignments(building_id);
CREATE INDEX idx_building_cfo_assignments_cfo_id ON building_cfo_assignments(cfo_id);
CREATE INDEX idx_building_cfo_assignments_status ON building_cfo_assignments(status);

-- 4. Función para generar tokens únicos para invitaciones
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    token text;
    exists boolean;
BEGIN
    LOOP
        -- Generar token aleatorio de 32 caracteres
        token := encode(gen_random_bytes(24), 'base64');
        
        -- Verificar que no exista
        SELECT EXISTS(SELECT 1 FROM invitations WHERE invitations.token = token) INTO exists;
        
        IF NOT exists THEN
            RETURN token;
        END IF;
    END LOOP;
END;
$$;

-- 5. Función para crear invitación
CREATE OR REPLACE FUNCTION create_invitation(
    p_email text,
    p_role_name text,
    p_building_id uuid,
    p_invited_by uuid
)
RETURNS uuid
LANGUAGE plpgsql
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

-- 6. Función para aceptar invitación y crear usuario
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
        VALUES (v_building_id, p_user_id, v_invitation.invited_by, 'active');
    ELSIF v_role_name = 'cfo' THEN
        INSERT INTO building_cfo_assignments (building_id, cfo_id, assigned_by, status)
        VALUES (v_building_id, p_user_id, v_invitation.invited_by, 'active');
    ELSIF v_role_name = 'propietario' THEN
        INSERT INTO building_propietario_assignments (building_id, propietario_id, assigned_by, status)
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

-- 7. Trigger para actualizar updated_at
CREATE TRIGGER update_invitations_updated_at 
    BEFORE UPDATE ON invitations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Políticas de seguridad (Row Level Security)
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE building_cfo_assignments ENABLE ROW LEVEL SECURITY;

-- Política para invitations: solo el que invitó puede ver sus invitaciones
CREATE POLICY invitations_inviter_policy ON invitations
    FOR ALL USING (invited_by = (
        SELECT id FROM users WHERE user_id = auth.uid()
    ));

-- Política para building_cfo_assignments: similar a building_technician_assignments
CREATE POLICY building_cfo_assignments_policy ON building_cfo_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.user_id = auth.uid() 
            AND (u.id = assigned_by OR u.id = cfo_id)
        )
    );

-- 9. Función para limpiar invitaciones expiradas (se puede llamar periódicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    v_count integer;
BEGIN
    UPDATE invitations 
    SET status = 'expired'
    WHERE status = 'pending' 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- 10. Comentarios para documentación
COMMENT ON TABLE invitations IS 'Tabla de invitaciones para técnicos y CFOs';
COMMENT ON TABLE building_cfo_assignments IS 'Asignaciones de CFOs a edificios';
COMMENT ON COLUMN invitations.token IS 'Token único para aceptar la invitación';
COMMENT ON COLUMN invitations.expires_at IS 'Fecha de expiración de la invitación (7 días por defecto)';

COMMIT;
