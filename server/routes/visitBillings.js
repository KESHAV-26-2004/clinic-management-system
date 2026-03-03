// server/routes/visitBillings.js
const express = require('express');
const router = express.Router();
const auth = require('../auth/authMiddleware');
const billingService = require('../services/visitBillingService');

// Add billing line
router.post(
  '/visit/:id',
  auth.requireAuth(['ADMIN', 'DOCTOR']),
  auth.blockRemoteWrite,
  (req, res) => {
    try {
      const { description, amount } = req.body;
      const result = billingService.addBillingItem(
        req.params.id,
        description,
        amount,
        req.user
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Remove billing line
router.delete(
  '/:id',
  auth.requireAuth(['ADMIN', 'DOCTOR']),
  auth.blockRemoteWrite,
  (req, res) => {
    try {
      const result = billingService.removeBillingItem(
        req.params.id,
        req.user
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Get billing for visit
router.get(
  '/visit/:id',
  auth.requireAuth(['ADMIN', 'DOCTOR', 'STAFF']),
  (req, res) => {
    const data = billingService.getBillingByVisit(req.params.id);
    res.json(data);
  }
);

// Finalize billing
router.post(
  '/visit/:id/finalize',
  auth.requireAuth(['ADMIN', 'DOCTOR']),
  auth.blockRemoteWrite,
  (req, res) => {
    try {
      const result = billingService.finalizeBilling(
        req.params.id,
        req.user
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

module.exports = router;
