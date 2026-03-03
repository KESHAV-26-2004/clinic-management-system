// server/services/queueService.js
const db = require('../db');

const ACTIVE_STATUSES = ['WAITING', 'CALLED', 'IN_PROGRESS'];

function addToQueue(patientId, user) {
  if (user.accessMode === 'REMOTE') {
    throw new Error('Remote users cannot modify queue');
  }

  // Check existing active entry (extra safety even with DB index)
  const existing = db.prepare(`
    SELECT id FROM queue
    WHERE patient_id = ?
      AND status IN (${ACTIVE_STATUSES.map(() => '?').join(',')})
      AND DATE(created_at) = DATE('now')
  `).get(patientId, ...ACTIVE_STATUSES);

  if (existing) {
    throw new Error('Patient already in queue today');
  }

  const result = db.prepare(`
    INSERT INTO queue (patient_id, status, created_by)
    VALUES (?, 'WAITING', ?)
  `).run(patientId, user.userId);

  return { id: result.lastInsertRowid };
}

function getTodayQueue() {
  return db.prepare(`
    SELECT q.id, q.status, q.created_at, q.updated_at,
           p.id AS patientId, p.name, p.age, p.gender
    FROM queue q
    JOIN patients p ON p.id = q.patient_id
    WHERE DATE(q.created_at) = DATE('now')
    ORDER BY q.created_at ASC
  `).all();
}

function updateStatus(queueId, newStatus, user) {
  if (user.accessMode === 'REMOTE') {
    throw new Error('Remote users cannot modify queue');
  }

  const allowedStatuses = [
    'WAITING',
    'CALLED',
    'IN_PROGRESS',
    'DONE',
    'CANCELLED',
  ];

  if (!allowedStatuses.includes(newStatus)) {
    throw new Error('Invalid status');
  }

  // 🔐 DOCTOR-ONLY CALL RULE
  if (newStatus === 'CALLED' && user.role !== 'DOCTOR') {
    throw new Error('Only doctor can call patients');
  }

  const result = db.prepare(`
    UPDATE queue
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newStatus, queueId);

  if (result.changes === 0) {
    throw new Error('Queue item not found');
  }

  // 🔐 AUDIT LOG (WRITE-ONLY)
  db.prepare(`
    INSERT INTO audit_log (user_id, action, entity, entity_id)
    VALUES (?, ?, 'queue', ?)
  `).run(
    user.userId,
    `QUEUE_STATUS_${newStatus}`,
    queueId
  );

  return { success: true };
}

module.exports = {
  addToQueue,
  getTodayQueue,
  updateStatus,
};
