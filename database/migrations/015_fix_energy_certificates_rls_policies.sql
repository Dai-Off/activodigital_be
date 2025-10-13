-- Arreglar políticas RLS para permitir INSERT en tablas de certificados energéticos
-- El problema: las políticas solo tenían USING pero no WITH CHECK, 
-- lo que bloqueaba los INSERT

-- 1. Eliminar políticas existentes
DROP POLICY IF EXISTS energy_certificate_documents_user_policy ON energy_certificate_documents;
DROP POLICY IF EXISTS energy_certificate_sessions_user_policy ON energy_certificate_sessions;
DROP POLICY IF EXISTS energy_certificates_user_policy ON energy_certificates;

-- 2. Recrear políticas con WITH CHECK para permitir INSERT
CREATE POLICY energy_certificate_documents_user_policy ON energy_certificate_documents
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY energy_certificate_sessions_user_policy ON energy_certificate_sessions
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY energy_certificates_user_policy ON energy_certificates
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

