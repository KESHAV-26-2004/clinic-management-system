// server/db/migrate.js
const fs = require('fs');
const path = require('path');
const db = require('./index');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

db.exec(`
  CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    run_at TEXT
  );
`);

const applied = db
  .prepare('SELECT name FROM _migrations')
  .all()
  .map(m => m.name);

const files = fs
  .readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort();

for (const file of files) {
  if (applied.includes(file)) continue;

  const sql = fs.readFileSync(
    path.join(MIGRATIONS_DIR, file),
    'utf8'
  );

  db.transaction(() => {
    db.exec(sql);
    db.prepare(
      'INSERT INTO _migrations (name, run_at) VALUES (?, ?)'
    ).run(file, new Date().toISOString());
  })();

  console.log(`[DB] Migration applied: ${file}`);
}

console.log('[DB] All migrations complete');
