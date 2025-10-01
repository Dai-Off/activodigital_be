-- ============================================================================
-- Migración: Crear bucket de Storage para documentos del libro digital
-- ============================================================================
-- Este script crea el bucket en Supabase Storage
-- Las políticas RLS deben configurarse desde el Dashboard de Supabase
-- Ver: Storage > Policies > Create policy
-- ============================================================================

-- IMPORTANTE: Este script SOLO crea el bucket
-- Las políticas deben crearse manualmente desde el Dashboard o vía API

-- 1. Crear el bucket para documentos del libro digital
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'digital-book-documents',
  'digital-book-documents',
  false, -- Bucket privado (requiere autenticación)
  10485760, -- 10 MB límite por archivo
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SIGUIENTE PASO: Configurar Políticas RLS desde el Dashboard
-- ============================================================================
-- 
-- Las políticas de Storage deben crearse desde:
-- Dashboard > Storage > Policies > New Policy
--
-- O ejecutar el siguiente script en una sesión con permisos de SUPERUSER:
-- (No funciona en el SQL Editor normal de Supabase)
--
-- ============================================================================

/*
-- ESTAS POLÍTICAS DEBEN CREARSE MANUALMENTE EN EL DASHBOARD

-- Política 1: INSERT (Upload)
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'digital-book-documents' AND
  auth.uid() IS NOT NULL
);

-- Política 2: SELECT (View)
CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'digital-book-documents' AND
  auth.uid() IS NOT NULL
);

-- Política 3: UPDATE (Update)
CREATE POLICY "Authenticated users can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'digital-book-documents' AND
  auth.uid() IS NOT NULL
)
WITH CHECK (
  bucket_id = 'digital-book-documents' AND
  auth.uid() IS NOT NULL
);

-- Política 4: DELETE (Delete)
CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'digital-book-documents' AND
  auth.uid() IS NOT NULL
);
*/

-- ============================================================================
-- Verificación del bucket creado
-- ============================================================================
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  array_length(allowed_mime_types, 1) as mime_types_count
FROM storage.buckets 
WHERE id = 'digital-book-documents';

