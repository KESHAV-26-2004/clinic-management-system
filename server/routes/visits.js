// server/routes/visits.js
const express = require('express');
const router = express.Router();
const auth = require('../auth/authMiddleware');
const visitService = require('../services/visitService');

// Create visit (doctor/admin only)
router.post(
  '/',
  auth.requireAuth(['ADMIN', 'DOCTOR']),
  auth.blockRemoteWrite,
  (req, res) => {
    try {
      const visit = visitService.createVisit(req.body, req.user);
      res.status(201).json(visit);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Get patient history (case-aware)
router.get(
  '/patient/:id',
  auth.requireAuth(['ADMIN', 'DOCTOR', 'STAFF']),
  (req, res) => {
    try {
      const history = visitService.getPatientHistory(
        req.params.id,
        req.user
      );
      res.json(history);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

module.exports = router;
