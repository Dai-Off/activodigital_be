-- Crear extensión para UUIDs si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de edificios
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    cadastral_reference VARCHAR(100),
    construction_year INTEGER,
    typology VARCHAR(20) NOT NULL CHECK (typology IN ('residential', 'mixed', 'commercial')),
    num_floors INTEGER,
    num_units INTEGER,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    images JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready_book', 'with_book')),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de libros digitales
CREATE TABLE digital_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    source VARCHAR(20) NOT NULL CHECK (source IN ('manual', 'pdf')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'complete')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 8),
    sections JSONB DEFAULT '[]'::jsonb,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_buildings_user_id ON buildings(user_id);
CREATE INDEX idx_buildings_status ON buildings(status);
CREATE INDEX idx_buildings_typology ON buildings(typology);
CREATE INDEX idx_buildings_created_at ON buildings(created_at);

CREATE INDEX idx_digital_books_user_id ON digital_books(user_id);
CREATE INDEX idx_digital_books_building_id ON digital_books(building_id);
CREATE INDEX idx_digital_books_status ON digital_books(status);
CREATE INDEX idx_digital_books_created_at ON digital_books(created_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_buildings_updated_at 
    BEFORE UPDATE ON buildings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_digital_books_updated_at 
    BEFORE UPDATE ON digital_books 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de seguridad (Row Level Security)
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_books ENABLE ROW LEVEL SECURITY;

-- Política para buildings: los usuarios solo pueden ver/modificar sus propios edificios
CREATE POLICY buildings_user_policy ON buildings
    FOR ALL USING (auth.uid() = user_id);

-- Política para digital_books: los usuarios solo pueden ver/modificar sus propios libros
CREATE POLICY digital_books_user_policy ON digital_books
    FOR ALL USING (auth.uid() = user_id);

-- Comentarios para documentación
COMMENT ON TABLE buildings IS 'Tabla que almacena la información de los edificios';
COMMENT ON TABLE digital_books IS 'Tabla que almacena los libros digitales asociados a edificios';

COMMENT ON COLUMN buildings.images IS 'Array JSON con las imágenes del edificio';
COMMENT ON COLUMN buildings.typology IS 'Tipo de edificio: residential, mixed, commercial';
COMMENT ON COLUMN buildings.status IS 'Estado del edificio: draft, ready_book, with_book';

COMMENT ON COLUMN digital_books.sections IS 'Array JSON con las secciones del libro digital';
COMMENT ON COLUMN digital_books.source IS 'Origen del libro: manual, pdf';
COMMENT ON COLUMN digital_books.status IS 'Estado del libro: draft, in_progress, complete';
COMMENT ON COLUMN digital_books.progress IS 'Progreso del libro (0-8 secciones completadas)';
