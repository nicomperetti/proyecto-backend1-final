# Sistema Backend de Turnos y Reservas — Entrega Final

API backend completa para gestionar servicios y reservas con **MongoDB Atlas + Mongoose**, arquitectura en capas, consultas avanzadas, validación con Zod, relaciones con `ObjectId` + `populate`, vistas server-side con Handlebars y comunicación en tiempo real con Socket.io.

## Arquitectura

El flujo principal es:

`routes → controllers → services → repositories → DAO → models`

Las validaciones de entrada están separadas en `src/schemas/` y se ejecutan mediante `src/middlewares/validate.middleware.js` antes de que la información llegue a los servicios o a MongoDB.

- **Routes:** declaran endpoints y conectan middleware/controllers.
- **Controllers:** leen `req`, llaman a la capa de servicios y construyen la respuesta HTTP.
- **Services:** contienen reglas de negocio.
- **Repositories:** abstraen el acceso a los DAO.
- **DAO:** realizan las operaciones concretas con Mongoose.
- **Models:** definen los esquemas de MongoDB.

No se utiliza FileSystem como persistencia: MongoDB Atlas es la fuente principal de datos.

## Funcionalidades finales

### CRUD de servicios

- `GET /api/services`
- `GET /api/services/:sid`
- `POST /api/services`
- `PUT /api/services/:sid`
- `DELETE /api/services/:sid`

### Reservas

- `POST /api/bookings`
- `GET /api/bookings/:bid`
- `POST /api/bookings/:bid/services/:sid`

Las reservas almacenan únicamente referencias a servicios:

```json
{
  "services": [
    {
      "service": "ObjectId",
      "quantity": 1
    }
  ]
}
```

Nunca se persiste el objeto completo del servicio dentro de la reserva. Si se agrega dos veces el mismo servicio, la capa `bookings.service.js` incrementa `quantity`.

## Consultas avanzadas

`GET /api/services` acepta:

- `category`
- `available`
- `page`
- `limit`
- `sortBy`
- `order`

Ejemplos:

```text
GET /api/services?category=salud&available=true
GET /api/services?page=2&limit=5
GET /api/services?sortBy=price&order=desc
GET /api/services?category=salud&page=1&limit=10&sortBy=duration&order=asc
```

`sortBy` permite `name`, `description`, `duration`, `price`, `category`, `available` y `createdAt`. `order` acepta `asc` o `desc`.

La respuesta incluye los resultados y los metadatos:

```json
{
  "items": [],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "hasPrevPage": false,
    "hasNextPage": true
  }
}
```

## Validación con Zod

Se valida antes de llegar a MongoDB:

- Crear servicio: `POST /api/services`
- Actualizar servicio: `PUT /api/services/:sid`
- Crear reserva: `POST /api/bookings`
- Agregar servicio a reserva: `POST /api/bookings/:bid/services/:sid`
- Query params de servicios: `GET /api/services`

Los datos inválidos responden `400` con un mensaje claro.

La validación está separada de rutas y modelos en:

```text
src/
├── schemas/
│   ├── services.schema.js
│   └── bookings.schema.js
└── middlewares/
    └── validate.middleware.js
```

## Relaciones y populate

`GET /api/bookings/:bid` consulta la reserva y utiliza:

```js
.populate("services.service")
```

para devolver los datos completos de los servicios asociados, incluyendo nombre, descripción, duración, precio, categoría y disponibilidad, junto con los datos de cliente, email, fecha, hora y estado de la reserva.

El `populate` es únicamente de lectura. La persistencia mantiene referencias `ObjectId`.

## Handlebars

La aplicación utiliza Handlebars como motor server-side.

Vistas disponibles:

```text
GET /views/services
GET /views/availability
```

`/views/services` muestra datos reales de servicios obtenidos mediante:

`controller → service → repository → DAO → model`

`/views/availability` muestra disponibilidad y reservas reales desde MongoDB.

No hay datos de negocio hardcodeados en las vistas.

## Socket.io

Socket.io está integrado sobre el servidor HTTP.

Acciones reales del sistema que generan eventos:

- Crear servicio → `services:updated`
- Actualizar servicio → `services:updated`
- Eliminar servicio → `services:updated`
- Crear reserva → `bookings:updated`
- Agregar servicio a una reserva → `bookings:updated`

`src/public/js/socket.js` escucha estos eventos y actualiza la interfaz sin recargar la página.

Para comprobarlo, abrí `/views/services` en dos pestañas y modificá servicios mediante la API REST. La otra pestaña recibirá el cambio en tiempo real.

## Estructura

```text
src/
├── config/
│   ├── database.js
│   └── env.config.js
├── controllers/
│   ├── services.controller.js
│   ├── bookings.controller.js
│   └── views.controller.js
├── dao/
│   ├── services.dao.js
│   ├── bookings.dao.js
│   └── messages.dao.js
├── middlewares/
│   └── validate.middleware.js
├── models/
│   ├── service.model.js
│   ├── booking.model.js
│   └── message.model.js
├── repositories/
│   ├── services.repository.js
│   ├── bookings.repository.js
│   └── messages.repository.js
├── routes/
│   ├── services.router.js
│   ├── bookings.router.js
│   └── views.router.js
├── schemas/
│   ├── services.schema.js
│   └── bookings.schema.js
├── services/
│   ├── services.service.js
│   └── bookings.service.js
├── views/
│   ├── layouts/main.handlebars
│   ├── services.handlebars
│   └── availability.handlebars
├── public/
│   ├── css/styles.css
│   └── js/socket.js
├── app.js
└── server.js
```

## Variables de entorno

Crear `.env` a partir de `.env.example`:

```env
PORT=8080
NODE_ENV=development
MONGO_URI=TU_URI_DE_MONGODB_ATLAS
```

No subir `.env`, credenciales reales ni `node_modules` al repositorio.

## Instalación y ejecución

```bash
npm install
npm run dev
```

También se puede ejecutar con:

```bash
npm start
```

Vistas:

```text
http://localhost:8080/views/services
http://localhost:8080/views/availability
```

## Checklist de entrega

- [x] CRUD completo de servicios.
- [x] Creación y consulta de reservas.
- [x] Asociación de servicios a reservas.
- [x] Referencias `ObjectId` + `quantity`.
- [x] `GET /api/services` con filtros, paginación y ordenamiento.
- [x] Metadatos de paginación.
- [x] Validación previa con Zod.
- [x] `populate` en `GET /api/bookings/:bid`.
- [x] Handlebars con datos reales.
- [x] Socket.io con eventos producidos por acciones reales.
- [x] Arquitectura routes → controllers → services → repositories → DAO → models.
- [x] `.env.example` incluido.
- [x] `.env` y `node_modules` excluidos.
