// Crea el administrador inicial usando variables de entorno (ADMIN_*).
// El rol admin NUNCA se puede asignar desde el registro público.
const bcrypt = require('bcryptjs');
const db = require('./database');

const nombre = process.env.ADMIN_NOMBRE || 'Administrador';
const correo = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';

if (!correo || password.length < 8) {
  console.error('Define ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 8 caracteres) en tu archivo .env');
  process.exit(1);
}

const existente = db.prepare('SELECT id, rol FROM usuarios WHERE correo = ?').get(correo);
if (existente) {
  if (existente.rol !== 'admin') {
    db.prepare("UPDATE usuarios SET rol = 'admin' WHERE id = ?").run(existente.id);
    console.log(`El usuario ${correo} ya existía y ahora es administrador.`);
  } else {
    console.log(`El administrador ${correo} ya existe. No se hicieron cambios.`);
  }
} else {
  const hash = bcrypt.hashSync(password, 10);
  db.prepare("INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, 'admin')").run(nombre, correo, hash);
  console.log(`Administrador creado: ${correo}`);
}
