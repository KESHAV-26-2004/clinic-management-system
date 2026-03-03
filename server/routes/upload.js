// server/routes/upload.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const auth = require("../auth/authMiddleware");
const db = require("../db");
const PATHS = require("../config/paths");
const fs = require("fs");

const router = express.Router();

// Ensure avatars subfolder exists
const AVATAR_DIR = path.join(PATHS.uploads, "avatars");
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AVATAR_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.user.userId}_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

router.post(
  "/avatar",
  auth.requireAuth(["ADMIN", "DOCTOR", "STAFF"]),
  upload.single("avatar"),
  (req, res) => {
    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    db.prepare(`
      UPDATE users
      SET avatar_url = ?
      WHERE id = ?
    `).run(avatarPath, req.user.userId);

    res.json({ avatar_url: avatarPath });
  }
);

module.exports = router;