-- Migración para crear tabla de facturas de servicios del edificio
-- Almacena facturas individuales de servicios (electricidad, agua, gas, IBI, basuras)
-- Estas facturas se usan para calcular automáticamente los costes mensuales

BEGIN;

-- 1. Crear tabla de facturas de servicios
CREATE TABLE IF NOT EXISTS service_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    
    -- Tipo de servicio
    service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('electricity', 'water', 'gas', 'ibi', 'waste')),
    
    -- Información de la factura
    invoice_number TEXT,
    invoice_date DATE NOT NULL,
    amount_eur DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (amount_eur >= 0),
    units INTEGER, -- Unidades consumidas (kWh, m³, etc.)
    
    -- Periodo que cubre la factura (útil para facturas bimestrales, trimestrales, etc.)
    period_start DATE,
    period_end DATE,
    
    -- Documento de la factura (opcional)
    document_url TEXT,
    document_filename TEXT,
    
    -- Metadata
    notes TEXT,
    provider TEXT, -- Nombre del proveedor (Endesa, Aqualia, etc.)
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_service_invoices_building_id ON service_invoices(building_id);
CREATE INDEX IF NOT EXISTS idx_service_invoices_service_type ON service_invoices(service_type);
CREATE INDEX IF NOT EXISTS idx_service_invoices_invoice_date ON service_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_service_invoices_period ON service_invoices(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_service_invoices_building_type ON service_invoices(building_id, service_type);
CREATE INDEX IF NOT EXISTS idx_service_invoices_created_at ON service_invoices(created_at);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE service_invoices ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS
-- Eliminar políticas existentes si existen (para permitir re-ejecución de la migración)
DROP POLICY IF EXISTS "Users can view service invoices for accessible buildings" ON service_invoices;
DROP POLICY IF EXISTS "Users can create service invoices for owned buildings" ON service_invoices;
DROP POLICY IF EXISTS "Users can update service invoices for owned buildings" ON service_invoices;
DROP POLICY IF EXISTS "Users can delete service invoices for owned buildings" ON service_invoices;

-- Policy 1: Los usuarios pueden ver facturas de servicios de edificios a los que tienen acceso
CREATE POLICY "Users can view service invoices for accessible buildings" ON service_invoices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM buildings b
            WHERE b.id = service_invoices.building_id
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

-- Policy 2: Los usuarios pueden crear facturas para edificios que poseen
CREATE POLICY "Users can create service invoices for owned buildings" ON service_invoices
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM buildings b
            WHERE b.id = service_invoices.building_id
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

-- Policy 3: Los usuarios pueden actualizar facturas de edificios que poseen
CREATE POLICY "Users can update service invoices for owned buildings" ON service_invoices
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM buildings b
            WHERE b.id = service_invoices.building_id
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

-- Policy 4: Los usuarios pueden eliminar facturas de edificios que poseen
CREATE POLICY "Users can delete service invoices for owned buildings" ON service_invoices
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM buildings b
            WHERE b.id = service_invoices.building_id
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
DROP TRIGGER IF EXISTS update_service_invoices_updated_at ON service_invoices;
CREATE TRIGGER update_service_invoices_updated_at
    BEFORE UPDATE ON service_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Trigger para recalcular service_expenses cuando se inserta/actualiza/elimina una factura
CREATE OR REPLACE FUNCTION recalculate_service_expenses()
RETURNS TRIGGER AS $$
DECLARE
    affected_building_id UUID;
    affected_invoice_date DATE;
    old_invoice_date DATE;
    invoice_year INTEGER;
    invoice_month INTEGER;
    old_year INTEGER;
    old_month INTEGER;
BEGIN
    -- Manejar diferentes operaciones
    IF TG_OP = 'DELETE' THEN
        affected_building_id := OLD.building_id;
        affected_invoice_date := OLD.invoice_date;
        invoice_year := EXTRACT(YEAR FROM affected_invoice_date)::INTEGER;
        invoice_month := EXTRACT(MONTH FROM affected_invoice_date)::INTEGER;
        
        -- Solo recalcular el mes eliminado
        PERFORM recalculate_service_expenses_for_period(affected_building_id, invoice_year, invoice_month);
    ELSIF TG_OP = 'UPDATE' THEN
        affected_building_id := NEW.building_id;
        affected_invoice_date := NEW.invoice_date;
        old_invoice_date := OLD.invoice_date;
        
        invoice_year := EXTRACT(YEAR FROM affected_invoice_date)::INTEGER;
        invoice_month := EXTRACT(MONTH FROM affected_invoice_date)::INTEGER;
        old_year := EXTRACT(YEAR FROM old_invoice_date)::INTEGER;
        old_month := EXTRACT(MONTH FROM old_invoice_date)::INTEGER;
        
        -- Si cambió el mes o año, recalcular ambos períodos
        IF (old_year != invoice_year OR old_month != invoice_month) THEN
            PERFORM recalculate_service_expenses_for_period(affected_building_id, old_year, old_month);
        END IF;
        
        -- Siempre recalcular el período actual
        PERFORM recalculate_service_expenses_for_period(affected_building_id, invoice_year, invoice_month);
    ELSE -- INSERT
        affected_building_id := NEW.building_id;
        affected_invoice_date := NEW.invoice_date;
        invoice_year := EXTRACT(YEAR FROM affected_invoice_date)::INTEGER;
        invoice_month := EXTRACT(MONTH FROM affected_invoice_date)::INTEGER;
        
        PERFORM recalculate_service_expenses_for_period(affected_building_id, invoice_year, invoice_month);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Función auxiliar para recalcular service_expenses para un período específico
CREATE OR REPLACE FUNCTION recalculate_service_expenses_for_period(
    p_building_id UUID,
    p_year INTEGER,
    p_month INTEGER
)
RETURNS void AS $$
DECLARE
    invoice_count INTEGER;
BEGIN
    -- Verificar si hay facturas para ese período
    SELECT COUNT(*) INTO invoice_count
    FROM service_invoices
    WHERE building_id = p_building_id
    AND EXTRACT(YEAR FROM invoice_date)::INTEGER = p_year
    AND EXTRACT(MONTH FROM invoice_date)::INTEGER = p_month;
    
    -- Si hay facturas, hacer UPSERT (actualizar si existe, insertar si no)
    IF invoice_count > 0 THEN
        INSERT INTO service_expenses (
            building_id,
            year,
            month,
            electricity_eur,
            water_eur,
            gas_eur,
            ibi_eur,
            waste_eur,
            electricity_units,
            water_units,
            gas_units,
            ibi_units,
            waste_units
        )
        SELECT
            p_building_id,
            p_year,
            p_month,
            COALESCE(SUM(CASE WHEN service_type = 'electricity' THEN amount_eur ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN service_type = 'water' THEN amount_eur ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN service_type = 'gas' THEN amount_eur ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN service_type = 'ibi' THEN amount_eur ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN service_type = 'waste' THEN amount_eur ELSE 0 END), 0),
            SUM(CASE WHEN service_type = 'electricity' THEN units ELSE NULL END),
            SUM(CASE WHEN service_type = 'water' THEN units ELSE NULL END),
            SUM(CASE WHEN service_type = 'gas' THEN units ELSE NULL END),
            SUM(CASE WHEN service_type = 'ibi' THEN units ELSE NULL END),
            SUM(CASE WHEN service_type = 'waste' THEN units ELSE NULL END)
        FROM service_invoices
        WHERE building_id = p_building_id
        AND EXTRACT(YEAR FROM invoice_date)::INTEGER = p_year
        AND EXTRACT(MONTH FROM invoice_date)::INTEGER = p_month
        ON CONFLICT (building_id, year, month) 
        DO UPDATE SET
            electricity_eur = EXCLUDED.electricity_eur,
            water_eur = EXCLUDED.water_eur,
            gas_eur = EXCLUDED.gas_eur,
            ibi_eur = EXCLUDED.ibi_eur,
            waste_eur = EXCLUDED.waste_eur,
            electricity_units = EXCLUDED.electricity_units,
            water_units = EXCLUDED.water_units,
            gas_units = EXCLUDED.gas_units,
            ibi_units = EXCLUDED.ibi_units,
            waste_units = EXCLUDED.waste_units,
            updated_at = NOW();
    ELSE
        -- Si no hay facturas, eliminar el registro si existe
        DELETE FROM service_expenses
        WHERE building_id = p_building_id
        AND year = p_year
        AND month = p_month;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para recalcular service_expenses
DROP TRIGGER IF EXISTS recalculate_service_expenses_on_insert ON service_invoices;
DROP TRIGGER IF EXISTS recalculate_service_expenses_on_update ON service_invoices;
DROP TRIGGER IF EXISTS recalculate_service_expenses_on_delete ON service_invoices;

CREATE TRIGGER recalculate_service_expenses_on_insert
    AFTER INSERT ON service_invoices
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_service_expenses();

CREATE TRIGGER recalculate_service_expenses_on_update
    AFTER UPDATE ON service_invoices
    FOR EACH ROW
    WHEN (OLD.building_id IS DISTINCT FROM NEW.building_id OR 
          OLD.invoice_date IS DISTINCT FROM NEW.invoice_date OR
          OLD.service_type IS DISTINCT FROM NEW.service_type OR
          OLD.amount_eur IS DISTINCT FROM NEW.amount_eur OR
          OLD.units IS DISTINCT FROM NEW.units)
    EXECUTE FUNCTION recalculate_service_expenses();

CREATE TRIGGER recalculate_service_expenses_on_delete
    AFTER DELETE ON service_invoices
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_service_expenses();

-- 7. Comentarios para documentación
COMMENT ON TABLE service_invoices IS 'Facturas individuales de servicios del edificio (electricidad, agua, gas, IBI, basuras)';
COMMENT ON COLUMN service_invoices.building_id IS 'ID del edificio al que pertenece la factura';
COMMENT ON COLUMN service_invoices.service_type IS 'Tipo de servicio: electricity, water, gas, ibi, waste';
COMMENT ON COLUMN service_invoices.invoice_number IS 'Número de factura del proveedor';
COMMENT ON COLUMN service_invoices.invoice_date IS 'Fecha de emisión de la factura (se usa para determinar el mes del coste)';
COMMENT ON COLUMN service_invoices.amount_eur IS 'Importe de la factura en EUR';
COMMENT ON COLUMN service_invoices.units IS 'Unidades consumidas (kWh para electricidad, m³ para agua/gas, etc.)';
COMMENT ON COLUMN service_invoices.period_start IS 'Fecha de inicio del periodo que cubre la factura (opcional)';
COMMENT ON COLUMN service_invoices.period_end IS 'Fecha de fin del periodo que cubre la factura (opcional)';
COMMENT ON COLUMN service_invoices.document_url IS 'URL del documento de la factura (PDF, imagen, etc.)';
COMMENT ON COLUMN service_invoices.provider IS 'Nombre del proveedor del servicio';

COMMIT;


