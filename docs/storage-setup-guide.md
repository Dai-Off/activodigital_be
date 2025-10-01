# Guía de Configuración de Supabase Storage para Documentos

Esta guía explica cómo configurar Supabase Storage para manejar la carga de documentos en el libro digital.

## 📋 Requisitos Previos

- Cuenta de Supabase con proyecto activo
- Acceso al SQL Editor en el dashboard de Supabase
- Credenciales de administrador del proyecto

---

## 🚀 Opción 1: Configuración Automática con SQL

### Paso 1: Ejecutar la Migración

1. Accede al **Dashboard de Supabase**
2. Ve a **SQL Editor** en el menú lateral
3. Abre el archivo `database/migrations/013_create_storage_bucket_for_documents.sql`
4. Copia y pega el contenido completo
5. Haz clic en **Run** para ejecutar la migración

### Paso 2: Verificar la Creación

1. Ve a **Storage** en el menú lateral
2. Deberías ver el bucket `digital-book-documents`
3. Verifica que el bucket esté marcado como **Private**

---

## 🛠️ Opción 2: Configuración Manual en el Dashboard

### Paso 1: Crear el Bucket

1. Ve a **Storage** en el dashboard de Supabase
2. Haz clic en **Create bucket**
3. Configura el bucket:
   - **Name**: `digital-book-documents`
   - **Public bucket**: ❌ **No** (dejar desmarcado)
   - **File size limit**: `10 MB`
   - **Allowed MIME types**: Selecciona:
     - `application/pdf`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `application/vnd.ms-excel`
     - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
     - `image/jpeg`
     - `image/png`
     - `image/webp`
     - `application/zip`
     - `text/plain`

### Paso 2: Configurar Políticas RLS

1. Ve a **Storage** > **Policies**
2. Selecciona el bucket `digital-book-documents`
3. Crea las siguientes políticas:

#### Política 1: Upload de Documentos
```sql
-- Nombre: Authenticated users can upload documents
-- Operación: INSERT
-- Target roles: authenticated

WITH CHECK (
  bucket_id = 'digital-book-documents' AND
  auth.uid() IS NOT NULL
)
```

#### Política 2: Lectura de Documentos
```sql
-- Nombre: Authenticated users can view documents
-- Operación: SELECT
-- Target roles: authenticated

USING (
  bucket_id = 'digital-book-documents' AND
  auth.uid() IS NOT NULL
)
```

#### Política 3: Actualización de Documentos
```sql
-- Nombre: Authenticated users can update documents
-- Operación: UPDATE
-- Target roles: authenticated

USING (
  bucket_id = 'digital-book-documents' AND
  auth.uid() IS NOT NULL
)
WITH CHECK (
  bucket_id = 'digital-book-documents' AND
  auth.uid() IS NOT NULL
)
```

#### Política 4: Eliminación de Documentos
```sql
-- Nombre: Authenticated users can delete documents
-- Operación: DELETE
-- Target roles: authenticated

USING (
  bucket_id = 'digital-book-documents' AND
  auth.uid() IS NOT NULL
)
```

---

## 🧪 Verificación de Configuración

### 1. Verificar que el Bucket Existe

```sql
SELECT * FROM storage.buckets WHERE id = 'digital-book-documents';
```

**Resultado esperado:**
```
id                        | name                      | public | file_size_limit
--------------------------|---------------------------|--------|----------------
digital-book-documents    | digital-book-documents    | false  | 10485760
```

### 2. Verificar Políticas RLS

```sql
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%digital-book-documents%';
```

**Resultado esperado:**
Deberías ver 4 políticas (INSERT, SELECT, UPDATE, DELETE)

---

## 📂 Estructura de Archivos en Storage

Los documentos se organizarán de la siguiente manera:

```
digital-book-documents/
├── {bookId}/
│   ├── datos_generales/
│   │   └── documento-123456789_abc123.pdf
│   ├── proyecto_tecnico/
│   │   ├── proyecto-ejecucion-123456790_xyz789.pdf
│   │   ├── memoria-obra-123456791_def456.pdf
│   │   └── plano-planta1-123456792_ghi789.dwg
│   ├── documentacion_administrativa/
│   │   ├── licencia-obra-123456793_jkl012.pdf
│   │   └── seguro-decenal-123456794_mno345.pdf
│   ├── manual_uso_mantenimiento/
│   ├── registro_incidencias_actuaciones/
│   ├── certificados_garantias/
│   └── anexos_planos/
```

---

## 🔒 Seguridad

### Políticas RLS Implementadas

✅ **Bucket privado**: Las URLs requieren autenticación  
✅ **Solo usuarios autenticados**: Requiere JWT válido  
✅ **Signed URLs**: URLs temporales con expiración (1 año por defecto)  
✅ **Límite de tamaño**: 10 MB por archivo  
✅ **MIME types restringidos**: Solo archivos permitidos  

### Consideraciones

- Las políticas actuales permiten a cualquier usuario autenticado ver todos los documentos
- Para mayor seguridad, puedes refinar las políticas para verificar que el usuario tenga acceso al edificio correspondiente
- Los documentos sensibles deben ser encriptados antes de subirlos

---

## 📊 Límites de Storage

### Plan Free
- **Storage**: 1 GB
- **Transferencia**: 2 GB/mes
- **Archivos**: Sin límite de cantidad

### Plan Pro ($25/mes)
- **Storage**: 100 GB
- **Transferencia**: 200 GB/mes
- **Archivos**: Sin límite de cantidad

---

## 🔧 Troubleshooting

### Error: "new row violates row-level security policy"

**Causa**: Las políticas RLS no están configuradas correctamente.

**Solución**:
1. Verifica que las políticas estén activas
2. Ejecuta la migración SQL nuevamente
3. Verifica que el usuario esté autenticado con un JWT válido

### Error: "Bucket not found"

**Causa**: El bucket no existe o el nombre es incorrecto.

**Solución**:
1. Verifica que el bucket se llame exactamente `digital-book-documents`
2. Ejecuta la migración SQL para crearlo
3. Verifica en Storage > Buckets que el bucket existe

### Error: "File size exceeds maximum"

**Causa**: El archivo supera los 10 MB.

**Solución**:
1. Comprime el archivo
2. Divide el archivo en partes más pequeñas
3. Aumenta el límite en la configuración del bucket (si tienes plan Pro)

---

## 📚 Recursos Adicionales

- [Documentación oficial de Supabase Storage](https://supabase.com/docs/guides/storage)
- [Políticas RLS en Storage](https://supabase.com/docs/guides/storage/security/access-control)
- [Signed URLs en Supabase](https://supabase.com/docs/guides/storage/serving/downloads)

---

## ✅ Checklist de Configuración

- [ ] Bucket `digital-book-documents` creado
- [ ] Bucket configurado como privado
- [ ] Límite de 10 MB configurado
- [ ] MIME types permitidos configurados
- [ ] 4 políticas RLS creadas (INSERT, SELECT, UPDATE, DELETE)
- [ ] Políticas verificadas con query SQL
- [ ] Test de upload realizado

---

¿Necesitas ayuda? Consulta el [README del proyecto](../README.md) o abre un issue en GitHub.

