--- server/db/migrations/013_visit_billings.sql
CREATE TABLE IF NOT EXISTS visit_billings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_id INTEGER NOT NULL,

  description TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),

  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (visit_id) REFERENCES visits(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_visit_billings_visit
ON visit_billings(visit_id);
