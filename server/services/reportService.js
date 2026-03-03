// server/services/reportService.js
const db = require("../db");

// helper: default date = today
function normalizeDate(date) {
  return date || new Date().toISOString().slice(0, 10);
}

// 1️⃣ DAILY OVERVIEW
function getDailyOverview(date) {
  const day = normalizeDate(date);

  const patients = db.prepare(`
    SELECT COUNT(DISTINCT patient_id) AS count
    FROM queue
    WHERE DATE(created_at) = ?
  `).get(day).count;

  const visits = db.prepare(`
    SELECT COUNT(*) AS count
    FROM visits
    WHERE DATE(created_at) = ?
  `).get(day).count;

  const newCases = db.prepare(`
    SELECT COUNT(*) AS count
    FROM cases
    WHERE DATE(started_at) = ?
  `).get(day).count;

  const closedCases = db.prepare(`
    SELECT COUNT(*) AS count
    FROM cases
    WHERE status = 'CLOSED'
      AND DATE(closed_at) = ?
  `).get(day).count;

  const paid = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM payments
    WHERE DATE(created_at) = ?
  `).get(day).total;

  const billed = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) AS total
    FROM visits
    WHERE DATE(created_at) = ?
  `).get(day).total;

  return {
    date: day,
    patients,
    visits,
    newCases,
    closedCases,
    revenue: {
      paid,
      pending: Math.max(0, billed - paid),
    },
  };
}

// 2️⃣ REVENUE REPORT
function getRevenueReport(from, to) {
  if (!from || !to) {
    throw new Error("from and to dates required");
  }

  const billed = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) AS total
    FROM visits
    WHERE DATE(created_at) BETWEEN ? AND ?
  `).get(from, to).total;

  const paid = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM payments
    WHERE DATE(created_at) BETWEEN ? AND ?
  `).get(from, to).total;

  const modes = db.prepare(`
    SELECT mode, SUM(amount) AS total
    FROM payments
    WHERE DATE(created_at) BETWEEN ? AND ?
    GROUP BY mode
  `).all(from, to);

  const byMode = {};
  modes.forEach(m => {
    byMode[m.mode] = m.total;
  });

  return {
    totalBilled: billed,
    paid,
    pending: Math.max(0, billed - paid),
    byMode,
  };
}

// 3️⃣ DOCTOR WORKLOAD
function getDoctorWorkload(from, to) {
  if (!from || !to) {
    throw new Error("from and to dates required");
  }

  return db.prepare(`
    SELECT
      u.username AS doctor,
      COUNT(v.id) AS visits,
      SUM(CASE WHEN c.started_at BETWEEN ? AND ? THEN 1 ELSE 0 END) AS casesOpened,
      SUM(CASE WHEN c.closed_at BETWEEN ? AND ? THEN 1 ELSE 0 END) AS casesClosed
    FROM users u
    LEFT JOIN visits v ON v.created_by = u.id
      AND DATE(v.created_at) BETWEEN ? AND ?
    LEFT JOIN cases c ON c.created_by = u.id
    WHERE u.role = 'DOCTOR'
    GROUP BY u.id
  `).all(from, to, from, to, from, to);
}

// 4️⃣ CASE STATS
function getCaseStats() {
  const open = db.prepare(`
    SELECT COUNT(*) AS count FROM cases WHERE status = 'OPEN'
  `).get().count;

  const closed = db.prepare(`
    SELECT COUNT(*) AS count FROM cases WHERE status = 'CLOSED'
  `).get().count;

  const avgVisits = db.prepare(`
    SELECT AVG(cnt) AS avg
    FROM (
      SELECT COUNT(*) AS cnt
      FROM visits
      WHERE case_id IS NOT NULL
      GROUP BY case_id
    )
  `).get().avg || 0;

  return {
    open,
    closed,
    avgVisitsPerCase: Number(avgVisits.toFixed(2)),
  };
}

// optional later
function getDailyOverviewFromStats(date) {
  return db.prepare(`
    SELECT *
    FROM clinic_daily_stats
    WHERE date = ?
  `).get(date);
}

// 5️⃣ DAILY AVERAGE (ALL TIME)
function getDailyAverage() {
  return db.prepare(`
    SELECT
      ROUND(AVG(patients), 1) AS patients,
      ROUND(AVG(visits), 1) AS visits,
      ROUND(AVG(new_cases), 1) AS newCases,
      ROUND(AVG(revenue_paid), 1) AS revenuePaid
    FROM clinic_daily_stats
  `).get();
}

// 6️⃣ GLOBAL TOTALS
function getGlobalStats() {
  return db.prepare(`
    SELECT *
    FROM clinic_global_stats
    WHERE id = 1
  `).get();
}

module.exports = {
  getDailyOverview,
  getRevenueReport,
  getDoctorWorkload,
  getCaseStats,
  getDailyOverviewFromStats,
  getDailyAverage,
  getGlobalStats, 
};
