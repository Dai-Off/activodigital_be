# API Examples - Activo Digital Backend

Este documento muestra ejemplos de cómo usar la API para gestionar edificios y libros digitales.

## Autenticación

Todas las rutas requieren autenticación. Incluye el token JWT en el header:

```
Authorization: Bearer <tu_jwt_token>
```

## Edificios (Buildings)

### Crear un edificio

```http
POST /edificios
Content-Type: application/json

{
  "name": "Edificio Residencial Centro",
  "address": "Calle Mayor 123, Madrid",
  "cadastralReference": "1234567890",
  "constructionYear": 2010,
  "typology": "residential",
  "numFloors": 5,
  "numUnits": 20,
  "lat": 40.4168,
  "lng": -3.7038,
  "images": [
    {
      "id": "img-1",
      "url": "https://example.com/image1.jpg",
      "title": "Fachada principal",
      "isMain": true
    }
  ]
}
```

### Obtener todos los edificios del usuario

```http
GET /edificios
```

### Obtener un edificio específico

```http
GET /edificios/{id}
```

### Actualizar un edificio

```http
PUT /edificios/{id}
Content-Type: application/json

{
  "name": "Nuevo nombre del edificio",
  "numUnits": 25
}
```

### Actualizar el estado de un edificio

```http
PATCH /edificios/{id}/status
Content-Type: application/json

{
  "status": "ready_book"
}
```

### Agregar una imagen

```http
POST /edificios/{id}/images
Content-Type: application/json

{
  "id": "img-2",
  "url": "https://example.com/image2.jpg",
  "title": "Vista interior",
  "isMain": false
}
```

### Establecer imagen principal

```http
PATCH /edificios/{id}/images/{imageId}/main
```

### Eliminar una imagen

```http
DELETE /edificios/{id}/images/{imageId}
```

### Eliminar un edificio

```http
DELETE /edificios/{id}
```

## Libros Digitales

### Crear un libro digital

```http
POST /libros-digitales
Content-Type: application/json

{
  "buildingId": "uuid-del-edificio",
  "source": "manual"
}
```

### Obtener todos los libros del usuario

```http
GET /libros-digitales
```

### Obtener un libro específico

```http
GET /libros-digitales/{id}
```

### Obtener el libro de un edificio

```http
GET /libros-digitales/building/{buildingId}
```

### Actualizar una sección del libro

```http
PUT /libros-digitales/{id}/sections/{sectionType}
Content-Type: application/json

{
  "content": {
    "descripcion": "Descripción de los datos generales",
    "superficie": "150 m²",
    "uso": "Residencial"
  },
  "complete": true
}
```

Tipos de sección disponibles:
- `general_data`
- `construction_features`
- `certificates_and_licenses`
- `maintenance_and_conservation`
- `facilities_and_consumption`
- `renovations_and_rehabilitations`
- `sustainability_and_esg`
- `annex_documents`

### Obtener información de las secciones

```http
GET /libros-digitales/sections/info
```

### Eliminar un libro digital

```http
DELETE /libros-digitales/{id}
```

## Respuestas de la API

### Respuesta exitosa

```json
{
  "data": {
    "id": "uuid",
    "name": "Edificio Ejemplo",
    // ... resto de datos
  }
}
```

### Respuesta de error

```json
{
  "error": "Descripción del error"
}
```

## Códigos de estado HTTP

- `200` - OK
- `201` - Creado
- `204` - Sin contenido (para eliminaciones)
- `400` - Petición incorrecta
- `401` - No autenticado
- `404` - No encontrado
- `500` - Error interno del servidor
