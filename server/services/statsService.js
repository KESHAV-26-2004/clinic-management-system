// server/services/statsService.js
const db = require("../db");

function getDay(date) {
  return date || new Date().toISOString().slice(0, 10);
}

/**
 * Build DAILY stats ONCE per day
 */
function buildDailyStats(date) {
  const day = getDay(date);

  const exists = db
    .prepare(`SELECT date FROM clinic_daily_stats WHERE date = ?`)
    .get(day);

  if (exists) return; // already built

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

  const billed = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) AS total
    FROM visits
    WHERE DATE(created_at) = ?
  `).get(day).total;

  const paid = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM payments
    WHERE DATE(created_at) = ?
  `).get(day).total;

  db.prepare(`
    INSERT INTO clinic_daily_stats (
      date, patients, visits, new_cases, closed_cases,
      revenue_billed, revenue_paid
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    day,
    patients,
    visits,
    newCases,
    closedCases,
    billed,
    paid
  );
}
function ensureGlobalStatsUpToDate() {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .slice(0, 10);

  const global = db.prepare(`
    SELECT * FROM clinic_global_stats WHERE id = 1
  `).get();

  if (!global.last_rolled_date) {
    // first run: set baseline
    db.prepare(`
      UPDATE clinic_global_stats
      SET last_rolled_date = ?
      WHERE id = 1
    `).run(yesterday);
    return;
  }

  if (global.last_rolled_date >= yesterday) return;

  const days = db.prepare(`
    SELECT *
    FROM clinic_daily_stats
    WHERE date > ? AND date <= ?
    ORDER BY date ASC
  `).all(global.last_rolled_date, yesterday);

  if (!days.length) return;

  db.transaction(() => {
    days.forEach(d => {
      db.prepare(`
        UPDATE clinic_global_stats
        SET
          days = days + 1,
          patients = patients + ?,
          visits = visits + ?,
          new_cases = new_cases + ?,
          closed_cases = closed_cases + ?,
          revenue_billed = revenue_billed + ?,
          revenue_paid = revenue_paid + ?
      `).run(
        d.patients,
        d.visits,
        d.new_cases,
        d.closed_cases,
        d.revenue_billed,
        d.revenue_paid
      );
    });

    db.prepare(`
      UPDATE clinic_global_stats
      SET last_rolled_date = ?
      WHERE id = 1
    `).run(yesterday);
  })();
}

module.exports = {
  buildDailyStats,
  ensureGlobalStatsUpToDate,
};