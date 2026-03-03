-- server/db/migrations/014_clinic_settings.sql

CREATE TABLE IF NOT EXISTS clinic_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),

  name TEXT NOT NULL DEFAULT 'Dental Clinic',
  address TEXT,
  phone TEXT,

  logo_path TEXT,
  doctor_signature_path TEXT,

  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Ensure single row exists
INSERT INTO clinic_settings (id)
VALUES (1)
ON CONFLICT(id) DO NOTHING;
