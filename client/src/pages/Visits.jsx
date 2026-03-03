// client/src/pages/Visits.jsx
import { useEffect, useState } from "react";
import api from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";
import Prescriptions from "./Prescriptions";
import Payments from "./Payments";

export default function Visits({ patientId, openCase }) {
  const { user } = useAuth();
  const readOnly =
    user.accessMode === "REMOTE" || user.role === "STAFF";

  const [visits, setVisits] = useState([]);
  const [form, setForm] = useState({
    complaint: "",
    diagnosis: "",
    notes: "",
    totalAmount: "",
  });
  const [error, setError] = useState("");

  const loadVisits = async () => {
    try {
      const res = await api.get(`/visits/patient/${patientId}`);
      setVisits(res.data);
    } catch {
      setError("Failed to load visits");
    }
  };

  useEffect(() => {
    loadVisits();
  }, [patientId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createVisit = async () => {
    if (!form.totalAmount) return;

    try {
      await api.post("/visits", {
        patientId,
        caseId: openCase?.id || null,
        complaint: form.complaint,
        diagnosis: form.diagnosis,
        notes: form.notes,
        totalAmount: Number(form.totalAmount),
      });

      setForm({
        complaint: "",
        diagnosis: "",
        notes: "",
        totalAmount: "",
      });

      loadVisits();
    } catch (err) {
      alert(err.response?.data?.error || "Cannot create visit");
    }
  };

  if (error) return <p>{error}</p>;

  return (
    <div style={{ marginTop: "30px" }}>
      <h3>Visits</h3>

      {/* CREATE VISIT */}
      {!readOnly && (
        <div style={{ marginBottom: "20px" }}>
          <h4>New Visit</h4>

          <textarea
            name="complaint"
            placeholder="Complaint"
            value={form.complaint}
            onChange={handleChange}
          />

          <textarea
            name="diagnosis"
            placeholder="Diagnosis"
            value={form.diagnosis}
            onChange={handleChange}
          />

          <textarea
            name="notes"
            placeholder="Notes"
            value={form.notes}
            onChange={handleChange}
          />

          <input
            name="totalAmount"
            placeholder="Total Amount"
            type="number"
            value={form.totalAmount}
            onChange={handleChange}
          />

          <button onClick={createVisit}>Create Visit</button>
        </div>
      )}

      {/* VISIT HISTORY */}
      {visits.length === 0 && <p>No visits yet</p>}

      {visits.map((v) => (
        <div key={v.id} style={{ marginBottom: "12px" }}>
          <b>Visit #{v.id}</b> <br />
          Date: {v.createdAt} <br />
          Amount: ₹{v.totalAmount}

          {user.role !== "STAFF" && (
            <>
              <br />
              Complaint: {v.complaint}
              <br />
              Diagnosis: {v.diagnosis}
              <br />
              Notes: {v.notes}
            </>
          )}

          {v.case && (
            <>
              <br />
              Case: {v.case.title} ({v.case.status})
            </>
          )}

          <Prescriptions visitId={v.id} />

          <Payments visitId={v.id} />

          <button
            onClick={() => {
                const token = localStorage.getItem("token");
                window.open(
                `https://localhost:8443/api/print/visit/${v.id}?token=${token}`,
                "_blank"
                );
            }}
            >
            Print Visit Summary
            </button>

        </div>
      ))}
    </div>
  );
}
