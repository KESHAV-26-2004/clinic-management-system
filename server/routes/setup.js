// server/routes/setup.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const { isSetupRequired } = require("../services/setupService");
const { isStrongPassword } = require("../utils/passwordValidator");

const SALT_ROUNDS = 12;

/**
 * Check setup status
 */
router.get("/status", (req, res) => {
  res.json({ setupRequired: isSetupRequired() });
});

/**
 * Create first ADMIN
 */
router.post("/", async (req, res) => {
  if (!isSetupRequired()) {
    return res.status(403).json({ error: "Setup already completed" });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      error:
        "Password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 special character",
    });
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  db.prepare(`
    INSERT INTO users (
      username,
      password_hash,
      role,
      is_active,
      must_change_password,
      created_at,
      password_changed_at
    )
    VALUES (?, ?, 'ADMIN', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(username, password_hash);

  res.json({ message: "Admin created successfully" });
});

module.exports = router;