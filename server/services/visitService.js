// server/services/visitService.js
const db = require('../db');
const cryptoService = require('../crypto/cryptoService');
const paymentService = require('./paymentService');

/**
 * Create a visit (linked to a case)
 */
function createVisit(
  { patientId, caseId, complaint, diagnosis, notes, totalAmount },
  user
) {
  if (user.accessMode === 'REMOTE') {
    throw new Error('Remote doctor cannot create visits');
  }

  if (!['DOCTOR', 'ADMIN'].includes(user.role)) {
    throw new Error('Only doctors can create visits');
  }

  if (typeof totalAmount !== 'number' || totalAmount < 0) {
    throw new Error('Invalid total amount');
  }

  // If caseId is provided, ensure it is OPEN
  if (caseId) {
    const openCase = db.prepare(`
      SELECT id
      FROM cases
      WHERE id = ? AND status = 'OPEN'
    `).get(caseId);

    if (!openCase) {
      throw new Error('Invalid or closed case');
    }
  }

  const result = db.prepare(`
    INSERT INTO visits (
      patient_id,
      case_id,
      complaint_encrypted,
      diagnosis_encrypted,
      notes_encrypted,
      total_amount,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    patientId,
    caseId || null,
    complaint ? cryptoService.encrypt(complaint) : null,
    diagnosis ? cryptoService.encrypt(diagnosis) : null,
    notes ? cryptoService.encrypt(notes) : null,
    totalAmount,
    user.userId
  );

  return { id: result.lastInsertRowid };
}

/**
 * Get patient history (CASE-AWARE)
 * - Groups visits by case
 * - STAFF sees limited data
 */
function getPatientHistory(patientId, user) {
  const rows = db.prepare(`
    SELECT
      v.id,
      v.created_at,
      v.total_amount,
      v.case_id,
      c.title AS case_title,
      c.status AS case_status,
      v.complaint_encrypted,
      v.diagnosis_encrypted,
      v.notes_encrypted,

      /* payment aggregation */
      COALESCE(SUM(p.amount), 0) AS paid,
      (v.total_amount - COALESCE(SUM(p.amount), 0)) AS remaining,

      CASE
        WHEN (v.total_amount - COALESCE(SUM(p.amount), 0)) = 0 THEN 'PAID'
        WHEN COALESCE(SUM(p.amount), 0) > 0 THEN 'PARTIAL'
        ELSE 'PENDING'
      END AS payment_status

    FROM visits v
    LEFT JOIN cases c ON c.id = v.case_id
    LEFT JOIN payments p ON p.visit_id = v.id
    WHERE v.patient_id = ?
    GROUP BY v.id
    ORDER BY v.created_at DESC
  `).all(patientId);

  return rows.map(r => {
  const effectiveTotal = paymentService.getEffectiveVisitTotal(r.id);
  const paid = r.paid;

  // 🔒 CRITICAL GUARD
  let remaining = Math.max(effectiveTotal - paid, 0);

  let paymentStatus = 'PENDING';

  if (effectiveTotal === 0) {
    paymentStatus = 'PAID';
  } else if (paid === 0) {
    paymentStatus = 'PENDING';
  } else if (remaining > 0) {
    paymentStatus = 'PARTIAL';
  } else {
    paymentStatus = 'PAID';
  }

  const visit = {
    id: r.id,
    createdAt: r.created_at,
    totalAmount: effectiveTotal,   // 🔥 override SQL
    paid,
    remaining,
    paymentStatus,                // 🔥 authoritative
    case: r.case_id
      ? {
          id: r.case_id,
          title: r.case_title,
          status: r.case_status,
        }
      : null,
  };

  if (true) {
    visit.complaint = r.complaint_encrypted
      ? cryptoService.decrypt(r.complaint_encrypted)
      : null;
    visit.diagnosis = r.diagnosis_encrypted
      ? cryptoService.decrypt(r.diagnosis_encrypted)
      : null;
    visit.notes = r.notes_encrypted
      ? cryptoService.decrypt(r.notes_encrypted)
      : null;
  }

  return visit;
});
}

module.exports = {
  createVisit,
  getPatientHistory,
};
