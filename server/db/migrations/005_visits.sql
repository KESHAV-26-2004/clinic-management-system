--- server/db/migrations/005_visits.sql
CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  patient_id INTEGER NOT NULL,
  case_id INTEGER,

  complaint_encrypted TEXT,
  diagnosis_encrypted TEXT,
  notes_encrypted TEXT,

  -- Billing
  total_amount INTEGER NOT NULL DEFAULT 0,
  billing_status TEXT NOT NULL
    CHECK (billing_status IN ('OPEN', 'FINALIZED'))
    DEFAULT 'OPEN',

  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (case_id) REFERENCES cases(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_visits_patient
ON visits(patient_id);

CREATE INDEX IF NOT EXISTS idx_visits_case
ON visits(case_id);

CREATE INDEX IF NOT EXISTS idx_visits_billing_status
ON visits(billing_status);