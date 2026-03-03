// client/src/pages/Patients.jsx
import { useEffect, useState } from "react";
import api from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";
import "../styles/patients.css";
import { useNavigate } from "react-router-dom";
import { formatName } from "../utils/format";

export default function Patients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const readOnly = user?.accessMode === "REMOTE";

  /* ---------------- STATE ---------------- */
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
  });

  const [matchResults, setMatchResults] = useState([]);
  const [activePatient, setActivePatient] = useState(null);
  const [recentPatients, setRecentPatients] = useState([]);

  const [registerMsg, setRegisterMsg] = useState("");

  const [patientStats, setPatientStats] = useState({
    totalVisits: 0,
    hasOpenCase: false,
    lastVisit: null,
  });

  const [queueStatus, setQueueStatus] = useState({
    inQueue: false,
    message: "",
  });

  useEffect(() => {
    if (!activePatient) return;

    async function checkQueueStatus() {
      try {
        const res = await api.get("/queue");

        const exists = res.data.some(
          q => q.patientId === activePatient.id && q.status !== "DONE"
        );

        setQueueStatus({
          inQueue: exists,
          message: exists ? "Patient is already in queue" : "",
        });
      } catch {
        setQueueStatus({ inQueue: false, message: "" });
      }
    }

    checkQueueStatus();
  }, [activePatient]);

  /* ---------------- AUTO HIDE REGISTER MESSAGE ---------------- */
  useEffect(() => {
    if (!registerMsg) return;

    const timer = setTimeout(() => {
      setRegisterMsg("");
    }, 10000);

    return () => clearTimeout(timer);
  }, [registerMsg]);

  /* ---------------- LOAD RECENT ---------------- */
  useEffect(() => {
    loadRecentPatients();
  }, []);

  async function loadRecentPatients() {
    try {
      const res = await api.get("/patients/recent");
      setRecentPatients(res.data.patients || res.data || []);
    } catch {
      // silent
    }
  }

  /* ---------------- LOAD ACTIVE PATIENT STATS ---------------- */
  useEffect(() => {
    if (!activePatient) return;

    async function loadPatientStats() {
      try {
        const visitRes = await api.get(
          `/visits/patient/${activePatient.id}`
        );

        let hasOpenCase = false;
        if (user.role !== "STAFF") {
          const caseRes = await api.get(
            `/cases/patient/${activePatient.id}`
          );
          hasOpenCase = !!caseRes.data.openCase;
        }

        setPatientStats({
          totalVisits: visitRes.data.length,
          lastVisit:
            visitRes.data.length > 0
              ? visitRes.data[0].createdAt
              : null,
          hasOpenCase,
        });
      } catch {
        setPatientStats({
          totalVisits: 0,
          hasOpenCase: false,
          lastVisit: null,
        });
      }
    }

    loadPatientStats();
  }, [activePatient, user.role]);

  /* ---------------- FORM CHANGE ---------------- */
  const handleChange = async (e) => {
    const { name, value } = e.target;

    if (registerMsg) setRegisterMsg("");

    const cleanValue =
      name === "phone" ? value.replace(/\D/g, "") : value;

    const updated = { ...form, [name]: cleanValue };
    setForm(updated);

    if (name === "name" || name === "phone") {
      setActivePatient(null);
    }

    if (name === "name") {
      if (cleanValue.length >= 2) {
        try {
          const res = await api.get(
            `/patients/search?q=${encodeURIComponent(cleanValue)}`
          );
          setMatchResults(res.data || []);
        } catch {
          setMatchResults([]);
        }
      } else {
        setMatchResults([]);
      }
    }

    if (name === "phone") {
      if (cleanValue.length >= 6) {
        try {
          const res = await api.get(
            `/patients/search?q=${encodeURIComponent(cleanValue)}`
          );
          setMatchResults(res.data || []);
        } catch {
          setMatchResults([]);
        }
      } else {
        setMatchResults([]);
      }
    }
  };

  /* ---------------- REGISTER ---------------- */
  const registerPatient = async (e) => {
    e.preventDefault();
    setRegisterMsg("");

    try {
      const res = await api.post("/patients", {
        name: formatName(form.name),
        age: Number(form.age),
        gender: form.gender,
        phone: form.phone,
      });

      setActivePatient(res.data);
      setMatchResults([]);
      setForm({ name: "", age: "", gender: "", phone: "" });
      setRegisterMsg("Patient registered successfully");
      loadRecentPatients();
    } catch (err) {
      setRegisterMsg(
        err.response?.data?.error || "Failed to register patient"
      );
    }
  };

  /* ---------------- ACTIONS ---------------- */
  const openProfile = () => {
    if (activePatient) {
      setRegisterMsg("");
      navigate(`/patients/${activePatient.id}`);
    }
  };

  const addToQueue = async () => {
    try {
      await api.post("/queue", { patientId: activePatient.id });

      setQueueStatus({
        inQueue: true,
        message: "Patient added to queue",
      });

    } catch (err) {
      if (err.response?.data?.error?.includes("already")) {
        setQueueStatus({
          inQueue: true,
          message: "Patient is already in queue",
        });
      } else {
        setQueueStatus({
          inQueue: false,
          message: "Failed to add to queue",
        });
      }
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="patients-page">
      <div className="patients-top">
        {/* REGISTER */}
        <section className="card register-card tall">
          <h3>Register Patient</h3>

          {registerMsg && (
            <div className="register-msg">{registerMsg}</div>
          )}

          <form onSubmit={registerPatient}>
            <div className="form-group">
              <input
                name="name"
                placeholder="Full name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <input
                name="age"
                placeholder="Age"
                type="number"
                value={form.age}
                onChange={handleChange}
                required
              />

              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>

              <input
                name="phone"
                placeholder="Phone number"
                value={form.phone}
                onChange={handleChange}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                required
              />
            </div>

            {!readOnly && (
              <button type="submit" className="primary-btn">
                Register Patient
              </button>
            )}
          </form>
        </section>

        {/* ACTIVE PATIENT */}
        <section className="card active-patient-card tall">
          <h3>Active Patient</h3>

          {!activePatient && matchResults.length === 0 && (
            <div className="empty-state">
              <p>No patient selected</p>
              <span>Type name/phone or select from recent</span>
            </div>
          )}

          {matchResults.length > 0 && !activePatient && (
            <div className="match-list">
              {matchResults.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="match-card"
                  onClick={() => {
                    setActivePatient(p);
                    setMatchResults([]);
                    setRegisterMsg("");
                  }}
                >
                  <strong>{p.name}</strong>
                  <span>{p.phone}</span>
                </div>
              ))}
            </div>
          )}

          {activePatient && (
            <div className="active-grid">
              <div className="active-left">
                <h4>{activePatient.name}</h4>
                <div className="phone">{activePatient.phone}</div>

                <div className="active-meta">
                  <span className="meta-chip">
                    Age: {activePatient.age}
                  </span>
                  <span className="meta-chip">
                    Gender: {activePatient.gender}
                  </span>
                </div>

                <div className="action-row">
                  <button onClick={openProfile}>
                    Open Profile
                  </button>

                  <button
                    onClick={addToQueue}
                    disabled={queueStatus.inQueue}
                  >
                    {queueStatus.inQueue ? "Already in Queue" : "Add to Queue"}
                  </button>
                </div>

                {queueStatus.message && (
                  <div className="muted" style={{ marginTop: "8px" }}>
                    {queueStatus.message}
                  </div>
                )}
              </div>

              <div className="active-right">
                <div className="stat-card">
                  <span>Total Visits</span>
                  <b>{patientStats.totalVisits}</b>
                </div>

                <div className="stat-card">
                  <span>Open Case</span>
                  <b>
                    {patientStats.hasOpenCase ? "Yes" : "No"}
                  </b>
                </div>

                <div className="stat-card">
                  <span>Last Visit</span>
                  <b>
                    {patientStats.lastVisit || "—"}
                  </b>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* RECENT */}
      <section className="card recent-patients-card">
        <h3>Recent Patients</h3>

        <div className="table-scroll">
          <table className="recent-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {recentPatients.map((p, index) => (
                <tr
                  key={p.id}
                  onClick={() => {
                    setActivePatient(p);
                    setMatchResults([]);
                    setRegisterMsg("");
                  }}
                >
                  <td>{index + 1}</td>
                  <td>{p.name}</td>
                  <td>{p.age}</td>
                  <td>{p.gender}</td>
                  <td>{p.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}