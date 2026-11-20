# Entrega: API REST de Catálogo y Favoritos

**Archivo a subir:** `Entrega_Catalogo_Apellido1_Apellido2.pdf` (trabajo individual)

## Autor
- Perea Romero Steven José (trabajo individual)

## Enlaces
- Repositorio público: _(https://github.com/sperear2-web/NOMBRE-DEL-REPO)_
- Video (no listado / Drive): _(enlace)_
- Commit final: _(hash de 7 a 40 caracteres: `git rev-parse HEAD`)_

> Comprobar ambos enlaces en una ventana privada. El código y el video deben corresponder al commit indicado.

## Resumen de aportes
Trabajo individual: diseño del modelo de datos, autenticación JWT y roles, CRUD de productos, favoritos con aislamiento por usuario, pruebas automáticas y colección de Postman, documentación. _(ajustar con sus propias palabras)_

## Tabla de pruebas
(Resultado obtenido: marque tras ejecutar la colección de Postman; todos pasaron en la verificación previa.)

| # | Caso | Resultado esperado | Resultado obtenido |
|---|---|---|---|
| 1 | Registro de usuario A y B | 201, rol `usuario`, sin contraseña ni hash | _(completar)_ |
| 2 | Registro con correo duplicado | 409 | _(completar)_ |
| 3 | Registro con datos inválidos | 400 con lista de errores | _(completar)_ |
| 4 | Registro intentando rol admin | 201 pero rol `usuario` | _(completar)_ |
| 5 | Login correcto (A, B, admin) | 200 con JWT | _(completar)_ |
| 6 | Login con credenciales incorrectas | 401 | _(completar)_ |
| 7 | Listar productos sin token | 200, al menos 5 productos | _(completar)_ |
| 8 | Filtrar por categoría | 200, solo esa categoría | _(completar)_ |
| 9 | Consultar un producto | 200 | _(completar)_ |
| 10 | Crear producto como admin | 201 | _(completar)_ |
| 11 | Actualizar producto como admin | 200 con datos nuevos | _(completar)_ |
| 12 | Precio inválido (≤ 0) | 400 | _(completar)_ |
| 13 | Campos vacíos | 400 | _(completar)_ |
| 14 | Consultar producto inexistente | 404 | _(completar)_ |
| 15 | Crear producto sin token | 401 | _(completar)_ |
| 16 | Crear producto con token vencido | 401 | _(completar)_ |
| 17 | Crear/actualizar/eliminar con rol usuario | 403 | _(completar)_ |
| 18 | Agregar favorito | 201 | _(completar)_ |
| 19 | Favorito duplicado | 409 | _(completar)_ |
| 20 | Favorito de producto inexistente | 404 | _(completar)_ |
| 21 | Listar favoritos propios | 200 | _(completar)_ |
| 22 | B lista favoritos: no ve los de A | 200, total 0 | _(completar)_ |
| 23 | B intenta quitar favorito de A | 404 y el favorito de A permanece | _(completar)_ |
| 24 | Quitar favorito propio | 200 | _(completar)_ |
| 25 | Eliminar producto como admin (cascada de favoritos) | 200; favoritos asociados eliminados | _(completar)_ |
| 26 | Persistencia tras reiniciar Node.js | Mismos datos antes y después | _(completar)_ |
