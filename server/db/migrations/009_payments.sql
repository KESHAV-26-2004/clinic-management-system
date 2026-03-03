--- server/db/migrations/009_payments.sql
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_id INTEGER NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  mode TEXT NOT NULL CHECK (mode IN ('CASH', 'UPI', 'CARD')),
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (visit_id) REFERENCES visits(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_payments_visit
ON payments(visit_id);

CREATE INDEX IF NOT EXISTS idx_payments_created_at
ON payments(created_at);
