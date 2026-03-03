//server/utils/logger.js
const fs = require("fs");
const path = require("path");
const PATHS = require("../config/paths");

const logDir = path.join(PATHS.base, "logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function write(file, level, message) {
  const line = `[${new Date().toISOString()}] [${level}] ${message}\n`;
  fs.appendFileSync(path.join(logDir, file), line);
  console.log(line.trim());
}

module.exports = {
  info: (msg) => write("server.log", "INFO", msg),
  warn: (msg) => write("server.log", "WARN", msg),
  error: (msg) => write("error.log", "ERROR", msg),
};