// server/routes/clinicSettings.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { requireAuth } = require("../auth/authMiddleware");
const clinicService = require("../services/clinicSettingsService");

/* ===============================
   UPLOAD CONFIGURATION
================================ */
const PATHS = require("../config/paths");

const CLINIC_DIR = path.join(PATHS.uploads, "clinic");

if (!fs.existsSync(CLINIC_DIR)) {
  fs.mkdirSync(CLINIC_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, CLINIC_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const fileName =
      file.fieldname + "-" + Date.now() + ext;
    cb(null, fileName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: function (req, file, cb) {
    const allowed = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only PNG/JPG allowed"));
    }
    cb(null, true);
  },
});

/* ===============================
   PUBLIC SETTINGS (NO AUTH)
================================ */

router.get("/public", (req, res) => {
  const settings = clinicService.getClinicSettings();

  res.json({
    name: settings?.name || "",
    logo_path: settings?.logo_path || null,
  });
});

/* ===============================
   GET SETTINGS
================================ */

router.get(
  "/clinic-settings",
  requireAuth(["ADMIN"]),
  (req, res) => {
    const settings = clinicService.getClinicSettings();
    res.json(settings);
  }
);

/* ===============================
   UPDATE TEXT SETTINGS
================================ */

router.put(
  "/clinic-settings",
  requireAuth(["ADMIN"]),
  (req, res) => {
    const { name, address, phone } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "Clinic name required",
      });
    }

    const updated = clinicService.updateClinicSettings({
      name,
      address,
      phone,
    });

    res.json(updated);
  }
);

/* ===============================
   UPLOAD LOGO
================================ */

router.post(
  "/clinic-settings/logo",
  requireAuth(["ADMIN"]),
  upload.single("logo"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
      });
    }

    const relativePath = `clinic/${req.file.filename}`;

    clinicService.updateLogo(relativePath);

    res.json({
      success: true,
      path: relativePath,
    });
  }
);

/* ===============================
   UPLOAD SIGNATURE
================================ */

router.post(
  "/clinic-settings/signature",
  requireAuth(["ADMIN"]),
  upload.single("signature"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
      });
    }

    const relativePath = `clinic/${req.file.filename}`;

    clinicService.updateSignature(relativePath);

    res.json({
      success: true,
      path: relativePath,
    });
  }
);

module.exports = router;
