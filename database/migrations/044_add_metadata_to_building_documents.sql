-- Migración para añadir columna metadata a la tabla building_documents
-- Permite almacenar resultados de procesos de IA como checklists, etc.

BEGIN;

ALTER TABLE building_documents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN building_documents.metadata IS 'Metadatos adicionales del documento (ej: resultados de validación por IA, checklist extraído)';

COMMIT;
