// server/routes/auth.js
const express = require('express');
const router = express.Router();

const { login, hashPassword } = require('../auth/authService');
const { isStrongPassword } = require("../utils/passwordValidator");
const { requireAuth } = require('../auth/authMiddleware');
const db = require('../db');
const bcrypt = require('bcrypt');

/**
 * LOGIN
 */
router.post('/login', async (req, res) => {
  const { username, password, accessMode } = req.body;

  if (!username || !password || !accessMode) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  if (!['LOCAL', 'REMOTE'].includes(accessMode)) {
    return res.status(400).json({ error: 'Invalid accessMode' });
  }

  try {
    const result = await login({ username, password, accessMode });
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

/**
 * FORCE PASSWORD CHANGE (AFTER RESET)
 */
router.post('/change-password', requireAuth(), async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: 'Missing new password' });
  }

  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({
      error:
        "Password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 special character",
    });
  }

  const user = db.prepare(
    'SELECT password_hash, must_change_password FROM users WHERE id = ?'
  ).get(req.user.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // 🔐 If forced change, skip current password check
  if (!user.must_change_password) {
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password required' });
    }

    const valid = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!valid) {
      return res.status(400).json({
        error: 'Current password incorrect'
      });
    }
  }

  const hash = await bcrypt.hash(newPassword, 12);

  db.prepare(`
    UPDATE users
    SET password_hash = ?,
        must_change_password = 0,
        password_changed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(hash, req.user.userId);

  res.json({ message: 'Password updated' });
});

module.exports = router;
