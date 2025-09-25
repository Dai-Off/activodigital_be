-- Alter digital_books schema to support the new Libro Digital specification
-- Non-breaking: keeps existing columns and adds new ones for gradual migration

-- Add simple columns
ALTER TABLE digital_books
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'en_borrador' CHECK (estado IN ('en_borrador','validado','publicado'));

-- Add section columns as JSONB (optional payloads)
ALTER TABLE digital_books
  ADD COLUMN IF NOT EXISTS datos_generales JSONB,
  ADD COLUMN IF NOT EXISTS agentes_intervinientes JSONB,
  ADD COLUMN IF NOT EXISTS proyecto_tecnico JSONB,
  ADD COLUMN IF NOT EXISTS documentacion_administrativa JSONB,
  ADD COLUMN IF NOT EXISTS manual_uso_mantenimiento JSONB,
  ADD COLUMN IF NOT EXISTS registro_incidencias_actuaciones JSONB,
  ADD COLUMN IF NOT EXISTS certificados_garantias JSONB,
  ADD COLUMN IF NOT EXISTS anexos_planos JSONB,
  ADD COLUMN IF NOT EXISTS campos_ambientales JSONB,
  ADD COLUMN IF NOT EXISTS trazabilidad JSONB;

-- Indexes for potential query performance
CREATE INDEX IF NOT EXISTS idx_digital_books_estado ON digital_books(estado);
CREATE INDEX IF NOT EXISTS idx_digital_books_version ON digital_books(version);

-- Optional: document columns
COMMENT ON COLUMN digital_books.version IS 'Número de versión del libro digital';
COMMENT ON COLUMN digital_books.estado IS 'Estado del libro digital: en_borrador, validado, publicado';
COMMENT ON COLUMN digital_books.datos_generales IS 'Bloque: Datos Generales';
COMMENT ON COLUMN digital_books.agentes_intervinientes IS 'Bloque: Agentes Intervinientes';
COMMENT ON COLUMN digital_books.proyecto_tecnico IS 'Bloque: Proyecto Técnico';
COMMENT ON COLUMN digital_books.documentacion_administrativa IS 'Bloque: Documentación Administrativa y Legal';
COMMENT ON COLUMN digital_books.manual_uso_mantenimiento IS 'Bloque: Manual de Uso y Mantenimiento';
COMMENT ON COLUMN digital_books.registro_incidencias_actuaciones IS 'Bloque: Registro de Incidencias y Actuaciones';
COMMENT ON COLUMN digital_books.certificados_garantias IS 'Bloque: Certificados y Garantías';
COMMENT ON COLUMN digital_books.anexos_planos IS 'Bloque: Anexos y Planos';
COMMENT ON COLUMN digital_books.campos_ambientales IS 'Campos ambientales y rating (EPBD/ESG)';
COMMENT ON COLUMN digital_books.trazabilidad IS 'Trazabilidad y control (QR, historial, firmas, notificaciones)';


