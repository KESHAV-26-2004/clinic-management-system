// server/crypto/keyManager.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const PATHS = require("../config/paths");

const KEY_PATH = path.join(PATHS.secure, "master.key");

function loadOrCreateKey() {
  if (fs.existsSync(KEY_PATH)) {
    return fs.readFileSync(KEY_PATH);
  }

  const key = crypto.randomBytes(32);
  fs.writeFileSync(KEY_PATH, key, { mode: 0o600 });
  return key;
}

module.exports = {
  getMasterKey: loadOrCreateKey,
};