-- Migración para agregar columna cfo_email a la tabla buildings
-- Ejecutar después de la migración 006

-- Agregar columna cfo_email a la tabla buildings
ALTER TABLE buildings 
ADD COLUMN cfo_email VARCHAR(255);

-- Agregar comentario para documentación
COMMENT ON COLUMN buildings.cfo_email IS 'Email del CFO asignado al edificio para acceso a información financiera';

-- Verificar que se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'buildings' 
AND column_name IN ('technician_email', 'cfo_email')
ORDER BY column_name;
