-- Migración para crear tabla de gastos de servicios por edificio
-- Almacena los gastos de servicios recurrentes (electricidad, agua, gas, IBI, basuras)

BEGIN;

-- 1. Crear tabla de gastos de servicios
CREATE TABLE IF NOT EXISTS service_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    
    -- Periodo (año y mes)
    year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    
    -- Costes por tipo (en EUR)
    electricity_eur DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (electricity_eur >= 0),
    water_eur DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (water_eur >= 0),
    gas_eur DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (gas_eur >= 0),
    ibi_eur DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (ibi_eur >= 0),
    waste_eur DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (waste_eur >= 0),
    
    -- Total mensual (calculado, pero almacenado para facilitar consultas)
    total_monthly_eur DECIMAL(12, 2) GENERATED ALWAYS AS (
        electricity_eur + water_eur + gas_eur + ibi_eur + waste_eur
    ) STORED,
    
    -- Metadatos adicionales (unidades, descripciones, etc.)
    electricity_units INTEGER,
    water_units INTEGER,
    gas_units INTEGER,
    ibi_units INTEGER,
    waste_units INTEGER,
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraint: solo un registro por edificio, año y mes
    UNIQUE(building_id, year, month)
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_service_expenses_building_id ON service_expenses(building_id);
CREATE INDEX IF NOT EXISTS idx_service_expenses_period ON service_expenses(year, month);
CREATE INDEX IF NOT EXISTS idx_service_expenses_building_period ON service_expenses(building_id, year, month);
CREATE INDEX IF NOT EXISTS idx_service_expenses_created_at ON service_expenses(created_at);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE service_expenses ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS
-- Eliminar políticas existentes si existen (para permitir re-ejecución de la migración)
DROP POLICY IF EXISTS "Users can view service expenses for accessible buildings" ON service_expenses;
DROP POLICY IF EXISTS "Users can create service expenses for owned buildings" ON service_expenses;
DROP POLICY IF EXISTS "Users can update service expenses for owned buildings" ON service_expenses;
DROP POLICY IF EXISTS "Users can delete service expenses for owned buildings" ON service_expenses;

-- Policy 1: Los usuarios pueden ver gastos de servicios de edificios a los que tienen acceso
CREATE POLICY "Users can view service expenses for accessible buildings" ON service_expenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM buildings b
            WHERE b.id = service_expenses.building_id
            AND (
                b.user_id = auth.uid()
                OR b.owner_id IN (
                    SELECT id FROM users WHERE user_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM building_propietario_assignments bpa
                    WHERE bpa.building_id = b.id
                    AND bpa.propietario_id IN (SELECT id FROM users WHERE user_id = auth.uid())
                    AND bpa.status = 'active'
                )
            )
        )
    );

-- Policy 2: Los usuarios pueden crear gastos de servicios para edificios que poseen
CREATE POLICY "Users can create service expenses for owned buildings" ON service_expenses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM buildings b
            WHERE b.id = service_expenses.building_id
            AND (
                b.user_id = auth.uid()
                OR b.owner_id IN (
                    SELECT id FROM users WHERE user_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM building_propietario_assignments bpa
                    WHERE bpa.building_id = b.id
                    AND bpa.propietario_id IN (SELECT id FROM users WHERE user_id = auth.uid())
                    AND bpa.status = 'active'
                )
            )
        )
    );

-- Policy 3: Los usuarios pueden actualizar gastos de servicios de edificios que poseen
CREATE POLICY "Users can update service expenses for owned buildings" ON service_expenses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM buildings b
            WHERE b.id = service_expenses.building_id
            AND (
                b.user_id = auth.uid()
                OR b.owner_id IN (
                    SELECT id FROM users WHERE user_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM building_propietario_assignments bpa
                    WHERE bpa.building_id = b.id
                    AND bpa.propietario_id IN (SELECT id FROM users WHERE user_id = auth.uid())
                    AND bpa.status = 'active'
                )
            )
        )
    );

-- Policy 4: Los usuarios pueden eliminar gastos de servicios de edificios que poseen
CREATE POLICY "Users can delete service expenses for owned buildings" ON service_expenses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM buildings b
            WHERE b.id = service_expenses.building_id
            AND (
                b.user_id = auth.uid()
                OR b.owner_id IN (
                    SELECT id FROM users WHERE user_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM building_propietario_assignments bpa
                    WHERE bpa.building_id = b.id
                    AND bpa.propietario_id IN (SELECT id FROM users WHERE user_id = auth.uid())
                    AND bpa.status = 'active'
                )
            )
        )
    );

-- 5. Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_service_expenses_updated_at ON service_expenses;
CREATE TRIGGER update_service_expenses_updated_at
    BEFORE UPDATE ON service_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Comentarios para documentación
COMMENT ON TABLE service_expenses IS 'Tabla que almacena los gastos de servicios recurrentes por edificio (agrupados por mes)';
COMMENT ON COLUMN service_expenses.building_id IS 'ID del edificio al que pertenecen los gastos';
COMMENT ON COLUMN service_expenses.year IS 'Año del periodo (YYYY)';
COMMENT ON COLUMN service_expenses.month IS 'Mes del periodo (1-12)';
COMMENT ON COLUMN service_expenses.electricity_eur IS 'Gasto mensual de electricidad en EUR';
COMMENT ON COLUMN service_expenses.water_eur IS 'Gasto mensual de agua en EUR';
COMMENT ON COLUMN service_expenses.gas_eur IS 'Gasto mensual de gas en EUR';
COMMENT ON COLUMN service_expenses.ibi_eur IS 'Gasto mensual de IBI (Impuesto sobre Bienes Inmuebles) en EUR';
COMMENT ON COLUMN service_expenses.waste_eur IS 'Gasto mensual de basuras en EUR';
COMMENT ON COLUMN service_expenses.total_monthly_eur IS 'Total mensual calculado (generated column)';
COMMENT ON COLUMN service_expenses.electricity_units IS 'Unidades consumidas de electricidad (opcional)';
COMMENT ON COLUMN service_expenses.water_units IS 'Unidades consumidas de agua (opcional)';
COMMENT ON COLUMN service_expenses.gas_units IS 'Unidades consumidas de gas (opcional)';
COMMENT ON COLUMN service_expenses.ibi_units IS 'Unidades de IBI (opcional)';
COMMENT ON COLUMN service_expenses.waste_units IS 'Unidades de basura (opcional)';

COMMIT;


