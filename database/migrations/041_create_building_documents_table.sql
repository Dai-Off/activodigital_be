-- Migración para crear tabla de documentos de gestión de edificios
-- Almacena metadatos de documentos subidos al bucket building-documents

BEGIN;

-- 1. Crear tabla de documentos de edificios
CREATE TABLE IF NOT EXISTS building_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    
    -- Información del archivo
    file_name TEXT NOT NULL, -- Nombre original del archivo
    file_size BIGINT NOT NULL CHECK (file_size >= 0), -- Tamaño en bytes
    mime_type TEXT NOT NULL, -- Tipo MIME del archivo
    
    -- Información de almacenamiento
    storage_bucket TEXT NOT NULL DEFAULT 'building-documents',
    storage_path TEXT NOT NULL, -- Ruta completa en storage: buildingId/category/filename
    storage_file_name TEXT NOT NULL, -- Nombre del archivo en storage (con timestamp)
    
    -- Categorización
    category TEXT NOT NULL, -- Valor de categoría (financial, contracts, maintenance, etc.)
    category_label TEXT, -- Etiqueta legible de la categoría (opcional, para búsquedas)
    subcategory TEXT DEFAULT 'General', -- Subcategoría (por defecto "General")
    
    -- Estado y metadatos
    status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'pendiente', 'aprobado', 'proximo-vencer')),
    expiration_date DATE, -- Fecha de vencimiento si aplica
    title TEXT, -- Título descriptivo del documento (opcional)
    notes TEXT, -- Notas adicionales
    
    -- Información de contrato (opcional, para documentos tipo contrato)
    contract_provider TEXT, -- proveedor
    contract_amount TEXT, -- importe
    contract_expiration DATE, -- vencimiento (se puede convertir a string en el servicio)
    contract_renewal TEXT, -- renovacion
    
    -- URLs (pueden regenerarse, pero guardamos la última conocida)
    signed_url TEXT, -- URL firmada de Supabase Storage
    signed_url_expires_at TIMESTAMP WITH TIME ZONE, -- Cuándo expira la URL firmada
    
    -- Audit
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: evitar duplicados exactos
    UNIQUE(building_id, storage_path)
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_building_documents_building_id ON building_documents(building_id);
CREATE INDEX IF NOT EXISTS idx_building_documents_category ON building_documents(category);
CREATE INDEX IF NOT EXISTS idx_building_documents_status ON building_documents(status);
CREATE INDEX IF NOT EXISTS idx_building_documents_uploaded_at ON building_documents(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_building_documents_expiration_date ON building_documents(expiration_date);
CREATE INDEX IF NOT EXISTS idx_building_documents_building_category ON building_documents(building_id, category);
CREATE INDEX IF NOT EXISTS idx_building_documents_storage_path ON building_documents(storage_path);

-- 3. Trigger para updated_at
CREATE TRIGGER update_building_documents_updated_at 
    BEFORE UPDATE ON building_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Habilitar RLS
ALTER TABLE building_documents ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS
-- Los usuarios autenticados pueden ver documentos de edificios a los que tienen acceso
CREATE POLICY building_documents_select_policy ON building_documents
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM buildings b
            WHERE b.id = building_documents.building_id
            AND (
                -- Usuario es propietario del edificio (owner_id)
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.user_id = auth.uid()
                    AND u.id = b.owner_id
                )
                OR
                -- Usuario es propietario asignado
                EXISTS (
                    SELECT 1 FROM building_propietario_assignments bpa
                    JOIN users u ON u.id = bpa.propietario_id
                    WHERE u.user_id = auth.uid()
                    AND bpa.building_id = b.id
                    AND bpa.status = 'active'
                )
                OR
                -- Usuario tiene rol de administrador
                EXISTS (
                    SELECT 1 FROM users u
                    JOIN roles r ON r.id = u.role_id
                    WHERE u.user_id = auth.uid()
                    AND r.name = 'administrador'
                )
                OR
                -- Usuario es técnico asignado
                EXISTS (
                    SELECT 1 FROM building_technician_assignments bta
                    JOIN users u ON u.id = bta.technician_id
                    WHERE u.user_id = auth.uid()
                    AND bta.building_id = b.id
                    AND bta.status = 'active'
                )
            )
        )
    );

