-- Crear extensión para UUIDs si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla para documentos de certificados energéticos
CREATE TABLE energy_certificate_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabla para sesiones de extracción de certificados energéticos
CREATE TABLE energy_certificate_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    kind VARCHAR(20) NOT NULL CHECK (kind IN ('building', 'dwelling', 'commercial_unit')),
    status VARCHAR(20) NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'extracted', 'reviewed', 'confirmed', 'failed')),
    documents UUID[] DEFAULT '{}'::uuid[], -- Array de IDs de documentos
    extracted_data JSONB, -- Datos extraídos por IA
    edited_data JSONB, -- Modificaciones del técnico
    reviewer_user_id UUID REFERENCES auth.users(id),
    error_message TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para certificados energéticos confirmados
CREATE TABLE energy_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    kind VARCHAR(20) NOT NULL CHECK (kind IN ('building', 'dwelling', 'commercial_unit')),
    rating CHAR(1) NOT NULL CHECK (rating IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'ND')),
    primary_energy_kwh_per_m2_year DECIMAL(10,2) NOT NULL,
    emissions_kg_co2_per_m2_year DECIMAL(10,2) NOT NULL,
    certificate_number VARCHAR(255) NOT NULL,
    scope VARCHAR(20) NOT NULL CHECK (scope IN ('building', 'dwelling', 'commercial_unit')),
    issuer_name VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    property_reference VARCHAR(255),
    notes TEXT,
    source_document_url TEXT, -- URL del documento original del certificado
    source_session_id UUID REFERENCES energy_certificate_sessions(id),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_energy_certificate_documents_building_id ON energy_certificate_documents(building_id);
CREATE INDEX idx_energy_certificate_documents_user_id ON energy_certificate_documents(user_id);
CREATE INDEX idx_energy_certificate_documents_uploaded_at ON energy_certificate_documents(uploaded_at);

CREATE INDEX idx_energy_certificate_sessions_building_id ON energy_certificate_sessions(building_id);
CREATE INDEX idx_energy_certificate_sessions_user_id ON energy_certificate_sessions(user_id);
CREATE INDEX idx_energy_certificate_sessions_status ON energy_certificate_sessions(status);
CREATE INDEX idx_energy_certificate_sessions_kind ON energy_certificate_sessions(kind);
CREATE INDEX idx_energy_certificate_sessions_created_at ON energy_certificate_sessions(created_at);

CREATE INDEX idx_energy_certificates_building_id ON energy_certificates(building_id);
CREATE INDEX idx_energy_certificates_user_id ON energy_certificates(user_id);
CREATE INDEX idx_energy_certificates_rating ON energy_certificates(rating);
CREATE INDEX idx_energy_certificates_kind ON energy_certificates(kind);
CREATE INDEX idx_energy_certificates_issue_date ON energy_certificates(issue_date);
CREATE INDEX idx_energy_certificates_expiry_date ON energy_certificates(expiry_date);
CREATE INDEX idx_energy_certificates_created_at ON energy_certificates(created_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_energy_certificate_sessions_updated_at 
    BEFORE UPDATE ON energy_certificate_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_energy_certificates_updated_at 
    BEFORE UPDATE ON energy_certificates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de seguridad (Row Level Security)
ALTER TABLE energy_certificate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_certificate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_certificates ENABLE ROW LEVEL SECURITY;

-- Políticas para energy_certificate_documents
CREATE POLICY energy_certificate_documents_user_policy ON energy_certificate_documents
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para energy_certificate_sessions
CREATE POLICY energy_certificate_sessions_user_policy ON energy_certificate_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para energy_certificates
CREATE POLICY energy_certificates_user_policy ON energy_certificates
    FOR ALL USING (auth.uid() = user_id);

-- Comentarios para documentación
COMMENT ON TABLE energy_certificate_documents IS 'Documentos de certificados energéticos subidos por usuarios';
COMMENT ON TABLE energy_certificate_sessions IS 'Sesiones de extracción de datos de certificados energéticos por IA';
COMMENT ON TABLE energy_certificates IS 'Certificados energéticos confirmados y guardados definitivamente';

COMMENT ON COLUMN energy_certificate_documents.mime_type IS 'Tipo MIME del archivo subido';
COMMENT ON COLUMN energy_certificate_sessions.kind IS 'Tipo de certificado: building, dwelling, commercial_unit';
COMMENT ON COLUMN energy_certificate_sessions.status IS 'Estado del proceso: uploaded, processing, extracted, reviewed, confirmed, failed';
COMMENT ON COLUMN energy_certificate_sessions.documents IS 'Array de UUIDs de documentos asociados';
COMMENT ON COLUMN energy_certificate_sessions.extracted_data IS 'Datos extraídos por IA en formato JSON';
COMMENT ON COLUMN energy_certificate_sessions.edited_data IS 'Modificaciones realizadas por el técnico en formato JSON';

COMMENT ON COLUMN energy_certificates.rating IS 'Calificación energética: A, B, C, D, E, F, G, ND';
COMMENT ON COLUMN energy_certificates.primary_energy_kwh_per_m2_year IS 'Consumo de energía primaria en kWh/m²·año';
COMMENT ON COLUMN energy_certificates.emissions_kg_co2_per_m2_year IS 'Emisiones de CO2 en kgCO₂/m²·año';
COMMENT ON COLUMN energy_certificates.scope IS 'Ámbito del certificado: building, dwelling, commercial_unit';
COMMENT ON COLUMN energy_certificates.source_session_id IS 'ID de la sesión de extracción de la que proviene';
