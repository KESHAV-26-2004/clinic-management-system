// server/config/env.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Production secure location
const DATA_DIR =
  process.env.DATA_DIR ||
  path.join(process.env.ProgramData || "C:\\ProgramData", "ClinicSystem");

const SECURE_DIR = path.join(DATA_DIR, "secure");
const ENV_PATH = path.join(SECURE_DIR, ".env");

// Ensure secure directory exists
if (!fs.existsSync(SECURE_DIR)) {
  fs.mkdirSync(SECURE_DIR, { recursive: true });
}

// If .env does not exist → create one with random JWT
if (!fs.existsSync(ENV_PATH)) {
  const jwtSecret = crypto.randomBytes(64).toString("hex");

  const defaultEnv = `
PORT=8443
NODE_ENV=production
DATA_DIR=${DATA_DIR}
JWT_SECRET=${jwtSecret}
`.trim();

  fs.writeFileSync(ENV_PATH, defaultEnv, { mode: 0o600 });
}

// Load environment from secure folder
require("dotenv").config({ path: ENV_PATH });

module.exports = {
  PORT: process.env.PORT || 8443,
  NODE_ENV: process.env.NODE_ENV || "production",
  JWT_SECRET: process.env.JWT_SECRET,
  DATA_DIR,
};