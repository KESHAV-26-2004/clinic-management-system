// client/src/pages/VisitForm.jsx
import { useState } from "react";
import api from "../api/apiClient";

export default function VisitForm({ patientId, caseId, onCreated }) {
  const [form, setForm] = useState({
    complaint: "",
    diagnosis: "",
    notes: "",
    totalAmount: "",
  });

  const submit = async () => {
    const res = await api.post("/visits", {
      patientId,
      caseId,
      ...form,
      totalAmount: Number(form.totalAmount),
    });

    onCreated(res.data.id);
  };

  return (
    <div className="visit-form">
      <h3>New Visit</h3>

      <div className="form-group">
        <textarea
          placeholder="Complaint"
          value={form.complaint}
          onChange={(e) => setForm({ ...form, complaint: e.target.value })}
        />
        <textarea
          placeholder="Diagnosis"
          value={form.diagnosis}
          onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
        />
        <textarea
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      <button className="primary-btn" onClick={submit}>
        Save Visit
      </button>
    </div>
  );
}
