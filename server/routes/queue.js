// server/routes/queue.js
const express = require('express');
const router = express.Router();
const auth = require('../auth/authMiddleware');
const queueService = require('../services/queueService');

// Add patient to queue
router.post(
  '/',
  auth.requireAuth(['ADMIN', 'DOCTOR', 'STAFF']),
  auth.blockRemoteWrite,
  (req, res) => {
    try {
      const { patientId } = req.body;
      const result = queueService.addToQueue(patientId, req.user);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Get today’s queue
router.get(
  '/',
  auth.requireAuth(['ADMIN', 'DOCTOR', 'STAFF']),
  (req, res) => {
    const queue = queueService.getTodayQueue();
    res.json(queue);
  }
);

// Update queue status
router.patch(
  '/:id/status',
  auth.requireAuth(['ADMIN', 'DOCTOR', 'STAFF']),
  auth.blockRemoteWrite,
  (req, res) => {
    try {
      const { status } = req.body;
      const result = queueService.updateStatus(
        req.params.id,
        status,
        req.user
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

module.exports = router;
