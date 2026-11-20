require('dotenv').config({ quiet: true });

const config = {
  port: Number(process.env.PORT) || 3000,
  dbPath: process.env.DB_PATH || './data/catalogo.db',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
};

if (!config.jwtSecret) {
  // Sin secreto no se puede firmar ni verificar tokens: se detiene el arranque.
  throw new Error('Falta JWT_SECRET en las variables de entorno (copia .env.example a .env).');
}

module.exports = config;
