// server/services/clinicSettingsService.js
const db = require("../db");

function getClinicSettings() {
  return db.prepare(`
    SELECT
      name,
      address,
      phone,
      logo_path,
      doctor_signature_path,
      updated_at
    FROM clinic_settings
    WHERE id = 1
  `).get();
}

function updateClinicSettings({ name, address, phone }) {
  db.prepare(`
    UPDATE clinic_settings
    SET
      name = ?,
      address = ?,
      phone = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(name, address, phone);

  return getClinicSettings();
}

function updateLogo(path) {
  db.prepare(`
    UPDATE clinic_settings
    SET logo_path = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(path);
}

function updateSignature(path) {
  db.prepare(`
    UPDATE clinic_settings
    SET doctor_signature_path = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(path);
}

module.exports = {
  getClinicSettings,
  updateClinicSettings,
  updateLogo,
  updateSignature,
};
