-- Agregar constraint único para garantizar relación 1:1 entre edificio y libro digital
-- Esto asegura que cada edificio solo pueda tener un libro digital

ALTER TABLE digital_books 
ADD CONSTRAINT unique_building_book 
UNIQUE (building_id);

-- Comentario para documentar el cambio
COMMENT ON CONSTRAINT unique_building_book ON digital_books IS 'Garantiza relación 1:1 entre edificio y libro digital';
