-- Migración para agregar campos financieros a la tabla buildings
-- Coste de Rehabilitación y Valor Potencial

-- Agregar campos financieros a la tabla buildings
ALTER TABLE buildings 
ADD COLUMN rehabilitation_cost DECIMAL(15,2) DEFAULT 0.00,
ADD COLUMN potential_value DECIMAL(15,2) DEFAULT 0.00;

-- Índices para mejorar rendimiento en consultas financieras
CREATE INDEX idx_buildings_rehabilitation_cost ON buildings(rehabilitation_cost);
CREATE INDEX idx_buildings_potential_value ON buildings(potential_value);

-- Comentarios para documentación
COMMENT ON COLUMN buildings.rehabilitation_cost IS 'Coste de rehabilitación del edificio (por defecto 0)';
COMMENT ON COLUMN buildings.potential_value IS 'Valor potencial del edificio (por defecto 0)';

-- Actualizar edificios existentes para asegurar que tengan valores por defecto
UPDATE buildings 
SET 
    rehabilitation_cost = COALESCE(rehabilitation_cost, 0.00),
    potential_value = COALESCE(potential_value, 0.00)
WHERE 
    rehabilitation_cost IS NULL 
    OR potential_value IS NULL;

-- Restricciones para asegurar valores no negativos
ALTER TABLE buildings 
ADD CONSTRAINT check_rehabilitation_cost_non_negative 
CHECK (rehabilitation_cost >= 0);

ALTER TABLE buildings 
ADD CONSTRAINT check_potential_value_non_negative 
CHECK (potential_value >= 0);
