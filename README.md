# API REST de Catálogo de Productos y Favoritos

API REST desarrollada con **Node.js + Express** que gestiona un catálogo de productos y los favoritos personales de cada usuario, con **autenticación JWT** y **autorización por roles** (`admin` / `usuario`).

## Autor

**Perea Romero Steven José** — trabajo individual.

Asignatura: Desarrollo Web — Universidad Estatal de Milagro (UNEMI). Tarea S10-TAREA_2.

## Propósito

Ofrecer un backend para consultar un catálogo de productos (público), administrarlo (solo administrador) y permitir que cada usuario registrado guarde sus productos favoritos, sin poder ver ni modificar los de otros usuarios.

## Elección de base de datos: SQLite

Se eligió **SQLite** (módulo `node:sqlite` incluido en Node.js) porque:

- No requiere instalar ni configurar un servidor ni compilar dependencias nativas: la base es un archivo local, por lo que el proyecto se ejecuta en cualquier equipo con Node.js 22.13 o superior y `npm install`.
- Soporta claves foráneas, restricciones `UNIQUE`/`CHECK` y claves compuestas, suficientes para garantizar la integridad (precio > 0, correo único, favoritos sin duplicados).
- Las consultas usan **sentencias preparadas con parámetros** (previene inyección SQL).
- El esquema está en [`src/db/schema.sql`](src/db/schema.sql) y se aplica automáticamente al iniciar.

### Modelo de datos

| Tabla | Campos | Restricciones |
|---|---|---|
| `usuarios` | id, nombre, correo, password_hash, rol, creado_en | `correo` UNIQUE; `rol` ∈ {`usuario`,`admin`}; contraseña guardada como hash bcrypt |
| `productos` | id, nombre, descripcion, categoria, precio, creado_en | `precio > 0` (CHECK) |
| `favoritos` | usuario_id, producto_id, creado_en | PK compuesta (sin duplicados); FK a usuarios y productos con `ON DELETE CASCADE` |

**Regla de consistencia:** al eliminar un producto, sus favoritos se eliminan automáticamente (`ON DELETE CASCADE`), por lo que nunca quedan favoritos apuntando a productos inexistentes.

## Estructura del proyecto

```
src/
  config/        configuración y variables de entorno
  db/            conexión, schema.sql, seed.js, init-admin.js
  middleware/    auth.js (JWT + roles), errores.js
  controllers/   lógica de auth, productos y favoritos
  routes/        definición de rutas
  utils/         validadores y HttpError
  app.js         aplicación Express
  server.js      arranque del servidor
tests/           pruebas automáticas (node:test)
postman/         colección y entorno de ejemplo
docs/            guion del video y plantilla de entrega
```

## Requisitos

- **Node.js 22.13 o superior** (usa el módulo SQLite incluido en Node; probado con Node 22). Puede mostrarse un aviso «ExperimentalWarning: SQLite»: es normal.
- npm

## Instalación

```bash
git clone <URL-DEL-REPOSITORIO>
cd <carpeta-del-repositorio>
npm install
cp .env.example .env      # en Windows (PowerShell): copy .env.example .env
```

Edite `.env` y defina valores propios (ver siguiente sección).

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `DB_PATH` | Ruta del archivo SQLite | `./data/catalogo.db` |
| `JWT_SECRET` | Secreto de firma de los JWT (**obligatorio**, largo y aleatorio) | _(cadena aleatoria)_ |
| `JWT_EXPIRES_IN` | Vigencia del token | `1h` |
| `ADMIN_NOMBRE` | Nombre del administrador inicial | `Administrador` |
| `ADMIN_EMAIL` | Correo del administrador inicial | `admin@ejemplo.com` |
| `ADMIN_PASSWORD` | Clave del administrador inicial (mín. 8 caracteres) | _(su clave)_ |

> Si una clave contiene `#`, escríbala entre comillas en el `.env` (`ADMIN_PASSWORD="Clave#Segura1"`); de lo contrario se interpreta como comentario.
> El archivo `.env` **no se sube** al repositorio (está en `.gitignore`).

## Inicialización de datos y del administrador

```bash
npm run seed         # carga 7 productos ficticios (idempotente)
npm run init-admin   # crea el administrador con ADMIN_EMAIL / ADMIN_PASSWORD
# o ambos a la vez:
npm run setup
```

El administrador **solo** puede crearse con este procedimiento local. El registro público siempre crea usuarios con rol `usuario` y **ignora** cualquier campo `rol` enviado.

## Ejecución

```bash
npm start       # producción simple
npm run dev     # reinicio automático al editar (node --watch)
```

La API queda en `http://localhost:3000/api`. Comprobación: `GET /api/salud`.

## Rutas de la API (prefijo `/api`)

