-- Migración para simplificar la tabla building_documents
-- Elimina campos innecesarios, mantiene solo lo esencial

BEGIN;

-- Eliminar campos innecesarios
ALTER TABLE building_documents
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS category_label,
DROP COLUMN IF EXISTS subcategory,
DROP COLUMN IF EXISTS title,
DROP COLUMN IF EXISTS notes,
DROP COLUMN IF EXISTS contract_provider,
DROP COLUMN IF EXISTS contract_amount,
DROP COLUMN IF EXISTS contract_expiration,
DROP COLUMN IF EXISTS contract_renewal,
DROP COLUMN IF EXISTS signed_url,
DROP COLUMN IF EXISTS signed_url_expires_at;

-- Eliminar índices relacionados con campos eliminados
DROP INDEX IF EXISTS idx_building_documents_status;

-- El campo expiration_date ya existe y es el que usamos para el cronjob
-- expiration_date DATE (ya existe, no necesita cambios)

COMMIT;

