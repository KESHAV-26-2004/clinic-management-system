--- server/db/migrations/012_clinic_global_stats.sql
CREATE TABLE IF NOT EXISTS clinic_global_stats (
  id INTEGER PRIMARY KEY CHECK (id = 1),

  days INTEGER DEFAULT 0,

  patients INTEGER DEFAULT 0,
  visits INTEGER DEFAULT 0,
  new_cases INTEGER DEFAULT 0,
  closed_cases INTEGER DEFAULT 0,

  revenue_billed INTEGER DEFAULT 0,
  revenue_paid INTEGER DEFAULT 0,

  last_rolled_date TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- singleton row
INSERT OR IGNORE INTO clinic_global_stats (id) VALUES (1);
