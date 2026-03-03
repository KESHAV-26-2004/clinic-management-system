// server/routes/reports.js
const express = require("express");
const router = express.Router();

const { requireAuth } = require("../auth/authMiddleware");
const reportService = require("../services/reportService");
const statsService = require("../services/statsService");

// DAILY OVERVIEW
router.get(
  "/daily",
  requireAuth(["DOCTOR", "STAFF"]),
  (req, res) => {
    try {
      // 🔥 THESE TWO LINES ARE MANDATORY
      statsService.buildDailyStats();          // builds yesterday if missing
      statsService.ensureGlobalStatsUpToDate(); // rolls into global

      const date = req.query.date;
      const data = reportService.getDailyOverview(date);
      res.json(data);
    } catch (err) {
      console.error("REPORT DAILY ERROR:", err);
      res.status(500).json({ error: "Failed to fetch daily report" });
    }
  }
);

// REVENUE REPORT
router.get(
  "/revenue",
  requireAuth(["DOCTOR", "STAFF"]),
  (req, res) => {
    try {
      const { from, to } = req.query;
      const data = reportService.getRevenueReport(from, to);
      res.json(data);
    } catch (err) {
      console.error("REPORT REVENUE ERROR:", err);
      res.status(500).json({ error: "Failed to fetch revenue report" });
    }
  }
);

// DOCTOR WORKLOAD
router.get(
  "/doctor-workload",
  requireAuth(["DOCTOR", "STAFF"]),
  (req, res) => {
    try {
      const { from, to } = req.query;
      const data = reportService.getDoctorWorkload(from, to);
      res.json(data);
    } catch (err) {
      console.error("REPORT WORKLOAD ERROR:", err);
      res.status(500).json({ error: "Failed to fetch doctor workload" });
    }
  }
);

// CASE STATS
router.get(
  "/cases",
  requireAuth(["DOCTOR", "STAFF"]),
  (req, res) => {
    try {
      const data = reportService.getCaseStats();
      res.json(data);
    } catch (err) {
      console.error("REPORT CASE ERROR:", err);
      res.status(500).json({ error: "Failed to fetch case stats" });
    }
  }
);

// AVERAGE DAILY STATS
router.get(
  "/average",
  requireAuth(["DOCTOR", "STAFF"]),
  (req, res) => {
    try {
      const data = reportService.getDailyAverage();
      res.json(data);
    } catch (err) {
      console.error("REPORT AVERAGE ERROR:", err);
      res.status(500).json({ error: "Failed to fetch average stats" });
    }
  }
);

// GLOBAL TOTALS
router.get(
  "/global",
  requireAuth(["DOCTOR", "STAFF"]),
  (req, res) => {
    try {
      const data = reportService.getGlobalStats();
      res.json(data);
    } catch (err) {
      console.error("REPORT GLOBAL ERROR:", err);
      res.status(500).json({ error: "Failed to fetch global stats" });
    }
  }
);

module.exports = router;
