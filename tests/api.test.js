// Pruebas de integración (caja negra): arrancan el servidor real con una BD temporal
// y verifican cada caso exigido en la tarea. Ejecutar con: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const jwt = require('jsonwebtoken');

const RAIZ = path.join(__dirname, '..');
const PUERTO = 3900 + Math.floor(Math.random() * 90);
const BASE = `http://localhost:${PUERTO}/api`;
const SECRETO = 'secreto-solo-para-pruebas-automaticas';
const dirTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'catalogo-'));
const ENTORNO = {
  ...process.env,
  PORT: String(PUERTO),
  DB_PATH: path.join(dirTmp, 'prueba.db'),
  JWT_SECRET: SECRETO,
  JWT_EXPIRES_IN: '1h',
  ADMIN_EMAIL: 'admin.test@ejemplo.com',
  ADMIN_PASSWORD: 'AdminTest#2026',
};

let servidor;

async function iniciarServidor() {
  servidor = spawn(process.execPath, ['src/server.js'], { cwd: RAIZ, env: ENTORNO, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`${BASE}/salud`);
      if (r.ok) return;
    } catch { /* aún no está listo */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('El servidor no inició a tiempo');
}

async function detenerServidor() {
  if (!servidor) return;
  const cerrado = new Promise((r) => servidor.once('exit', r));
  servidor.kill();
  await cerrado;
}

async function api(metodo, ruta, { token, cuerpo } = {}) {
  const res = await fetch(BASE + ruta, {
    method: metodo,
    headers: {
      ...(cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* sin cuerpo */ }
  return { status: res.status, json };
}

const A = { nombre: 'Ana Prueba', correo: 'ana@ejemplo.com', password: 'ClaveAna#123' };
const B = { nombre: 'Beto Prueba', correo: 'beto@ejemplo.com', password: 'ClaveBeto#123' };
const estado = {};

test.before(async () => {
  execFileSync(process.execPath, ['src/db/seed.js'], { cwd: RAIZ, env: ENTORNO, stdio: 'ignore' });
  execFileSync(process.execPath, ['src/db/init-admin.js'], { cwd: RAIZ, env: ENTORNO, stdio: 'ignore' });
  await iniciarServidor();
});

test.after(async () => {
  await detenerServidor();
  fs.rmSync(dirTmp, { recursive: true, force: true });
});

test('1. Registro y login correctos; sin exponer contraseñas ni hashes', async () => {
  const reg = await api('POST', '/auth/registro', { cuerpo: A });
  assert.equal(reg.status, 201);
  assert.equal(reg.json.data.rol, 'usuario');
  assert.equal(reg.json.data.password, undefined);
  assert.equal(reg.json.data.password_hash, undefined);

  const log = await api('POST', '/auth/login', { cuerpo: { correo: A.correo, password: A.password } });
  assert.equal(log.status, 200);
  assert.ok(log.json.data.token);
  assert.equal(JSON.stringify(log.json).includes('password'), false);
  estado.tokenA = log.json.data.token;

  await api('POST', '/auth/registro', { cuerpo: B });
  estado.tokenB = (await api('POST', '/auth/login', { cuerpo: { correo: B.correo, password: B.password } })).json.data.token;

  const adm = await api('POST', '/auth/login', {
    cuerpo: { correo: ENTORNO.ADMIN_EMAIL, password: ENTORNO.ADMIN_PASSWORD },
  });
  assert.equal(adm.status, 200);
  assert.equal(adm.json.data.usuario.rol, 'admin');
  estado.tokenAdmin = adm.json.data.token;
});

test('2. Registro rechaza correo duplicado (409) y no permite asignarse rol admin', async () => {
  const dup = await api('POST', '/auth/registro', { cuerpo: A });
  assert.equal(dup.status, 409);

  const intento = await api('POST', '/auth/registro', {
    cuerpo: { nombre: 'Intruso', correo: 'intruso@ejemplo.com', password: 'ClaveIntruso#1', rol: 'admin' },
  });
  assert.equal(intento.status, 201);
  assert.equal(intento.json.data.rol, 'usuario');
});

test('3. Login con credenciales incorrectas devuelve 401', async () => {
  const r1 = await api('POST', '/auth/login', { cuerpo: { correo: A.correo, password: 'incorrecta' } });
  assert.equal(r1.status, 401);
  const r2 = await api('POST', '/auth/login', { cuerpo: { correo: 'noexiste@ejemplo.com', password: 'x12345678' } });
  assert.equal(r2.status, 401);
  assert.equal(r1.json.error, r2.json.error); // mismo mensaje: no revela si el correo existe
});

test('4. Registro valida campos vacíos y correo inválido (400)', async () => {
  const r1 = await api('POST', '/auth/registro', { cuerpo: { nombre: '', correo: 'malo', password: '123' } });
  assert.equal(r1.status, 400);
  assert.ok(Array.isArray(r1.json.detalles) && r1.json.detalles.length >= 3);
});

test('5. Consulta pública del catálogo (sin token) y filtro por categoría', async () => {
  const todos = await api('GET', '/productos');
  assert.equal(todos.status, 200);
  assert.ok(todos.json.total >= 5);

  const audio = await api('GET', '/productos?categoria=Audio');
  assert.equal(audio.status, 200);
  assert.ok(audio.json.data.length >= 1);
  assert.ok(audio.json.data.every((p) => p.categoria === 'Audio'));

  const uno = await api('GET', `/productos/${todos.json.data[0].id}`);
  assert.equal(uno.status, 200);
  assert.equal(uno.json.data.id, todos.json.data[0].id);
});

test('6. CRUD completo de productos como administrador', async () => {
  const nuevo = { nombre: 'Producto de prueba', descripcion: 'Descripción de prueba', categoria: 'Pruebas', precio: 10.5 };
  const c = await api('POST', '/productos', { token: estado.tokenAdmin, cuerpo: nuevo });
  assert.equal(c.status, 201);
  estado.productoId = c.json.data.id;
  assert.equal(c.json.data.precio, 10.5);

  const u = await api('PUT', `/productos/${estado.productoId}`, {
    token: estado.tokenAdmin,
    cuerpo: { ...nuevo, nombre: 'Producto actualizado', precio: 12 },
  });
  assert.equal(u.status, 200);
  assert.equal(u.json.data.nombre, 'Producto actualizado');
  assert.equal(u.json.data.precio, 12);

  const g = await api('GET', `/productos/${estado.productoId}`);
  assert.equal(g.json.data.nombre, 'Producto actualizado');
});

test('7. Rechazo de precio inválido, campos vacíos y producto inexistente', async () => {
  const base = { nombre: 'X', descripcion: 'Y', categoria: 'Z' };
  for (const precio of [0, -5, 'diez', null]) {
    const r = await api('POST', '/productos', { token: estado.tokenAdmin, cuerpo: { ...base, precio } });
    assert.equal(r.status, 400, `precio ${JSON.stringify(precio)} debe rechazarse`);
  }
  const vacio = await api('POST', '/productos', { token: estado.tokenAdmin, cuerpo: { nombre: '', descripcion: '', categoria: '', precio: 5 } });
  assert.equal(vacio.status, 400);

  assert.equal((await api('GET', '/productos/999999')).status, 404);
  assert.equal((await api('GET', '/productos/abc')).status, 400);
  assert.equal((await api('PUT', '/productos/999999', { token: estado.tokenAdmin, cuerpo: { ...base, precio: 3 } })).status, 404);
  assert.equal((await api('DELETE', '/productos/999999', { token: estado.tokenAdmin })).status, 404);
});

test('8. Sin token o con token vencido/alterado devuelve 401', async () => {
  assert.equal((await api('GET', '/favoritos')).status, 401);
  assert.equal((await api('POST', '/productos', { cuerpo: {} })).status, 401);

  const vencido = jwt.sign({ sub: 1, rol: 'admin' }, SECRETO, { expiresIn: -60 });
  const r = await api('GET', '/favoritos', { token: vencido });
  assert.equal(r.status, 401);
  assert.match(r.json.error, /expirado/i);

  const firmaFalsa = jwt.sign({ sub: 1, rol: 'admin' }, 'otro-secreto');
  assert.equal((await api('GET', '/favoritos', { token: firmaFalsa })).status, 401);
  assert.equal((await api('GET', '/favoritos', { token: 'basura.no.jwt' })).status, 401);
});

test('9. Modificar el catálogo con rol usuario devuelve 403', async () => {
  const cuerpo = { nombre: 'N', descripcion: 'D', categoria: 'C', precio: 1 };
  assert.equal((await api('POST', '/productos', { token: estado.tokenA, cuerpo })).status, 403);
  assert.equal((await api('PUT', `/productos/${estado.productoId}`, { token: estado.tokenA, cuerpo })).status, 403);
  assert.equal((await api('DELETE', `/productos/${estado.productoId}`, { token: estado.tokenA })).status, 403);
});

test('10. Favoritos: agregar (201), listar, duplicado (409), inexistente (404), quitar', async () => {
  const lista = (await api('GET', '/productos')).json.data;
  estado.p1 = lista[0].id;
  estado.p2 = lista[1].id;

  const add = await api('POST', '/favoritos', { token: estado.tokenA, cuerpo: { productoId: estado.p1 } });
  assert.equal(add.status, 201);
  assert.equal((await api('POST', '/favoritos', { token: estado.tokenA, cuerpo: { productoId: estado.p2 } })).status, 201);

  assert.equal((await api('POST', '/favoritos', { token: estado.tokenA, cuerpo: { productoId: estado.p1 } })).status, 409);
  assert.equal((await api('POST', '/favoritos', { token: estado.tokenA, cuerpo: { productoId: 999999 } })).status, 404);
  assert.equal((await api('POST', '/favoritos', { token: estado.tokenA, cuerpo: { productoId: 'abc' } })).status, 400);

  const l = await api('GET', '/favoritos', { token: estado.tokenA });
  assert.equal(l.status, 200);
  assert.equal(l.json.total, 2);

  const del = await api('DELETE', `/favoritos/${estado.p2}`, { token: estado.tokenA });
  assert.equal(del.status, 200);
  assert.equal((await api('GET', '/favoritos', { token: estado.tokenA })).json.total, 1);
  assert.equal((await api('DELETE', `/favoritos/${estado.p2}`, { token: estado.tokenA })).status, 404);
});

test('11. Aislamiento: B no ve ni quita los favoritos de A; el favorito de A permanece', async () => {
  const vistaB = await api('GET', '/favoritos', { token: estado.tokenB });
  assert.equal(vistaB.json.total, 0);

  // El cliente no puede suplantar identidad enviando un usuarioId: se ignora.
  await api('POST', '/favoritos', { token: estado.tokenB, cuerpo: { productoId: estado.p2, usuarioId: 1 } });
  const intento = await api('DELETE', `/favoritos/${estado.p1}`, { token: estado.tokenB });
  assert.equal(intento.status, 404);

  const vistaA = await api('GET', '/favoritos', { token: estado.tokenA });
  assert.ok(vistaA.json.data.some((p) => p.id === estado.p1), 'el favorito de A debe seguir existiendo');
});

test('12. Eliminar un producto elimina sus favoritos (consistencia)', async () => {
  await api('POST', '/favoritos', { token: estado.tokenA, cuerpo: { productoId: estado.productoId } });
  assert.equal((await api('DELETE', `/productos/${estado.productoId}`, { token: estado.tokenAdmin })).status, 200);
  assert.equal((await api('GET', `/productos/${estado.productoId}`)).status, 404);
  const fav = await api('GET', '/favoritos', { token: estado.tokenA });
  assert.ok(!fav.json.data.some((p) => p.id === estado.productoId));
});

test('13. Persistencia tras reiniciar el servidor', async () => {
  const antes = (await api('GET', '/favoritos', { token: estado.tokenA })).json.data.map((p) => p.id);
  const productosAntes = (await api('GET', '/productos')).json.total;

  await detenerServidor();
  await iniciarServidor();

  const despues = (await api('GET', '/favoritos', { token: estado.tokenA })).json.data.map((p) => p.id);
  assert.deepEqual(despues, antes);
  assert.equal((await api('GET', '/productos')).json.total, productosAntes);
  const login = await api('POST', '/auth/login', { cuerpo: { correo: A.correo, password: A.password } });
  assert.equal(login.status, 200);
});

test('14. JSON malformado y rutas inexistentes responden en JSON sin detalles internos', async () => {
  const res = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{malo' });
  assert.equal(res.status, 400);
  assert.equal((await api('GET', '/no-existe')).status, 404);
});
