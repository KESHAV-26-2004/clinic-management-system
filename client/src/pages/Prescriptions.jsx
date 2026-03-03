// client/src/pages/Prescriptions.jsx
import { useEffect, useState } from "react";
import api from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";

export default function Prescriptions({ visitId }) {
  const { user } = useAuth();

  const readOnly =
    user.accessMode === "REMOTE" || user.role === "STAFF";

  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    medicine: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  });

  const loadPrescriptions = async () => {
    const res = await api.get(`/prescriptions/visit/${visitId}`);
    setList(res.data);
  };

  useEffect(() => {
    loadPrescriptions();
  }, [visitId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addPrescription = async () => {
    if (!form.medicine || !form.dosage || !form.frequency) {
      alert("Medicine, dosage and frequency are required");
      return;
    }

    try {
      await api.post("/prescriptions", {
        visitId,
        ...form,
      });

      setForm({
        medicine: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      });

      loadPrescriptions();
    } catch (err) {
      alert(err.response?.data?.error || "Cannot add prescription");
    }
  };

  return (
    <div className="prescriptions">
      {/* ===== ADD FORM ===== */}
      {!readOnly && (
        <div className="prescription-add-form">
          <input
            name="medicine"
            placeholder="Medicine"
            value={form.medicine}
            onChange={handleChange}
          />
          <input
            name="dosage"
            placeholder="Dosage"
            value={form.dosage}
            onChange={handleChange}
          />
          <input
            name="frequency"
            placeholder="Frequency"
            value={form.frequency}
            onChange={handleChange}
          />
          <input
            name="duration"
            placeholder="Duration"
            value={form.duration}
            onChange={handleChange}
          />
          <input
            name="instructions"
            placeholder="Instructions"
            value={form.instructions}
            onChange={handleChange}
          />

          <div className="prescription-action">
            <button
              className="add-prescription-btn"
              onClick={addPrescription}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* ===== TABLE ===== */}
      <div className="Ptable-scroll">
      <table className="prescription-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Medicine</th>
            <th>Dosage</th>
            <th>Frequency</th>
            <th>Duration</th>
            <th>Instructions</th>
          </tr>
        </thead>

        <tbody>
          {list.length === 0 && (
            <tr>
              <td colSpan="6" className="empty">
                No prescriptions added
              </td>
            </tr>
          )}

          {list.map((p, index) => (
            <tr key={p.id}>
              <td>{index + 1}</td>
              <td>{p.medicine}</td>
              <td>{p.dosage || "—"}</td>
              <td>{p.frequency || "—"}</td>
              <td>{p.duration || "—"}</td>
              <td>{p.instructions || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );

}
