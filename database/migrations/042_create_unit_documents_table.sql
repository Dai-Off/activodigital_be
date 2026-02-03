-- Migración para crear tabla de documentos de gestión de unidades
-- Almacena metadatos de documentos subidos al bucket unit-documents

BEGIN;

-- 1. Crear tabla de documentos de unidades
CREATE TABLE IF NOT EXISTS unit_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES building_units(id) ON DELETE CASCADE,
    
    -- Información del archivo
    file_name TEXT NOT NULL, -- Nombre original del archivo
    file_size BIGINT NOT NULL CHECK (file_size >= 0), -- Tamaño en bytes
    mime_type TEXT NOT NULL, -- Tipo MIME del archivo
    
    -- Información de almacenamiento
    storage_bucket TEXT NOT NULL DEFAULT 'unit-documents',
    storage_path TEXT NOT NULL, -- Ruta completa en storage: buildingId/unitId/category/filename
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
    UNIQUE(building_id, unit_id, storage_path)
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_unit_documents_building_id ON unit_documents(building_id);
CREATE INDEX IF NOT EXISTS idx_unit_documents_unit_id ON unit_documents(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_documents_category ON unit_documents(category);
CREATE INDEX IF NOT EXISTS idx_unit_documents_status ON unit_documents(status);
CREATE INDEX IF NOT EXISTS idx_unit_documents_uploaded_at ON unit_documents(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_unit_documents_expiration_date ON unit_documents(expiration_date);
CREATE INDEX IF NOT EXISTS idx_unit_documents_unit_category ON unit_documents(unit_id, category);
CREATE INDEX IF NOT EXISTS idx_unit_documents_storage_path ON unit_documents(storage_path);

-- 3. Trigger para updated_at
CREATE TRIGGER update_unit_documents_updated_at 
    BEFORE UPDATE ON unit_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Habilitar RLS
ALTER TABLE unit_documents ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS
-- Los usuarios autenticados pueden ver documentos de unidades a las que tienen acceso
CREATE POLICY unit_documents_select_policy ON unit_documents
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM buildings b
            WHERE b.id = unit_documents.building_id
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

-- Los usuarios autenticados pueden insertar documentos en unidades a las que tienen acceso
CREATE POLICY unit_documents_insert_policy ON unit_documents
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM buildings b
            WHERE b.id = unit_documents.building_id
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
CREATE POLICY unit_documents_update_policy ON unit_documents
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        (
            uploaded_by = auth.uid()
            OR
            EXISTS (
                SELECT 1 FROM buildings b
                WHERE b.id = unit_documents.building_id
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
CREATE POLICY unit_documents_delete_policy ON unit_documents
    FOR DELETE
    USING (
        auth.role() = 'authenticated' AND
        (
            uploaded_by = auth.uid()
            OR
            EXISTS (
                SELECT 1 FROM buildings b
                WHERE b.id = unit_documents.building_id
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

COMMENT ON TABLE unit_documents IS 'Documentos de gestión de unidades almacenados en Supabase Storage';
COMMENT ON COLUMN unit_documents.storage_path IS 'Ruta completa en storage: buildingId/unitId/category/timestamp_randomId_originalName.ext';
COMMENT ON COLUMN unit_documents.storage_file_name IS 'Nombre del archivo en storage con timestamp y randomId';
COMMENT ON COLUMN unit_documents.category IS 'Valor de categoría: financial, contracts, maintenance, public, internal, legal, certificates, technical, o custom_*';
COMMENT ON COLUMN unit_documents.status IS 'Estado del documento: activo, pendiente, aprobado, proximo-vencer';

COMMIT;

