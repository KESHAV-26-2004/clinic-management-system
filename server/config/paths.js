const fs = require("fs");
const path = require("path");
const { DATA_DIR } = require("./env");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const PATHS = {
  base: DATA_DIR,
  db: path.join(DATA_DIR, "db"),
  uploads: path.join(DATA_DIR, "uploads"),
  backups: path.join(DATA_DIR, "backups"),
  secure: path.join(DATA_DIR, "secure"),
};

// Ensure all folders exist
Object.values(PATHS).forEach(ensureDir);

module.exports = PATHS;