# Database Migrations

Este directorio contiene las migraciones de base de datos para el proyecto Activo Digital.

## Instrucciones para ejecutar las migraciones

### Opción 1: Usando el Dashboard de Supabase

1. Accede al dashboard de Supabase de tu proyecto
2. Ve a la sección "SQL Editor"
3. Copia y pega el contenido del archivo `migrations/001_create_buildings_and_digital_books_tables.sql`
4. Ejecuta la query

### Opción 2: Usando Supabase CLI

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g @supabase/cli

# Inicializar el proyecto local (si es la primera vez)
supabase init

# Vincular con tu proyecto remoto
supabase link --project-ref YOUR_PROJECT_REF

# Ejecutar la migración
supabase db push
```

### Opción 3: Usando un cliente PostgreSQL

Si tienes acceso directo a la base de datos PostgreSQL:

```bash
psql -h YOUR_DB_HOST -U YOUR_DB_USER -d YOUR_DB_NAME -f migrations/001_create_buildings_and_digital_books_tables.sql
```

## Estructura de las tablas

### Tabla `buildings`
- Almacena la información de los edificios
- Cada edificio pertenece a un usuario (`user_id`)
- Incluye datos como nombre, dirección, tipología, etc.
- Las imágenes se almacenan como JSONB

### Tabla `digital_books`
- Almacena los libros digitales asociados a edificios
- Cada libro pertenece a un edificio y un usuario
- Las secciones se almacenan como JSONB
- Incluye progreso y estado del libro

## Seguridad

Las tablas incluyen Row Level Security (RLS) que garantiza que:
- Los usuarios solo pueden acceder a sus propios edificios
- Los usuarios solo pueden acceder a sus propios libros digitales

## Índices

Se han creado índices en las columnas más consultadas para optimizar el rendimiento:
- `user_id` en ambas tablas
- `building_id` en `digital_books`
- `status` en ambas tablas
- `created_at` para ordenación por fecha
