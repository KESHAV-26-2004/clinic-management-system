--- server/db/migrations/004_cases.sql
CREATE TABLE IF NOT EXISTS cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  patient_id INTEGER NOT NULL,
  title TEXT NOT NULL,

  status TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED')) DEFAULT 'OPEN',

  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME,

  created_by INTEGER NOT NULL,

  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_cases_patient
ON cases(patient_id);

CREATE INDEX IF NOT EXISTS idx_cases_status
ON cases(status);
