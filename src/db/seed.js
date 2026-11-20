// Carga productos ficticios de ejemplo (idempotente: no duplica si ya existen).
const db = require('./database');

const productos = [
  ['Laptop Aurora 14', 'Portátil ligero de 14 pulgadas con 16 GB de RAM y SSD de 512 GB.', 'Computación', 749.9],
  ['Mouse inalámbrico Pulse', 'Mouse ergonómico inalámbrico con batería recargable.', 'Accesorios', 18.5],
  ['Teclado mecánico Forge', 'Teclado mecánico compacto con retroiluminación blanca.', 'Accesorios', 59.99],
  ['Audífonos Nimbus', 'Audífonos con cancelación de ruido y 30 horas de batería.', 'Audio', 129.0],
  ['Parlante portátil Eco', 'Parlante bluetooth resistente al agua.', 'Audio', 45.0],
  ['Monitor Vista 27"', 'Monitor de 27 pulgadas QHD a 75 Hz.', 'Computación', 219.0],
  ['Cámara de seguridad Argos', 'Cámara Wi-Fi 1080p con visión nocturna.', 'Hogar', 39.9],
];

const existe = db.prepare('SELECT 1 FROM productos WHERE nombre = ?');
const insertar = db.prepare(
  'INSERT INTO productos (nombre, descripcion, categoria, precio) VALUES (?, ?, ?, ?)'
);

let nuevos = 0;
for (const p of productos) {
  if (!existe.get(p[0])) {
    insertar.run(...p);
    nuevos++;
  }
}
console.log(`Seed completado: ${nuevos} producto(s) nuevo(s). Total en catálogo: ${db.prepare('SELECT COUNT(*) AS n FROM productos').get().n}`);
