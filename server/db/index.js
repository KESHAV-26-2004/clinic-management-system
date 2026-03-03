// server/db/index.js
const Database = require("better-sqlite3");
const path = require("path");
const PATHS = require("../config/paths");

const DB_PATH = path.join(PATHS.db, "clinic.db");

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

module.exports = db;