--- server/db/migrations/011_daily_stats.sql
CREATE TABLE IF NOT EXISTS clinic_daily_stats (
  date TEXT PRIMARY KEY,          -- YYYY-MM-DD

  patients INTEGER DEFAULT 0,
  visits INTEGER DEFAULT 0,
  new_cases INTEGER DEFAULT 0,
  closed_cases INTEGER DEFAULT 0,

  revenue_billed INTEGER DEFAULT 0,
  revenue_paid INTEGER DEFAULT 0,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
