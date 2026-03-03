// server/services/setupService.js
const db = require("../db");

function usersTableExists() {
  const row = db
    .prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type='table' AND name='users'
    `)
    .get();

  return !!row;
}

function isSetupRequired() {
  // Fresh DB / migrations not ready yet
  if (!usersTableExists()) {
    return true;
  }

  const row = db
    .prepare("SELECT COUNT(*) as count FROM users")
    .get();

  return row.count === 0;
}

module.exports = { isSetupRequired };