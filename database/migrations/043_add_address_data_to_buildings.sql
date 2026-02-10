-- Agrega una columna JSONB para almacenar la dirección estructurada de los edificios

ALTER TABLE buildings
ADD COLUMN IF NOT EXISTS address_data JSONB;

-- Inicializar datos existentes usando el campo address como fullAddress
UPDATE buildings
SET address_data = jsonb_build_object(
  'fullAddress', address
)
WHERE address IS NOT NULL
  AND (address_data IS NULL OR address_data = '{}'::jsonb);

COMMENT ON COLUMN buildings.address_data IS 'Dirección estructurada del edificio (provincia, municipio, vía, número, etc.)';


