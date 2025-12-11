-- Tabla para facturación mensual de rentas
CREATE TABLE IF NOT EXISTS rent_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES building_units(id) ON DELETE CASCADE,
    
    -- Periodo de facturación
    invoice_month DATE NOT NULL, -- Primer día del mes (YYYY-MM-01)
    invoice_number TEXT,
    
    -- Montos
    rent_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    additional_charges NUMERIC(12, 2) DEFAULT 0, -- Gastos adicionales (comunidad, etc.)
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0, -- rent_amount + additional_charges
    
    -- Estado
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
    due_date DATE NOT NULL, -- Fecha de vencimiento
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: una factura por unidad y mes
    UNIQUE(unit_id, invoice_month)
);

-- Tabla para pagos recibidos
CREATE TABLE IF NOT EXISTS rent_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES rent_invoices(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES building_units(id) ON DELETE CASCADE,
    
    -- Información del pago
    payment_date DATE NOT NULL,
    payment_amount NUMERIC(12, 2) NOT NULL,
    payment_method TEXT, -- 'transfer', 'cash', 'check', 'other'
    
    -- Metadata
    reference_number TEXT, -- Número de referencia del pago
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para rent_invoices
CREATE INDEX IF NOT EXISTS idx_rent_invoices_building_id ON rent_invoices(building_id);
CREATE INDEX IF NOT EXISTS idx_rent_invoices_unit_id ON rent_invoices(unit_id);
CREATE INDEX IF NOT EXISTS idx_rent_invoices_month ON rent_invoices(invoice_month);
CREATE INDEX IF NOT EXISTS idx_rent_invoices_status ON rent_invoices(status);
CREATE INDEX IF NOT EXISTS idx_rent_invoices_building_month ON rent_invoices(building_id, invoice_month);

-- Índices para rent_payments
CREATE INDEX IF NOT EXISTS idx_rent_payments_invoice_id ON rent_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_building_id ON rent_payments(building_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_unit_id ON rent_payments(unit_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_date ON rent_payments(payment_date);

-- Triggers para updated_at
CREATE TRIGGER update_rent_invoices_updated_at 
    BEFORE UPDATE ON rent_invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rent_payments_updated_at 
    BEFORE UPDATE ON rent_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar el estado de la factura basado en pagos
CREATE OR REPLACE FUNCTION update_invoice_status()
RETURNS TRIGGER AS $$
DECLARE
    total_paid NUMERIC(12, 2);
    invoice_total NUMERIC(12, 2);
    invoice_due_date DATE;
    invoice_id_val UUID;
BEGIN
    -- Obtener el invoice_id del pago
    invoice_id_val := COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    -- Obtener el total pagado desde rent_payments
    SELECT COALESCE(SUM(payment_amount), 0)
    INTO total_paid
    FROM rent_payments
    WHERE invoice_id = invoice_id_val;
    
    -- Obtener el total de la factura y fecha de vencimiento
    SELECT total_amount, due_date
    INTO invoice_total, invoice_due_date
    FROM rent_invoices
    WHERE id = invoice_id_val;
    
    -- Actualizar el estado de la factura
    UPDATE rent_invoices
    SET status = CASE
        WHEN total_paid >= invoice_total THEN 'paid'
        WHEN CURRENT_DATE > invoice_due_date THEN 'overdue'
        ELSE 'pending'
    END
    WHERE id = invoice_id_val;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar estado de factura cuando se inserta/actualiza/elimina un pago
CREATE TRIGGER update_invoice_status_on_payment
    AFTER INSERT OR UPDATE OR DELETE ON rent_payments
    FOR EACH ROW EXECUTE FUNCTION update_invoice_status();

-- Habilitar RLS
ALTER TABLE rent_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para rent_invoices
CREATE POLICY rent_invoices_access_policy ON rent_invoices
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY rent_invoices_write_policy ON rent_invoices
    FOR ALL USING (auth.role() = 'authenticated');

-- Políticas RLS para rent_payments
CREATE POLICY rent_payments_access_policy ON rent_payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY rent_payments_write_policy ON rent_payments
    FOR ALL USING (auth.role() = 'authenticated');

COMMENT ON TABLE rent_invoices IS 'Facturas mensuales de rentas por unidad';
COMMENT ON TABLE rent_payments IS 'Pagos recibidos de rentas';

