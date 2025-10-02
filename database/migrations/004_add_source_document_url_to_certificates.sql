-- Agregar campo source_document_url a la tabla energy_certificates
-- Esta migración añade la URL del documento original para poder visualizar el certificado

-- Agregar columna source_document_url
ALTER TABLE energy_certificates 
ADD COLUMN source_document_url TEXT;

-- Comentario para documentación
COMMENT ON COLUMN energy_certificates.source_document_url IS 'URL del documento original del certificado energético para visualización';
