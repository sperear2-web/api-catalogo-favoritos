// Validaciones del lado del servidor (no se confía en lo que envía el cliente).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const esTextoNoVacio = (v, max = 500) =>
  typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;

const esCorreoValido = (v) => typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v.trim());

// Precio: número finito mayor que cero (no se aceptan cadenas como "10").
const esPrecioValido = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

// Identificador: entero positivo. Acepta "5" (de la URL) pero rechaza "5abc", "-1", "1.5".
const parseId = (v) => {
  const s = String(v);
  if (!/^[1-9]\d{0,14}$/.test(s)) return null;
  return Number(s);
};

module.exports = { esTextoNoVacio, esCorreoValido, esPrecioValido, parseId };
