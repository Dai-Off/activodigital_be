# Guía Rápida - Carga de Libro Digital con IA

## 🚀 Inicio Rápido

### 1. Variable de Entorno

Asegúrate de tener configurado en tu archivo `.env`:

```bash
OPENAI_API_KEY=sk-proj-...
```

### 2. Usar el Endpoint

**URL:** `POST /api/libros-digitales/upload-ai`

**Headers:**
```
Authorization: Bearer <tu_token_jwt>
Content-Type: multipart/form-data
```

**Body (form-data):**
- `document`: Archivo PDF o TXT del libro digital
- `buildingId`: UUID del edificio

### 3. Ejemplo con cURL

```bash
curl -X POST http://localhost:3000/api/libros-digitales/upload-ai \
  -H "Authorization: Bearer tu_token_aqui" \
  -F "document=@libro-digital.pdf" \
  -F "buildingId=123e4567-e89b-12d3-a456-426614174000"
```

### 4. Ejemplo con JavaScript

```javascript
const formData = new FormData();
formData.append('document', pdfFile);
formData.append('buildingId', edificioId);

const response = await fetch('/api/libros-digitales/upload-ai', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { data } = await response.json();
console.log('Libro creado:', data.id);
```

## 📋 Lo Que Hace

1. ✅ Recibe el archivo PDF o TXT
2. 📄 Extrae el texto del documento
3. 🤖 Procesa con OpenAI GPT-4 para extraer datos
4. 🏗️ Genera las 8 secciones del libro digital:
   - Datos generales
   - Características constructivas
   - Certificados y licencias
   - Mantenimiento y conservación
   - Instalaciones y consumo
   - Reformas y rehabilitaciones
   - Sostenibilidad y ESG
   - Documentos anexos
5. 💾 Guarda automáticamente en la base de datos

## ⚠️ Requisitos

- Usuario debe ser TECNICO o PROPIETARIO del edificio
- El edificio NO debe tener ya un libro digital
- El documento debe tener al menos 100 caracteres de texto
- Tamaño máximo: 10 MB

## 🎯 Respuesta Exitosa

```json
{
  "data": {
    "id": "...",
    "buildingId": "...",
    "source": "pdf",
    "status": "draft",
    "progress": 5,
    "sections": [...]
  },
  "message": "Libro digital creado exitosamente mediante IA",
  "metadata": {
    "fileName": "libro-digital.pdf",
    "sectionsGenerated": 8
  }
}
```

## 🔧 Probar Localmente

```bash
# 1. Instalar dependencias (ya hecho)
npm install

# 2. Compilar
npm run build

# 3. Iniciar servidor
npm run dev

# 4. Probar endpoint
# Usar Postman o cURL con los ejemplos de arriba
```

## 📚 Más Información

Ver documentación completa en: [ai-digital-book-api.md](./ai-digital-book-api.md)

