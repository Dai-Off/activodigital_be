-- Migración para corregir las políticas RLS de energy_certificate_sessions
-- Asegura que los usuarios puedan crear sesiones de certificados energéticos

BEGIN;

-- 1. Eliminar políticas existentes si existen
DROP POLICY IF EXISTS energy_certificate_sessions_user_policy ON energy_certificate_sessions;
DROP POLICY IF EXISTS energy_certificate_documents_user_policy ON energy_certificate_documents;
DROP POLICY IF EXISTS energy_certificates_user_policy ON energy_certificates;

-- 2. Recrear políticas con WITH CHECK para permitir INSERT
CREATE POLICY energy_certificate_sessions_user_policy ON energy_certificate_sessions
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY energy_certificate_documents_user_policy ON energy_certificate_documents
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY energy_certificates_user_policy ON energy_certificates
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Verificar que RLS esté habilitado
ALTER TABLE energy_certificate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_certificate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_certificates ENABLE ROW LEVEL SECURITY;

-- 4. Comentarios para documentación
COMMENT ON POLICY energy_certificate_sessions_user_policy ON energy_certificate_sessions IS 'Permite a los usuarios acceder solo a sus propias sesiones de certificados energéticos';
COMMENT ON POLICY energy_certificate_documents_user_policy ON energy_certificate_documents IS 'Permite a los usuarios acceder solo a sus propios documentos de certificados energéticos';
COMMENT ON POLICY energy_certificates_user_policy ON energy_certificates IS 'Permite a los usuarios acceder solo a sus propios certificados energéticos';

COMMIT;
