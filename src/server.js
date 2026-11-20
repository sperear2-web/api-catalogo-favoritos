const config = require('./config');
const app = require('./app');

app.listen(config.port, () => {
  console.log(`API escuchando en http://localhost:${config.port}/api`);
});
