--- server/db/migrations/006_queue.sql
CREATE TABLE IF NOT EXISTS queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('WAITING', 'CALLED', 'IN_PROGRESS', 'DONE', 'CANCELLED')
  ),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER NOT NULL,

  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_queue_status
ON queue(status);

CREATE INDEX IF NOT EXISTS idx_queue_patient
ON queue(patient_id);
