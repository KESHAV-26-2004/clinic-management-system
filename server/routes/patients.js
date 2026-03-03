// server/routes/patients.js
const express = require('express');
const router = express.Router();
const auth = require('../auth/authMiddleware');
const patientService = require('../services/patientService');

/* ================= CREATE PATIENT ================= */
router.post(
  '/',
  auth.requireAuth(['ADMIN', 'DOCTOR', 'STAFF']),
  auth.blockRemoteWrite,
  (req, res) => {
    try {
      const patient = patientService.createPatient(
        req.body,
        req.user
      );
      res.status(201).json(patient);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

/* ================= SEARCH PATIENTS (NAME / PHONE) ================= */
router.get(
  '/search',
  auth.requireAuth(['ADMIN', 'DOCTOR', 'STAFF']),
  (req, res) => {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json([]); // empty list, not error
    }

    try {
      const results = patientService.searchPatients(
        q.trim(),
        req.user
      );
      res.json(results);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

/* ================= RECENT PATIENTS ================= */
router.get(
  '/recent',
  auth.requireAuth(['ADMIN', 'DOCTOR', 'STAFF']),
  (req, res) => {
    try {
      const patients = patientService.getRecentPatients(req.user);
      res.json({ patients });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

/* ================= GET PATIENT BY ID ================= */
router.get(
  '/:id',
  auth.requireAuth(['ADMIN', 'DOCTOR', 'STAFF']),
  (req, res) => {
    try {
      const patient = patientService.getPatientById(
        req.params.id,
        req.user
      );
      res.json(patient);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }
);

module.exports = router;