-- Crear tabla para almacenar los scores ESG calculados
CREATE TABLE IF NOT EXISTS esg_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    
    -- Status del cálculo
    status VARCHAR(20) NOT NULL CHECK (status IN ('complete', 'incomplete')),
    
    -- Datos del cálculo completo (solo si status = 'complete')
    environmental_cee_points INTEGER,
    environmental_consumption_points INTEGER,
    environmental_emissions_points INTEGER,
    environmental_renewable_points INTEGER,
    environmental_water_points INTEGER,
    environmental_subtotal_raw INTEGER,
    environmental_normalized INTEGER,
    
    social_accessibility_points INTEGER,
    social_air_quality_points INTEGER,
    social_safety_points INTEGER,
    social_subtotal_raw INTEGER,
    social_normalized INTEGER,
    
    governance_digital_log_points INTEGER,
    governance_compliance_points INTEGER,
    governance_subtotal_raw INTEGER,
    governance_normalized INTEGER,
    
    total INTEGER,
    label VARCHAR(20),
    
    -- Datos faltantes (solo si status = 'incomplete')
    missing_data JSONB,
    message TEXT,
    
    -- Auditoría
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: solo un score por edificio
    UNIQUE(building_id)
);

-- Índices
CREATE INDEX idx_esg_scores_building_id ON esg_scores(building_id);
CREATE INDEX idx_esg_scores_status ON esg_scores(status);
CREATE INDEX idx_esg_scores_calculated_at ON esg_scores(calculated_at);

-- Trigger para updated_at
CREATE TRIGGER update_esg_scores_updated_at 
    BEFORE UPDATE ON esg_scores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE esg_scores ENABLE ROW LEVEL SECURITY;

-- Política: propietarios y técnicos asignados pueden ver el ESG del edificio
CREATE POLICY esg_scores_access_policy ON esg_scores
    FOR SELECT USING (
        -- El propietario puede ver
        EXISTS (
            SELECT 1 FROM buildings b
            JOIN users u ON u.id = b.owner_id
            WHERE u.user_id = auth.uid() 
            AND b.id = esg_scores.building_id
        )
        OR
        -- El técnico asignado puede ver
        EXISTS (
            SELECT 1 FROM building_technician_assignments bta
            JOIN users u ON u.id = bta.technician_id
            WHERE u.user_id = auth.uid() 
            AND bta.building_id = esg_scores.building_id 
            AND bta.status = 'active'
        )
        OR
        -- El CFO asignado puede ver
        EXISTS (
            SELECT 1 FROM building_cfo_assignments bca
            JOIN users u ON u.id = bca.cfo_id
            WHERE u.user_id = auth.uid() 
            AND bca.building_id = esg_scores.building_id 
            AND bca.status = 'active'
        )
    );

-- Política: solo técnicos asignados pueden insertar/actualizar
CREATE POLICY esg_scores_write_policy ON esg_scores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM building_technician_assignments bta
            JOIN users u ON u.id = bta.technician_id
            WHERE u.user_id = auth.uid() 
            AND bta.building_id = esg_scores.building_id 
            AND bta.status = 'active'
        )
    );

-- Comentarios
COMMENT ON TABLE esg_scores IS 'Almacena los resultados calculados de ESG para cada edificio';
COMMENT ON COLUMN esg_scores.status IS 'Estado del cálculo: complete o incomplete';
COMMENT ON COLUMN esg_scores.missing_data IS 'Array JSON con los datos faltantes si status = incomplete';
COMMENT ON COLUMN esg_scores.calculated_at IS 'Fecha y hora del último cálculo';

