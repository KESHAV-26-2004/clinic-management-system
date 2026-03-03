// server/services/paymentService.js
const db = require('../db');

function addPayment(visitId, amount, mode, user) {
  if (user.accessMode === 'REMOTE') {
    throw new Error('Remote users cannot add payments');
  }

  if (!['CASH', 'UPI', 'CARD'].includes(mode)) {
    throw new Error('Invalid payment mode');
  }

  const effectiveTotal = getEffectiveVisitTotal(visitId);

  if (effectiveTotal <= 0) {
    throw new Error('Billing not created yet');
  }

  const paid = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as paid
    FROM payments
    WHERE visit_id = ?
  `).get(visitId).paid;

  if (paid + amount > effectiveTotal) {
    throw new Error('Payment exceeds bill amount');
  }

  db.prepare(`
    INSERT INTO payments (visit_id, amount, mode, created_by)
    VALUES (?, ?, ?, ?)
  `).run(visitId, amount, mode, user.userId);

  return { success: true };
}

function getPatientPaymentSummary(patientId) {
  const visits = db.prepare(`
    SELECT id
    FROM visits
    WHERE patient_id = ?
  `).all(patientId);

  let total = 0;

  for (const v of visits) {
    total += getEffectiveVisitTotal(v.id);
  }

  const paid = db.prepare(`
    SELECT COALESCE(SUM(p.amount), 0) AS paid
    FROM payments p
    JOIN visits v ON v.id = p.visit_id
    WHERE v.patient_id = ?
  `).get(patientId).paid;

  const lastPayment = db.prepare(`
    SELECT p.created_at
    FROM payments p
    JOIN visits v ON v.id = p.visit_id
    WHERE v.patient_id = ?
    ORDER BY p.created_at DESC
    LIMIT 1
  `).get(patientId);

  return {
    total,
    paid,
    pending: Math.max(total - paid, 0),
    last: lastPayment
      ? new Date(lastPayment.created_at).toLocaleDateString("en-IN")
      : null,
  };
}

function getPaymentsByVisit(visitId) {
  return db.prepare(`
    SELECT p.id, p.amount, p.mode, p.created_at,
           u.username as collected_by
    FROM payments p
    JOIN users u ON u.id = p.created_by
    WHERE p.visit_id = ?
    ORDER BY p.created_at ASC
  `).all(visitId);
}

function getVisitPaymentSummary(visitId) {
  const effectiveTotal = getEffectiveVisitTotal(visitId);

  const paid = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as paid
    FROM payments
    WHERE visit_id = ?
  `).get(visitId).paid;

  const remaining = effectiveTotal - paid;

  let status = 'PENDING';

  if (effectiveTotal === 0) {
    status = 'PAID';
  } else if (paid === 0) {
    status = 'PENDING';
  } else if (remaining > 0) {
    status = 'PARTIAL';
  } else {
    status = 'PAID';
  }

  return {
    total: effectiveTotal,
    paid,
    remaining,
    status,
  };
}

function getPendingPayments() {
  return db.prepare(`
    SELECT v.id as visitId, p.name, v.total_amount,
           COALESCE(SUM(pay.amount), 0) as paid,
           (v.total_amount - COALESCE(SUM(pay.amount), 0)) as remaining
    FROM visits v
    JOIN patients p ON p.id = v.patient_id
    LEFT JOIN payments pay ON pay.visit_id = v.id
    GROUP BY v.id
    HAVING remaining > 0
    ORDER BY v.created_at ASC
  `).all();
}

function getTodayCollection() {
  return db.prepare(`
    SELECT mode, SUM(amount) as total
    FROM payments
    WHERE DATE(created_at) = DATE('now')
    GROUP BY mode
  `).all();
}

function settleGlobalPayment(patientId, amount, mode, user) {
  if (user.accessMode === 'REMOTE') {
    throw new Error('Remote users cannot add payments');
  }

  if (!['CASH', 'UPI', 'CARD'].includes(mode)) {
    throw new Error('Invalid payment mode');
  }

  if (!amount || amount <= 0) {
    throw new Error('Invalid amount');
  }

  // Calculate patient pending FIRST
  const summary = getPatientPaymentSummary(patientId);

  if (summary.pending <= 0) {
    throw new Error('All visits are already fully paid');
  }

  if (amount > summary.pending) {
    throw new Error(`Amount exceeds pending ₹${summary.pending}`);
  }

  let remainingAmount = amount;

  const visits = db.prepare(`
    SELECT id
    FROM visits
    WHERE patient_id = ?
    ORDER BY created_at ASC
  `).all(patientId);

  for (const visit of visits) {
    if (remainingAmount <= 0) break;

    const effectiveTotal = getEffectiveVisitTotal(visit.id);

    const paid = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS paid
      FROM payments
      WHERE visit_id = ?
    `).get(visit.id).paid;

    const pending = effectiveTotal - paid;
    if (pending <= 0) continue;

    const payNow = Math.min(pending, remainingAmount);

    db.prepare(`
      INSERT INTO payments (visit_id, amount, mode, created_by)
      VALUES (?, ?, ?, ?)
    `).run(visit.id, payNow, mode, user.userId);

    remainingAmount -= payNow;
  } 

  return {
    success: true,
    settled: amount,
  };
}

function getEffectiveVisitTotal(visitId) {
  const visit = db.prepare(`
    SELECT billing_status, total_amount
    FROM visits
    WHERE id = ?
  `).get(visitId);

  if (!visit) throw new Error('Visit not found');

  // FINALIZED → frozen total
  if (visit.billing_status === 'FINALIZED') {
    return visit.total_amount;
  }

  // OPEN → live billing sum
  const billingTotal = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM visit_billings
    WHERE visit_id = ?
  `).get(visitId).total;

  return billingTotal;
}

module.exports = {
  getEffectiveVisitTotal,
  settleGlobalPayment,
  getPatientPaymentSummary,
  addPayment,
  getPaymentsByVisit,
  getVisitPaymentSummary,
  getPendingPayments,
  getTodayCollection,
};
