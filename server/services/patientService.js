// server/services/patientService.js
const db = require('../db');
const cryptoService = require('../crypto/cryptoService');
const crypto = require('crypto');

/* ================= HELPERS ================= */
function hashPhone(phone) {
  return crypto
    .createHash('sha256')
    .update(phone)
    .digest('hex');
}

/* ================= CREATE ================= */
function createPatient({ name, age, gender, phone }, user) {
  if (user.accessMode === 'REMOTE') {
    throw new Error('Remote users cannot create patients');
  }

  const phoneEncrypted = cryptoService.encrypt(phone);
  const phoneHash = hashPhone(phone);

  const stmt = db.prepare(`
    INSERT INTO patients
    (name, age, gender, phone_encrypted, phone_hash, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    name,
    age,
    gender,
    phoneEncrypted,
    phoneHash,
    user.userId
  );

  return {
    id: result.lastInsertRowid,
    name,
    age,
    gender,
    phone
  };
}

/* ================= SEARCH (NAME / PHONE) ================= */
function searchPatients(q, user) {
  if (!q) return [];

  const isPhone = /^[0-9]{6,}$/.test(q);
  let rows = [];

  if (isPhone) {
    const phoneHash = hashPhone(q);
    rows = db.prepare(`
      SELECT id, name, age, gender, phone_encrypted, created_at
      FROM patients
      WHERE phone_hash = ?
      ORDER BY created_at DESC
      LIMIT 5
    `).all(phoneHash);
  } else {
    rows = db.prepare(`
      SELECT id, name, age, gender, phone_encrypted, created_at
      FROM patients
      WHERE name LIKE ?
      ORDER BY created_at DESC
      LIMIT 5
    `).all(`%${q}%`);
  }

  return rows.map(p => ({
    id: p.id,
    name: p.name,
    age: p.age,
    gender: p.gender,
    phone:
      user.role === 'STAFF'
        ? undefined
        : cryptoService.decrypt(p.phone_encrypted),
    createdAt: p.created_at
  }));
}

/* ================= RECENT PATIENTS ================= */
function getRecentPatients(user) {
  const rows = db.prepare(`
    SELECT
      p.id,
      p.name,
      p.age,
      p.gender,
      p.phone_encrypted,
      MAX(
        COALESCE(v.created_at, p.created_at)
      ) AS last_activity
    FROM patients p
    LEFT JOIN visits v ON v.patient_id = p.id
    GROUP BY p.id
    ORDER BY last_activity DESC
    LIMIT 10
  `).all();

  return rows.map(p => ({
    id: p.id,
    name: p.name,
    age: p.age,
    gender: p.gender,
    phone:
      user.role === 'STAFF'
        ? undefined
        : cryptoService.decrypt(p.phone_encrypted),
    lastActivity: p.last_activity
  }));
}

function getPatientById(patientId, user) {
  const row = db.prepare(`
    SELECT id, name, age, gender, phone_encrypted, created_at
    FROM patients
    WHERE id = ?
  `).get(patientId);

  if (!row) {
    throw new Error('Patient not found');
  }

  return {
    id: row.id,
    name: row.name,
    age: row.age,
    gender: row.gender,
    phone:
      user.role === 'STAFF'
        ? undefined
        : cryptoService.decrypt(row.phone_encrypted),
    createdAt: row.created_at,
  };
}

module.exports = {
  createPatient,
  searchPatients,
  getRecentPatients,
  getPatientById,
};
