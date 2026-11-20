# Guion del video (10 a 15 minutos)

**Antes de grabar:** pantalla compartida, audio claro, fuente grande en VS Code (Ctrl + `+`), `.env` fuera de pantalla, tokens de Postman sin mostrar valores reales. Debe **identificarse** (nombre completo) y explicar todo el contenido técnico. Suban el video como **no listado** (YouTube) o a Drive con acceso de lectura por enlace.

| Min | Qué mostrar / decir |
|---|---|
| 0:00–1:00 | Presentación: su nombre, asignatura, propósito de la API (catálogo + favoritos con JWT y roles). |
| 1:00–3:00 | Organización del proyecto (`routes` → `controllers` → `db`), `package.json`, `.env.example`. Modelo de datos en `schema.sql`: PK compuesta de favoritos, `CHECK (precio > 0)`, `ON DELETE CASCADE`. Elección de SQLite. |
| 3:00–4:30 | Aportes (trabajo individual) y el historial de commits: `git log --oneline`. |
| 4:30–7:00 | **Fragmentos propios:** (1) un CRUD, p. ej. `crear` en `productos.controller.js` con `validarProducto`; (2) verificación del JWT en `middleware/auth.js` (firma, expiración, usuario existente). |
| 7:00–8:00 | Control de rol y de propiedad: `requerirRol('admin')` y cómo `favoritos.controller.js` usa `req.usuario.id` (nunca un id del cliente). |
| 8:00–9:30 | **Seguimiento de una petición:** en Postman `POST /api/favoritos` → `app.js` → `favoritos.routes.js` → `autenticar` → controlador → consulta SQL → respuesta JSON 201. |
| 9:30–13:00 | **Demostración de pruebas** (Collection Runner o peticiones sueltas): flujo exitoso (registro, login, CRUD admin); errores de validación (400); 401 sin token/vencido; 403 con rol usuario; aislamiento A/B; **reinicio del servidor** (Ctrl+C, `npm start`) y consulta 4.5 que prueba la persistencia. También `npm test`. |
| 13:00–14:30 | **Una dificultad y cómo se resolvió** (ver ideas abajo) y cómo ejecutar el proyecto desde el repositorio (`npm install`, `.env`, `npm run setup`, `npm start`). |
| 14:30–15:00 | Cierre. |

## Ideas de dificultad real (elijan una que sí hayan vivido)

- En `.env`, la clave del admin con `#` se cortaba (dotenv lo toma como comentario); se resolvió con comillas y se documentó en el README.
- SQLite no aplica claves foráneas por defecto: hubo que activar `PRAGMA foreign_keys = ON` para que el borrado en cascada de favoritos funcionara.
- Distinguir 401 (no autenticado) de 403 (sin permiso) y 404 vs 409 en favoritos.
