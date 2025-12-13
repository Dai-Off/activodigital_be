-- Simplificar: agregar campos de pago directamente a rent_invoices
-- y eliminar la tabla rent_payments

-- 1. Agregar campos de pago a rent_invoices
ALTER TABLE rent_invoices
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_reference_number TEXT,
ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- 2. Migrar datos de rent_payments a rent_invoices (si existen)
UPDATE rent_invoices ri
SET 
    payment_date = (
        SELECT payment_date 
        FROM rent_payments rp 
        WHERE rp.invoice_id = ri.id 
        ORDER BY payment_date DESC 
        LIMIT 1
    ),
    payment_amount = (
        SELECT payment_amount 
        FROM rent_payments rp 
        WHERE rp.invoice_id = ri.id 
        ORDER BY payment_date DESC 
        LIMIT 1
    ),
    payment_method = (
        SELECT payment_method 
        FROM rent_payments rp 
        WHERE rp.invoice_id = ri.id 
        ORDER BY payment_date DESC 
        LIMIT 1
    ),
    payment_reference_number = (
        SELECT reference_number 
        FROM rent_payments rp 
        WHERE rp.invoice_id = ri.id 
        ORDER BY payment_date DESC 
        LIMIT 1
    ),
    payment_notes = (
        SELECT notes 
        FROM rent_payments rp 
        WHERE rp.invoice_id = ri.id 
        ORDER BY payment_date DESC 
        LIMIT 1
    )
WHERE EXISTS (
    SELECT 1 FROM rent_payments rp WHERE rp.invoice_id = ri.id
);

-- 3. Actualizar función para calcular estado basado en payment_amount directamente
CREATE OR REPLACE FUNCTION update_invoice_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar el estado de la factura basado en payment_amount
    UPDATE rent_invoices
    SET status = CASE
        WHEN payment_amount IS NOT NULL AND payment_amount >= total_amount THEN 'paid'
        WHEN CURRENT_DATE > due_date THEN 'overdue'
        ELSE 'pending'
    END
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Eliminar trigger de rent_payments (ya no existe)
DROP TRIGGER IF EXISTS update_invoice_status_on_payment ON rent_payments;

-- 5. Crear trigger para actualizar estado cuando se actualiza la factura
DROP TRIGGER IF EXISTS update_invoice_status_on_update ON rent_invoices;
CREATE TRIGGER update_invoice_status_on_update
    AFTER UPDATE OF payment_amount, payment_date, total_amount, due_date ON rent_invoices
    FOR EACH ROW 
    WHEN (OLD.payment_amount IS DISTINCT FROM NEW.payment_amount 
       OR OLD.total_amount IS DISTINCT FROM NEW.total_amount
       OR OLD.due_date IS DISTINCT FROM NEW.due_date)
    EXECUTE FUNCTION update_invoice_status();

-- 6. Eliminar tabla rent_payments (después de migrar datos)
DROP TABLE IF EXISTS rent_payments CASCADE;

COMMENT ON COLUMN rent_invoices.payment_date IS 'Fecha del pago recibido';
COMMENT ON COLUMN rent_invoices.payment_amount IS 'Monto del pago recibido';
COMMENT ON COLUMN rent_invoices.payment_method IS 'Método de pago: transfer, cash, check, other';
COMMENT ON COLUMN rent_invoices.payment_reference_number IS 'Número de referencia del pago';
COMMENT ON COLUMN rent_invoices.payment_notes IS 'Notas del pago';

