-- server/db/migrations/010_prescriptions.sql
CREATE TABLE IF NOT EXISTS prescriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  visit_id INTEGER NOT NULL,

  medicine TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  instructions TEXT,

  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (visit_id) REFERENCES visits(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_visit
ON prescriptions(visit_id);
