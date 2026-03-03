//server/templates/visitPrintTemplate.js
// =========================================
// PRESCRIPTION TABLE BUILDER
// =========================================
function buildPrescriptionTable(list) {
  if (!list || !list.length) {
    return "<p>No prescriptions added</p>";
  }

  return `
    <table class="prescription-table">
      <tr>
        <th>Medicine</th>
        <th>Dosage</th>
        <th>Frequency</th>
        <th>Duration</th>
        <th>Instructions</th>
      </tr>
      ${list.map(p => `
        <tr>
          <td>${p.medicine}</td>
          <td>${p.dosage || "-"}</td>
          <td>${p.frequency || "-"}</td>
          <td>${p.duration || "-"}</td>
          <td>${p.instructions || "-"}</td>
        </tr>
      `).join("")}
    </table>
  `;
}

function buildVisitPrintHtml(data) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Visit Summary</title>

<style>

@page {
  size: A4;
  margin: 15mm;
}

/* ===== FULL PAGE DARK BACKGROUND ===== */
body {
  margin: 0;
  background: #1e1e1e;
  font-family: 'Segoe UI', Arial, sans-serif;
}

/* ===== TOP TOOLBAR ===== */
.toolbar {
  background: #2b2b2b;
  padding: 12px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.toolbar button {
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.print-btn { background: #0f766e; color: white; }
.download-btn { background: #2563eb; color: white; }

/* ===== A4 PAPER ===== */
.paper-wrapper {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.paper {
  background: white;
  width: 794px;
  box-sizing: border-box;
  padding: 60px;
  box-shadow: 0 0 20px rgba(0,0,0,0.6);
  color: #222;
}

/* ===== HEADER ===== */
.header {
  text-align: center;
  margin-bottom: 35px;
}

.header h1 {
  margin: 0;
  font-size: 26px;
  text-transform: uppercase;
}

.header p {
  margin: 4px 0;
  font-size: 13px;
}

/* ===== ROW STRUCTURE ===== */
.row {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  margin-bottom: 18px;
}

.col {
  flex: 1;
}

.label {
  font-weight: 600;
}

/* ===== SECTION ===== */
.section {
  margin-bottom: 25px;
}

.section-title {
  font-weight: 600;
  border-bottom: 1px solid #444;
  margin-bottom: 10px;
  padding-bottom: 4px;
}

/* ===== TABLE ===== */
.prescription-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.prescription-table th,
.prescription-table td {
  border: 1px solid #555;
  padding: 6px;
}

/* ===== SIGNATURE ===== */
.signature {
  margin-top: 60px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.signature img {
  height: 70px;
}

/* PRINT MODE */
@media print {

  body {
    background: white;
  }

  .toolbar {
    display: none;
  }

  .paper-wrapper {
    padding: 0;
  }

  .paper {
    width: auto;
    padding: 0;
    margin: 0;
    box-shadow: none;
  }
}

</style>
</head>

<body>

<div class="toolbar">
  <button class="print-btn" onclick="window.print()">Print</button>
  <button class="download-btn" onclick="window.print()">Download PDF</button>
</div>

<div class="paper-wrapper">
<div class="paper">

  <div class="header">
    <h1>${data.clinic?.name || ""}</h1>
    <p>${data.clinic?.address || ""}</p>
    <p>Phone: ${data.clinic?.phone || ""}</p>
  </div>

  <!-- PATIENT DETAILS ROW -->
  <div class="section">
    <div class="section-title">Patient Details</div>
    <div class="row">
      <div class="col">
        <span class="label">Name:</span> ${data.patient.name}
      </div>
      <div class="col">
        <span class="label">Age:</span> ${data.patient.age}
      </div>
      <div class="col">
        <span class="label">Gender:</span> ${data.patient.gender}
      </div>
      <div class="col">
        <span class="label">Phone:</span> ${data.patient.phone}
      </div>
    </div>
  </div>

  <!-- CASE + VISIT IN ONE ROW -->
  <div class="section">
    <div class="section-title">Case & Visit</div>
    <div class="row">
      <div class="col">
        ${
          data.caseInfo
          ? `<span class="label">Case:</span> ID ${data.caseInfo.id} (${data.caseInfo.status})`
          : `<span class="label">Case:</span> Standalone`
        }
      </div>
      <div class="col">
        <span class="label">Visit Date:</span> ${data.visit.dateFormatted}
      </div>
      <div class="col">
        <span class="label">Doctor:</span> ${data.doctor.name}
      </div>
    </div>
  </div>

  <!-- VISIT DETAILS -->
  <div class="section">
    <div class="section-title">Clinical Details</div>
    <p><span class="label">Complaint:</span><br/>${data.visit.complaint || "-"}</p>
    <p><span class="label">Diagnosis:</span><br/>${data.visit.diagnosis || "-"}</p>
    <p><span class="label">Notes:</span><br/>${data.visit.notes || "-"}</p>
  </div>

  <!-- PRESCRIPTIONS -->
  <div class="section">
    <div class="section-title">Prescriptions</div>
    ${buildPrescriptionTable(data.prescriptions)}
  </div>

  <!-- BILLING ONE ROW -->
  <div class="section">
    <div class="section-title">Billing</div>
    <div class="row">
      <div class="col"><span class="label">Total:</span> ₹${data.billing.total}</div>
      <div class="col"><span class="label">Paid:</span> ₹${data.billing.paid}</div>
      <div class="col"><span class="label">Pending:</span> ₹${data.billing.pending}</div>
    </div>
  </div>

  <!-- SIGNATURE -->
  <div class="signature">
    <div>
      ${
        data.doctor.signature
        ? `<img src="${data.doctor.signature}" />`
        : ""
      }
      <div>Doctor Signature</div>
    </div>
  </div>

</div>
</div>

</body>
</html>
`;
}
module.exports = { buildVisitPrintHtml };