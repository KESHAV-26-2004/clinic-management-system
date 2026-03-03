// server/routes/prescriptions.js
const express = require('express');
const router = express.Router();
const auth = require('../auth/authMiddleware');
const prescriptionService = require('../services/prescriptionService');

// Add prescription item
router.post(
  '/',
  auth.requireAuth(['ADMIN', 'DOCTOR']),
  auth.blockRemoteWrite,
  (req, res) => {
    try {
      const result = prescriptionService.addPrescription(
        req.body,
        req.user
      );
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Get prescriptions for visit
router.get(
  '/visit/:visitId',
  auth.requireAuth(['ADMIN', 'DOCTOR', 'STAFF']),
  (req, res) => {
    try {
      const list = prescriptionService.getPrescriptionsByVisit(
        req.params.visitId
      );
      res.json(list);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

module.exports = router;