-- Los usuarios autenticados pueden insertar documentos en edificios a los que tienen acceso
CREATE POLICY building_documents_insert_policy ON building_documents
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM buildings b
            WHERE b.id = building_documents.building_id
            AND (
                -- Usuario es propietario del edificio (owner_id)
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.user_id = auth.uid()
                    AND u.id = b.owner_id
                )
                OR
                -- Usuario es propietario asignado
                EXISTS (
                    SELECT 1 FROM building_propietario_assignments bpa
                    JOIN users u ON u.id = bpa.propietario_id
                    WHERE u.user_id = auth.uid()
                    AND bpa.building_id = b.id
                    AND bpa.status = 'active'
                )
                OR
                -- Usuario tiene rol de administrador
                EXISTS (
                    SELECT 1 FROM users u
                    JOIN roles r ON r.id = u.role_id
                    WHERE u.user_id = auth.uid()
                    AND r.name = 'administrador'
                )
                OR
                -- Usuario es técnico asignado
                EXISTS (
                    SELECT 1 FROM building_technician_assignments bta
                    JOIN users u ON u.id = bta.technician_id
                    WHERE u.user_id = auth.uid()
                    AND bta.building_id = b.id
                    AND bta.status = 'active'
                )
            )
        )
    );

-- Los usuarios autenticados pueden actualizar documentos que subieron o tienen acceso al edificio
CREATE POLICY building_documents_update_policy ON building_documents
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        (
            uploaded_by = auth.uid()
            OR
            EXISTS (
                SELECT 1 FROM buildings b
                WHERE b.id = building_documents.building_id
                AND (
                    -- Usuario es propietario del edificio (owner_id)
                    EXISTS (
                        SELECT 1 FROM users u
                        WHERE u.user_id = auth.uid()
                        AND u.id = b.owner_id
                    )
                    OR
                    -- Usuario es propietario asignado
                    EXISTS (
                        SELECT 1 FROM building_propietario_assignments bpa
                        JOIN users u ON u.id = bpa.propietario_id
                        WHERE u.user_id = auth.uid()
                        AND bpa.building_id = b.id
                        AND bpa.status = 'active'
                    )
                    OR
                    -- Usuario tiene rol de administrador
                    EXISTS (
                        SELECT 1 FROM users u
                        JOIN roles r ON r.id = u.role_id
                        WHERE u.user_id = auth.uid()
                        AND r.name = 'administrador'
                    )
                    OR
                    -- Usuario es técnico asignado
                    EXISTS (
                        SELECT 1 FROM building_technician_assignments bta
                        JOIN users u ON u.id = bta.technician_id
                        WHERE u.user_id = auth.uid()
                        AND bta.building_id = b.id
                        AND bta.status = 'active'
                    )
                )
            )
        )
    );

-- Los usuarios autenticados pueden eliminar documentos que subieron o tienen acceso al edificio
CREATE POLICY building_documents_delete_policy ON building_documents
    FOR DELETE
    USING (
        auth.role() = 'authenticated' AND
        (
            uploaded_by = auth.uid()
            OR
            EXISTS (
                SELECT 1 FROM buildings b
                WHERE b.id = building_documents.building_id
                AND (
                    -- Usuario es propietario del edificio (owner_id)
                    EXISTS (
                        SELECT 1 FROM users u
                        WHERE u.user_id = auth.uid()
                        AND u.id = b.owner_id
                    )
                    OR
                    -- Usuario es propietario asignado
                    EXISTS (
                        SELECT 1 FROM building_propietario_assignments bpa
                        JOIN users u ON u.id = bpa.propietario_id
                        WHERE u.user_id = auth.uid()
                        AND bpa.building_id = b.id
                        AND bpa.status = 'active'
                    )
                    OR
                    -- Usuario tiene rol de administrador
                    EXISTS (
                        SELECT 1 FROM users u
                        JOIN roles r ON r.id = u.role_id
                        WHERE u.user_id = auth.uid()
                        AND r.name = 'administrador'
                    )
                    OR
                    -- Usuario es técnico asignado
                    EXISTS (
                        SELECT 1 FROM building_technician_assignments bta
                        JOIN users u ON u.id = bta.technician_id
                        WHERE u.user_id = auth.uid()
                        AND bta.building_id = b.id
                        AND bta.status = 'active'
                    )
                )
            )
        )
    );

COMMENT ON TABLE building_documents IS 'Documentos de gestión de edificios almacenados en Supabase Storage';
COMMENT ON COLUMN building_documents.storage_path IS 'Ruta completa en storage: buildingId/category/timestamp_randomId_originalName.ext';
COMMENT ON COLUMN building_documents.storage_file_name IS 'Nombre del archivo en storage con timestamp y randomId';
COMMENT ON COLUMN building_documents.category IS 'Valor de categoría: financial, contracts, maintenance, public, internal, legal, certificates, technical, o custom_*';
COMMENT ON COLUMN building_documents.status IS 'Estado del documento: activo, pendiente, aprobado, proximo-vencer';

COMMIT;

