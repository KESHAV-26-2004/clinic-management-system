// server/routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const { requireAuth } = require('../auth/authMiddleware');

const SALT_ROUNDS = 12;

/**
 * LIST USERS (ADMIN)
 */
router.get('/', requireAuth(['ADMIN']), (req, res) => {
  const users = db.prepare(`
    SELECT id, username, role, is_active, must_change_password, created_at
    FROM users
    ORDER BY id ASC
  `).all();

  res.json(users);
});

/**
 * CREATE USER (ADMIN)
 * ONLY DOCTOR / STAFF
 */
router.post('/', requireAuth(['ADMIN']), async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  if (!['DOCTOR', 'STAFF'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const exists = db
    .prepare('SELECT id FROM users WHERE username = ?')
    .get(username);

  if (exists) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  db.prepare(`
    INSERT INTO users (
    username,
    password_hash,
    role,
    is_active,
    must_change_password,
    profile_completed,
    created_at,
    password_changed_at
  )
  VALUES (?, ?, ?, 1, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(username, password_hash, role);

  res.json({ message: 'User created' });
});

/**
 * DISABLE USER (ADMIN)
 */
router.patch('/:id/disable', requireAuth(['ADMIN']), (req, res) => {
  const targetUserId = Number(req.params.id);
  const adminId = req.user.userId;

  if (targetUserId === adminId) {
    return res
      .status(400)
      .json({ error: 'Admin cannot disable itself' });
  }

  db.prepare(`
    UPDATE users SET is_active = 0 WHERE id = ?
  `).run(targetUserId);

  res.json({ message: 'User disabled' });
});

/**
 * ENABLE USER (ADMIN)
 */
router.patch('/:id/enable', requireAuth(['ADMIN']), (req, res) => {
  const targetUserId = Number(req.params.id);
  const adminId = req.user.userId;

  if (targetUserId === adminId) {
    return res
      .status(400)
      .json({ error: 'Admin cannot modify itself' });
  }

  db.prepare(`
    UPDATE users SET is_active = 1 WHERE id = ?
  `).run(targetUserId);

  res.json({ message: 'User enabled' });
});

/**
 * RESET PASSWORD (ADMIN)
 * Forces logout everywhere
 */
router.post('/:id/reset-password', requireAuth(['ADMIN']), async (req, res) => {
  const targetUserId = Number(req.params.id);
  const adminId = req.user.userId;

  if (targetUserId === adminId) {
    return res.status(400).json({
      error: 'Admin cannot reset its own password here'
    });
  }

  const target = db
    .prepare('SELECT role FROM users WHERE id = ?')
    .get(targetUserId);

  if (!target) {
    return res.status(404).json({ error: 'User not found' });
  }

  const tempPassword = Math.random().toString(36).slice(-8);
  const password_hash = await bcrypt.hash(tempPassword, SALT_ROUNDS);

  db.prepare(`
    UPDATE users
    SET password_hash = ?,
        must_change_password = 1,
        password_changed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(password_hash, targetUserId);

  res.json({
    message: 'Password reset',
    tempPassword,
  });
});


/**
 * DELETE USER (ADMIN)
 */
router.delete('/:id', requireAuth(['ADMIN']), (req, res) => {
  const targetUserId = Number(req.params.id);
  const adminId = req.user.userId;

  if (targetUserId === adminId) {
    return res.status(400).json({ error: 'Admin cannot delete itself' });
  }

  const target = db
    .prepare('SELECT role FROM users WHERE id = ?')
    .get(targetUserId);

  if (!target) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (target.role === 'ADMIN') {
    return res.status(400).json({ error: 'Cannot delete ADMIN user' });
  }

  try {
    const result = db
      .prepare(`DELETE FROM users WHERE id = ?`)
      .run(targetUserId);

    if (result.changes === 0) {
      return res.status(400).json({ error: 'User could not be deleted' });
    }

    res.json({ message: 'User deleted' });

  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return res.status(400).json({
        error: 'Cannot delete user because related records exist'
      });
    }

    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
