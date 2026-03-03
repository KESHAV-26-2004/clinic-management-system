// server/services/backupService.js
const fs = require("fs");
const path = require("path");
const PATHS = require("../config/paths");

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function cleanupOldBackups(maxBackups = 14) {
  const backupsDir = PATHS.backups;

  if (!fs.existsSync(backupsDir)) return;

  const folders = fs.readdirSync(backupsDir)
    .filter(name =>
      fs.statSync(path.join(backupsDir, name)).isDirectory()
    )
    .sort((a, b) => a.localeCompare(b)); // oldest first

  if (folders.length <= maxBackups) return;

  const numberToDelete = folders.length - maxBackups;
  const toDelete = folders.slice(0, numberToDelete); // delete oldest

  for (const folder of toDelete) {
    const fullPath = path.join(backupsDir, folder);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
}

function runBackup() {
  const dest = path.join(PATHS.backups, timestamp());
  fs.mkdirSync(dest, { recursive: true });

  fs.copyFileSync(
    path.join(PATHS.db, "clinic.db"),
    path.join(dest, "clinic.db")
  );

  ["clinic.db-wal", "clinic.db-shm"].forEach(file => {
    const src = path.join(PATHS.db, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(dest, file));
    }
  });

  fs.copyFileSync(
    path.join(PATHS.secure, "master.key"),
    path.join(dest, "master.key")
  );

  cleanupOldBackups(14);

  return dest;
}

module.exports = { runBackup };