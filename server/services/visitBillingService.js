// server/services/visitBillingService.js
const db = require('../db');

function ensureBillingOpen(visitId) {
  const visit = db.prepare(`
    SELECT billing_status
    FROM visits
    WHERE id = ?
  `).get(visitId);

  if (!visit) throw new Error('Visit not found');

  if (visit.billing_status === 'FINALIZED') {
    throw new Error('Billing already finalized');
  }
}

function addBillingItem(visitId, description, amount, user) {
  if (user.accessMode === 'REMOTE') {
    throw new Error('Remote users cannot add billing');
  }

  if (!description || !amount || amount <= 0) {
    throw new Error('Invalid billing data');
  }

  ensureBillingOpen(visitId);

  db.prepare(`
    INSERT INTO visit_billings
      (visit_id, description, amount, created_by)
    VALUES (?, ?, ?, ?)
  `).run(visitId, description, amount, user.userId);

  return { success: true };
}

function removeBillingItem(billingId, user) {
  if (user.accessMode === 'REMOTE') {
    throw new Error('Remote users cannot modify billing');
  }

  const billing = db.prepare(`
    SELECT visit_id
    FROM visit_billings
    WHERE id = ?
  `).get(billingId);

  if (!billing) throw new Error('Billing item not found');

  ensureBillingOpen(billing.visit_id);

  const paid = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS paid
    FROM payments
    WHERE visit_id = ?
  `).get(billing.visit_id).paid;

  if (paid > 0) {
    throw new Error('Cannot delete billing after payment received');
  }

  db.prepare(`
    DELETE FROM visit_billings
    WHERE id = ?
  `).run(billingId);

  return { success: true };
}

function getBillingByVisit(visitId) {
  const visit = db.prepare(`
    SELECT billing_status
    FROM visits
    WHERE id = ?
  `).get(visitId);

  const items = db.prepare(`
    SELECT id, description, amount, created_at
    FROM visit_billings
    WHERE visit_id = ?
    ORDER BY created_at ASC
  `).all(visitId);

  const total = items.reduce((sum, i) => sum + i.amount, 0);

  return {
    items,
    total,
    billing_status: visit.billing_status,
  };
}

function finalizeBilling(visitId, user) {
  if (user.accessMode === 'REMOTE') {
    throw new Error('Remote users cannot finalize billing');
  }

  const tx = db.transaction(() => {
    ensureBillingOpen(visitId);

    const billing = getBillingByVisit(visitId);

    if (billing.items.length === 0) {
      throw new Error('Cannot finalize empty billing');
    }

    // Safety: payments must not exceed billing
    const paid = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS paid
      FROM payments
      WHERE visit_id = ?
    `).get(visitId).paid;

    if (paid > billing.total) {
      throw new Error(
        `Cannot finalize. Paid ₹${paid} exceeds billing ₹${billing.total}`
      );
    }

    db.prepare(`
      UPDATE visits
      SET total_amount = ?, billing_status = 'FINALIZED'
      WHERE id = ?
    `).run(billing.total, visitId);

    return billing.total;
  });

  const total = tx();

  return {
    success: true,
    total,
  };
}

module.exports = {
  addBillingItem,
  removeBillingItem,
  getBillingByVisit,
  finalizeBilling,
};
