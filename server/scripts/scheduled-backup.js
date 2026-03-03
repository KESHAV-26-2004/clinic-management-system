const { runBackup } = require("../services/backupService");
const fs = require("fs");
const path = require("path");

const BASE = "C:\\ProgramData\\ClinicSystem";
const LOG_FILE = path.join(BASE, "logs", "backup.log");

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);
}

try {
  const location = runBackup();
  log("SYSTEM_AUTO_BACKUP SUCCESS: " + location);
  console.log("Auto backup completed:", location);
} catch (err) {
  log("SYSTEM_AUTO_BACKUP FAILED: " + err.message);
  console.error("Auto backup FAILED:", err.message);
  process.exit(1);
}