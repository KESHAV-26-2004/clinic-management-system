// server/routes/backup.js
const express = require("express");
const router = express.Router();
const { runBackup } = require("../services/backupService");
const { requireAuth } = require("../auth/authMiddleware");
const db = require("../db");

/**
 * ADMIN: TRIGGER BACKUP
 */
router.post(
  "/backup",
  requireAuth(["ADMIN"]),
  (req, res) => {
    try {
      const location = runBackup();

      // 🔐 Audit log
      db.prepare(`
        INSERT INTO audit_log (user_id, action, entity)
        VALUES (?, ?, ?)
      `).run(req.user.userId, "BACKUP_CREATED", "SYSTEM");

      res.json({
        success: true,
        message: "Backup completed successfully",
        location,
      });
    } catch (err) {
      res.status(500).json({
        error: "Backup failed",
        details: err.message,
      });
    }
  }
);

module.exports = router;
