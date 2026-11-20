const fs = require('fs');
const path = require('path');
// SQLite incluido en Node.js (>= 22.13): no requiere compilar dependencias nativas.
const { DatabaseSync } = require('node:sqlite');
const config = require('../config');

const enMemoria = config.dbPath === ':memory:';
const dbFile = enMemoria ? ':memory:' : path.resolve(config.dbPath);
if (!enMemoria) fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const db = new DatabaseSync(dbFile);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;'); // necesario en SQLite para respetar las claves foráneas

db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

module.exports = db;
