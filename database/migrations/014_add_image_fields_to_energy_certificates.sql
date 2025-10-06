-- Agregar campos de imagen a la tabla energy_certificates
-- Esta migración añade los campos necesarios para almacenar información de la imagen del certificado

-- Agregar columnas para información de la imagen
ALTER TABLE energy_certificates 
ADD COLUMN image_url TEXT,
ADD COLUMN image_filename VARCHAR(255),
ADD COLUMN image_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Comentarios para documentación
COMMENT ON COLUMN energy_certificates.image_url IS 'URL de la imagen del certificado almacenada en Supabase Storage';
COMMENT ON COLUMN energy_certificates.image_filename IS 'Nombre del archivo de la imagen del certificado';
COMMENT ON COLUMN energy_certificates.image_uploaded_at IS 'Fecha y hora de subida de la imagen del certificado';
