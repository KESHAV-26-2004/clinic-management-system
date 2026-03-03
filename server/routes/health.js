// server/routes/health.js
const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    serverTime: new Date().toISOString(),
  });
});

module.exports = router;
