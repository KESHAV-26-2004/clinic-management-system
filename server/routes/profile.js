// server/routes/profile.js
const express = require('express');
const auth = require('../auth/authMiddleware');
const db = require('../db');
const router = express.Router();

router.get(
  "/me",
  auth.requireAuth(['ADMIN','DOCTOR','STAFF']),
  (req, res) => {
    const user = db.prepare(`
      SELECT id, username, role,
            first_name, last_name, email, avatar_url,
            profile_completed, must_change_password
      FROM users
      WHERE id = ?
    `).get(req.user.userId);

    res.json(user);
  }
);

router.patch(
  "/me",
  auth.requireAuth(['ADMIN','DOCTOR','STAFF']),
  (req, res) => {
    const { first_name, last_name, email, avatar_url } = req.body;

    db.prepare(`
      UPDATE users
      SET first_name = COALESCE(?, first_name),
          last_name  = COALESCE(?, last_name),
          email      = COALESCE(?, email),
          avatar_url = COALESCE(?, avatar_url)
      WHERE id = ?
    `).run(
      first_name ?? null,
      last_name ?? null,
      email ?? null,
      avatar_url ?? null,
      req.user.userId
    );

    // 🔥 CHECK IF PROFILE COMPLETE
    const updatedUser = db.prepare(`
      SELECT first_name, last_name, email, avatar_url
      FROM users
      WHERE id = ?
    `).get(req.user.userId);

    const isComplete =
      updatedUser.first_name &&
      updatedUser.last_name &&
      updatedUser.email &&
      updatedUser.avatar_url;

    if (isComplete) {
      db.prepare(`
        UPDATE users
        SET profile_completed = 1
        WHERE id = ?
      `).run(req.user.userId);
    }

    res.json({ success: true });
  }
);

module.exports = router;