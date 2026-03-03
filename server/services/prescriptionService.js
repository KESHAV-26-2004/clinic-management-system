// server/services/prescriptionService.js
const db = require('../db');

function addPrescription(data, user) {
  if (user.accessMode === 'REMOTE') {
    throw new Error('Remote doctor cannot add prescriptions');
  }

  if (!['DOCTOR', 'ADMIN'].includes(user.role)) {
    throw new Error('Only doctors can add prescriptions');
  }

  const {
    visitId,
    medicine,
    dosage,
    frequency,
    duration,
    instructions
  } = data;

  // 🔥 validation AFTER destructuring
  if (!visitId || !medicine || !dosage || !frequency) {
    throw new Error(
      'visitId, medicine, dosage and frequency are required'
    );
  }

  // ensure visit exists
  const visit = db.prepare(`
    SELECT id FROM visits WHERE id = ?
  `).get(visitId);

  if (!visit) {
    throw new Error('Invalid visit');
  }

  const stmt = db.prepare(`
    INSERT INTO prescriptions (
      visit_id,
      medicine,
      dosage,
      frequency,
      duration,
      instructions,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    visitId,
    medicine,
    dosage,
    frequency,
    duration || null,
    instructions || null,
    user.userId
  );

  return { id: result.lastInsertRowid };
}

function getPrescriptionsByVisit(visitId) {
  return db.prepare(`
    SELECT
      id,
      medicine,
      dosage,
      frequency,
      duration,
      instructions,
      created_at,
      created_by
    FROM prescriptions
    WHERE visit_id = ?
    ORDER BY id ASC
  `).all(visitId);
}

module.exports = {
  addPrescription,
  getPrescriptionsByVisit,
};
