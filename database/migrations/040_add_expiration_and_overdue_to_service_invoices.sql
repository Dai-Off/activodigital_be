BEGIN;

ALTER TABLE service_invoices
ADD COLUMN IF NOT EXISTS expiration_date DATE;

CREATE INDEX IF NOT EXISTS idx_service_invoices_expiration_date ON service_invoices(expiration_date);

COMMIT;
