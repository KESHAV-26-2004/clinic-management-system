// server/routes/payments.js
const express = require('express');
const router = express.Router();
const auth = require('../auth/authMiddleware');
const paymentService = require('../services/paymentService');

// Add payment
router.post(
  '/',
  auth.requireAuth(['ADMIN', 'DOCTOR', 'STAFF']),
  auth.blockRemoteWrite,
  (req, res) => {
    try {
      const { visitId, amount, mode } = req.body;
      const result = paymentService.addPayment(
        visitId,
        amount,
        mode,
        req.user
      );
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Settle global payment (patient-level)
router.post(
  '/global',
  auth.requireAuth(['ADMIN', 'DOCTOR', 'STAFF']),
  auth.blockRemoteWrite,
  (req, res) => {
    try {
      const { patientId, amount, mode } = req.body;

      const result = paymentService.settleGlobalPayment(
        patientId,
        amount,
        mode,
        req.user
      );

      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.get(
  '/patient/:id/summary',
  auth.requireAuth(['ADMIN', 'DOCTOR', 'STAFF']),
  (req, res) => {
    const data = paymentService.getPatientPaymentSummary(req.params.id);
    res.json(data);
  }
);

// Get payments for visit
router.get(
  '/visit/:id',
  auth.requireAuth(['ADMIN', 'DOCTOR', 'STAFF']),
  (req, res) => {
    const payments = paymentService.getPaymentsByVisit(req.params.id);
    const summary = paymentService.getVisitPaymentSummary(req.params.id);
    res.json({ payments, summary });
  }
);

// Pending payments
router.get(
  '/pending',
  auth.requireAuth(['ADMIN', 'DOCTOR', 'STAFF']),
  (req, res) => {
    const data = paymentService.getPendingPayments();
    res.json(data);
  }
);

// Today collection
router.get(
  '/today',
  auth.requireAuth(['ADMIN', 'DOCTOR', 'STAFF']),
  (req, res) => {
    const data = paymentService.getTodayCollection();
    res.json(data);
  }
);

module.exports = router;
