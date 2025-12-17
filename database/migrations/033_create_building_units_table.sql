-- Tabla de unidades por edificio
CREATE TABLE IF NOT EXISTS building_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    name TEXT,
    identifier TEXT,
    floor TEXT,
    area_m2 NUMERIC(12,2),
    use_type TEXT,
    status TEXT,
    rent NUMERIC(12,2),
    tenant TEXT,
    rooms INTEGER,
    baths INTEGER,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_building_units_building_id ON building_units(building_id);
CREATE INDEX IF NOT EXISTS idx_building_units_identifier ON building_units(identifier);

-- Trigger para updated_at
CREATE TRIGGER update_building_units_updated_at 
    BEFORE UPDATE ON building_units 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE building_units ENABLE ROW LEVEL SECURITY;

-- Política básica: usuarios autenticados pueden leer/escribir unidades del edificio
CREATE POLICY building_units_access_policy ON building_units
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY building_units_write_policy ON building_units
    FOR ALL USING (auth.role() = 'authenticated');

COMMENT ON TABLE building_units IS 'Unidades individuales de un edificio';

