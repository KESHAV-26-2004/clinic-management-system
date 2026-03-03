const db = require("../db");
const cryptoService = require("../crypto/cryptoService");
const paymentService = require("./paymentService");
const { buildVisitPrintHtml } = require("../templates/visitPrintTemplate");

function forbid(msg) {
  const err = new Error(msg);
  err.status = 403;
  throw err;
}

function notFound(msg) {
  const err = new Error(msg);
  err.status = 404;
  throw err;
}

function safeDecrypt(value) {
  if (!value) return "";
  return cryptoService.decrypt(value);
}

async function generateVisitSummary(visitId, user) {

  // 🔐 ACCESS CONTROL
  if (user.role === "ADMIN") {
    forbid("Access denied");
  }

  // =====================================
  // 🏥 FETCH CLINIC SETTINGS
  // =====================================
  const clinic = db.prepare(`
    SELECT name, address, phone, logo_path, doctor_signature_path
    FROM clinic_settings
    WHERE id = 1
  `).get();

  // =====================================
  // 🧾 FETCH VISIT + PATIENT + DOCTOR
  // =====================================
  const visit = db.prepare(`
    SELECT
      v.id,
      v.patient_id,
      v.case_id,
      v.total_amount,
      v.complaint_encrypted,
      v.diagnosis_encrypted,
      v.notes_encrypted,
      v.created_at,

      p.name AS patient_name,
      p.age,
      p.gender,
      p.phone_encrypted,

      u.username AS doctor_name

    FROM visits v
    JOIN patients p ON v.patient_id = p.id
    JOIN users u ON v.created_by = u.id
    WHERE v.id = ?
  `).get(visitId);

  if (!visit) {
    notFound("Visit not found");
  }

  // =====================================
  // 📅 FORMAT DATE
  // =====================================
  const dateFormatted = new Date(visit.created_at)
    .toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

  // =====================================
  // 🧾 CASE (OPTIONAL)
  // =====================================
  let caseInfo = null;
  if (visit.case_id) {
    caseInfo = db.prepare(`
      SELECT id, status
      FROM cases
      WHERE id = ?
    `).get(visit.case_id);
  }

  // =====================================
  // 💊 PRESCRIPTIONS
  // =====================================
  const prescriptions = db.prepare(`
    SELECT medicine, dosage, frequency, duration, instructions
    FROM prescriptions
    WHERE visit_id = ?
  `).all(visitId);

  // 💰 TOTAL (USE EFFECTIVE LOGIC)
  // =====================================
  const effectiveTotal = paymentService.getEffectiveVisitTotal(visitId);

  // =====================================
  // 💰 PAID
  // =====================================
  const totalPaid = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as paid
    FROM payments
    WHERE visit_id = ?
  `).get(visitId).paid;

  const pending = Math.max(0, effectiveTotal - totalPaid);

  // =====================================
  // 🔓 DECRYPT DATA
  // =====================================
  const phone = safeDecrypt(visit.phone_encrypted);
  const complaint = safeDecrypt(visit.complaint_encrypted);
  const diagnosis = safeDecrypt(visit.diagnosis_encrypted);
  const notes = safeDecrypt(visit.notes_encrypted);

  // =====================================
  // BUILD HTML USING TEMPLATE
  // =====================================
  const BASE_URL = "https://localhost:8443";
  return buildVisitPrintHtml({
    clinic: {
      ...clinic,
      logo_path: clinic?.logo_path
        ? `${BASE_URL}/uploads/${clinic.logo_path}`
        : null
    },
    patient: {
      name: visit.patient_name,
      age: visit.age,
      gender: visit.gender,
      phone
    },
    doctor: {
      name: visit.doctor_name,
      signature: clinic?.doctor_signature_path
        ? `${BASE_URL}/uploads/${clinic.doctor_signature_path}`
        : null

    },
    caseInfo,
    visit: {
      dateFormatted,
      complaint,
      diagnosis,
      notes
    },
    prescriptions,
    billing: {
      total: effectiveTotal,
      paid: totalPaid,
      pending
    }
  });
}

module.exports = { generateVisitSummary };
