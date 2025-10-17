-- Agregar columna de metros cuadrados a la tabla buildings
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS square_meters DECIMAL(10, 2);

-- Agregar comentario para documentación
COMMENT ON COLUMN buildings.square_meters IS 'Superficie del edificio en metros cuadrados';

