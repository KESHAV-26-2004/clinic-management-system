--- clinic-system/server/db/migrations/003_patients.sql
CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,

  phone_encrypted TEXT NOT NULL,
  phone_hash TEXT NOT NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,

  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_patients_phone_hash
ON patients(phone_hash);