| Método y ruta | Acceso | Descripción |
|---|---|---|
| `POST /auth/registro` | Público | Registra un usuario normal |
| `POST /auth/login` | Público | Valida credenciales y emite un JWT |
| `GET /productos` | Público | Lista productos; filtro opcional `?categoria=Audio` |
| `GET /productos/:id` | Público | Consulta un producto |
| `POST /productos` | Administrador | Crea un producto |
| `PUT /productos/:id` | Administrador | Actualiza un producto |
| `DELETE /productos/:id` | Administrador | Elimina un producto (y sus favoritos) |
| `GET /favoritos` | Autenticado | Lista los favoritos del usuario del token |
| `POST /favoritos` | Autenticado | Agrega un producto a sus favoritos |
| `DELETE /favoritos/:productoId` | Autenticado | Quita un producto de sus favoritos |

Las rutas protegidas requieren el encabezado `Authorization: Bearer <token>`.

### Cuerpos de petición

**POST /auth/registro**
```json
{ "nombre": "Ana Prueba", "correo": "ana@ejemplo.com", "password": "ClaveAna#123" }
```
Respuesta `201`: `{ "ok": true, "data": { "id": 2, "nombre": "Ana Prueba", "correo": "ana@ejemplo.com", "rol": "usuario" } }`

**POST /auth/login**
```json
{ "correo": "ana@ejemplo.com", "password": "ClaveAna#123" }
```
Respuesta `200`: `{ "ok": true, "data": { "token": "<jwt>", "tipo": "Bearer", "usuario": { ... } } }`

**POST /productos** y **PUT /productos/:id** (administrador)
```json
{ "nombre": "Laptop Aurora 14", "descripcion": "Portátil ligero", "categoria": "Computación", "precio": 749.9 }
```

**POST /favoritos**
```json
{ "productoId": 3 }
```
La identidad del usuario se obtiene **del token verificado**; cualquier `usuarioId` enviado por el cliente se ignora.

### Códigos de estado y criterio

| Código | Uso |
|---|---|
| `200` | Consultas, actualizaciones y eliminaciones exitosas (las eliminaciones devuelven un JSON con mensaje) |
| `201` | Creación (registro, producto, favorito) |
| `400` | Datos inválidos: campos vacíos, correo mal formado, precio ≤ 0 o no numérico, identificador no entero positivo, JSON malformado |
| `401` | Sin token, token inválido o vencido, credenciales incorrectas |
| `403` | Usuario autenticado sin el rol requerido |
| `404` | Producto o favorito inexistente |
| `409` | Duplicados: correo ya registrado o favorito repetido |
| `500` | Error interno (mensaje genérico, sin detalles) |

> **Criterio 400 vs 422:** se usa `400` para todos los errores de validación del cuerpo o de parámetros, con un arreglo `detalles` que indica cada campo inválido. Las respuestas de error siguen el formato `{ "ok": false, "error": "...", "detalles": [...] }`.

## Seguridad aplicada

- Contraseñas con **bcrypt** (hash con sal); nunca se devuelven contraseñas ni hashes.
- JWT firmado (HS256) con vencimiento; se verifica firma y expiración en cada ruta protegida.
- Mensaje único «Credenciales incorrectas» (no revela si el correo existe).
- Rol leído de la base de datos en cada petición; aislamiento de favoritos por usuario.
- Consultas parametrizadas, validación en servidor y límite de tamaño del cuerpo (10 KB).
- Secretos solo en variables de entorno; `.env` excluido del repositorio.

## Pruebas

### Automáticas (Node)

Arrancan el servidor real con una base de datos temporal y verifican todos los casos exigidos (incluido el reinicio del servidor):

```bash
npm test
```

### Postman

1. Importe `postman/catalogo.postman_collection.json` y `postman/local.postman_environment.json`.
2. En el entorno complete `admin_password` (la de su `.env`). Para el caso de token vencido, complete también `jwt_secret` con su `JWT_SECRET` local (**solo en su equipo; no lo suba**).
3. Ejecute `npm run setup` y `npm start`.
4. Con *Collection Runner*, ejecute la colección **en orden** (carpetas 1 a 4).
5. Para la prueba de persistencia: ejecute hasta la petición 4.4, detenga el servidor (Ctrl+C), inícielo de nuevo con `npm start` y ejecute la 4.5.

También por consola: `npx newman run postman/catalogo.postman_collection.json -e postman/local.postman_environment.json --env-var admin_password=<su-clave> --env-var jwt_secret=<su-secreto>`.

La colección cubre: registro/login correctos, correo duplicado, credenciales incorrectas, CRUD de productos como administrador, filtro por categoría, precio inválido y campos vacíos, producto inexistente, 401 sin token / con token vencido, 403 con rol usuario, favoritos (alta, listado, baja, 409 duplicado, 404 inexistente), aislamiento entre usuarios A y B, y persistencia tras reiniciar.

## Recursos y herramientas de apoyo

- Documentación oficial de Node.js (`node:sqlite`), Express, `jsonwebtoken` y `bcryptjs`.
- Se usó un asistente de IA como apoyo en el desarrollo; el código fue revisado y es explicado por el autor en el video.

## Licencia

ISC — proyecto académico.
