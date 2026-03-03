// server/services/caseService.js
const db = require('../db');

function getPatientCases(patientId) {
  const openCase = db.prepare(`
    SELECT *
    FROM cases
    WHERE patient_id = ? AND status = 'OPEN'
    ORDER BY started_at DESC
    LIMIT 1
  `).get(patientId);

  const closedCases = db.prepare(`
    SELECT id, title, started_at, closed_at
    FROM cases
    WHERE patient_id = ? AND status = 'CLOSED'
    ORDER BY closed_at DESC
  `).all(patientId);

  return {
    openCase: openCase || null,
    closedCases,
  };
}

function createCase({ patientId, title }, user) {
  if (user.accessMode === 'REMOTE') {
    throw new Error('Remote doctor cannot create cases');
  }

  if (!['DOCTOR', 'ADMIN'].includes(user.role)) {
    throw new Error('Only doctors can create cases');
  }

  const existing = db.prepare(`
    SELECT id FROM cases
    WHERE patient_id = ? AND status = 'OPEN'
  `).get(patientId);

  if (existing) {
    throw new Error('An open case already exists for this patient');
  }

  const result = db.prepare(`
    INSERT INTO cases (patient_id, title, created_by)
    VALUES (?, ?, ?)
  `).run(patientId, title, user.userId);

  return { id: result.lastInsertRowid };
}

function closeCase(caseId, user) {
  if (user.accessMode === 'REMOTE') {
    throw new Error('Remote doctor cannot close cases');
  }

  if (!['DOCTOR', 'ADMIN'].includes(user.role)) {
    throw new Error('Only doctors can close cases');
  }

  const info = db.prepare(`
    UPDATE cases
    SET status = 'CLOSED', closed_at = CURRENT_TIMESTAMP
    WHERE id = ? AND status = 'OPEN'
  `).run(caseId);

  if (info.changes === 0) {
    throw new Error('Case not found or already closed');
  }

  return { success: true };
}

module.exports = {
  getPatientCases,
  createCase,
  closeCase,
};
