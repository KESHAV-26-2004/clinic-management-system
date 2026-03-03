// server/routes/cases.js
const express = require('express');
const router = express.Router();
const auth = require('../auth/authMiddleware');
const caseService = require('../services/caseService');

// Get patient cases
router.get(
  '/patient/:patientId',
  auth.requireAuth(['ADMIN', 'DOCTOR', 'STAFF']),
  (req, res) => {
    try {
      const data = caseService.getPatientCases(req.params.patientId);
      res.json(data);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Create new case
router.post(
  '/',
  auth.requireAuth(['ADMIN', 'DOCTOR']),
  auth.blockRemoteWrite,
  (req, res) => {
    try {
      const { patientId, title } = req.body;
      const result = caseService.createCase({ patientId, title }, req.user);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Close case
router.patch(
  '/:caseId/close',
  auth.requireAuth(['ADMIN', 'DOCTOR']),
  auth.blockRemoteWrite,
  (req, res) => {
    try {
      const result = caseService.closeCase(req.params.caseId, req.user);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

module.exports = router;
