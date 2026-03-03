-- Prevent same patient being added multiple times in same day
-- Only one ACTIVE entry allowed (WAITING, CALLED, IN_PROGRESS)

CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_unique_active_patient
ON queue(patient_id, DATE(created_at))
WHERE status IN ('WAITING', 'CALLED', 'IN_PROGRESS');
