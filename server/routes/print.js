// server/routes/print.js
const express = require("express");
const router = express.Router();

const { requireAuth } = require("../auth/authMiddleware");
const printService = require("../services/printService");

router.get(
  "/visit/:visitId",
  requireAuth(["DOCTOR", "STAFF"]),
  async (req, res) => {
    try {
      const visitId = Number(req.params.visitId);
      if (!visitId) {
        return res.status(400).send("Invalid visit ID");
      }

      const html = await printService.generateVisitSummary(
        visitId,
        req.user
      );

      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch (err) {
      console.error("PRINT ERROR:", err);
      console.error("STACK:", err.stack);

      if (err.status) {
        return res.status(err.status).send(err.message);
      }

      res.status(500).send("Failed to generate visit summary");
    }
  }
);

module.exports = router;
