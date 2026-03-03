// client/src/pages/Queue.jsx
import { useEffect, useState } from "react";
import api from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/queue.css";

export default function Queue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const readOnly = user?.accessMode === "REMOTE";

  const [queue, setQueue] = useState([]);
  const [search, setSearch] = useState("");
  const [matchResults, setMatchResults] = useState([]);
  const [activePatient, setActivePatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patientStats, setPatientStats] = useState({
    totalVisits: 0,
    lastVisit: null,
  });

  /* ---------------- LOAD QUEUE ---------------- */
  const loadQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get("/queue");
      setQueue(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientById = async (patientId, queueMeta = null) => {
    try {
      const res = await api.get(`/patients/${patientId}`);
      setActivePatient({
        ...res.data,
        queueMeta, // attach queue info separately
      });
    } catch {
      setActivePatient(null);
    }
  };

  const updateQueueStatus = async (q, status) => {
    try {
      await api.patch(`/queue/${q.id}/status`, { status });
      loadQueue();

      // Update active patient
      loadPatientById(q.patientId, { ...q, status });

      // 🔥 AUTO OPEN PROFILE ONLY WHEN STARTING
      if (status === "IN_PROGRESS") {
        navigate(`/patients/${q.patientId}`);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Action not allowed");
    }
  };

  useEffect(() => {
      loadQueue();
    }, []);

    useEffect(() => {
    if (!activePatient?.id) return;

    const loadStats = async () => {
      try {
        const res = await api.get(
          `/visits/patient/${activePatient.id}`
        );

        setPatientStats({
          totalVisits: res.data.length,
          lastVisit:
            res.data.length > 0
              ? res.data[0].createdAt
              : null,
        });
      } catch {
        setPatientStats({ totalVisits: 0, lastVisit: null });
      }
    };

    loadStats();
  }, [activePatient]);

  /* ---------------- AUTO SELECT CALLED ---------------- */
  useEffect(() => {
    if (activePatient) return; // 👈 don't override user choice

    const called = queue.find(q => q.status === "CALLED");
    if (called) {
      loadPatientById(called.patientId, called);
    }
  }, [queue]);

  /* ---------------- SEARCH (SAME AS PATIENTS) ---------------- */
  useEffect(() => {
    if (search.trim().length < 2) {
      setMatchResults([]);
      return;
    }

    const run = async () => {
      try {
        const res = await api.get(
          `/patients/search?q=${encodeURIComponent(search)}`
        );
        setMatchResults(res.data || []);
      } catch {
        setMatchResults([]);
      }
    };

    run();
  }, [search]);

  /* ---------------- ACTIONS ---------------- */
  const addToQueue = async () => {
    if (!activePatient) return;

    try {
      await api.post("/queue", { patientId: activePatient.id });
      loadQueue();
    } catch (err) {
      alert(err.response?.data?.error || "Cannot add to queue");
    }
  };

  const callPatient = async (q) => {
    try {
      await api.patch(`/queue/${q.id}/status`, { status: "CALLED" });
      loadQueue();
      loadPatientById(q.patientId, q);
    } catch (err) {
      alert(err.response?.data?.error || "Action not allowed");
    }
  };

  const openProfile = () => {
    if (activePatient) {
      navigate(`/patients/${activePatient.id}`);
    }
  };

  const activeQueueEntry = activePatient
    ? queue.find(
        q =>
          q.patientId === activePatient.id &&
          q.status !== "DONE"
      )
    : null;

  const alreadyInQueue = !!activeQueueEntry;

  if (loading) return <p className="loading">Loading queue…</p>;

  return (
    <div className="queue-page split">
      {/* ================= LEFT ================= */}
      <div className="queue-left">
        {/* SEARCH */}
        <div className="canvas queue-search-card">
          <input
            className="search-input"
            placeholder="Search by name or phone"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setActivePatient(null);
            }}
          />

          {matchResults.length > 0 && (
            <div className="match-list">
              {matchResults.slice(0, 4).map(p => (
                <div
                  key={p.id}
                  className="match-card"
                  onClick={() => {
                    const q = queue.find(x => x.patientId === p.id);
                    loadPatientById(p.id, q || null);
                    setMatchResults([]);
                    setSearch("");
                  }}
                >
                  <strong>{p.name}</strong>
                  <span>{p.phone}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QUEUE TABLE */}
        <div className="canvas">
          <table className="queue-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Age</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {[...queue]
                .sort((a, b) => {
                  if (a.status === "DONE" && b.status !== "DONE") return 1;
                  if (a.status !== "DONE" && b.status === "DONE") return -1;
                  return 0;
                })
                .map(q => (
                  <tr
                    key={q.id}
                    onClick={() => loadPatientById(q.patientId, q)}
                    className={
                      activePatient?.id === q.patientId ? "active" : ""
                    }
                  >
                    <td>{q.name}</td>
                    <td>{q.age}</td>
                    <td>
                      <span className={`status ${q.status.toLowerCase()}`}>
                        {q.status}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {!readOnly && user.role === "DOCTOR" && (
                        <>
                          {q.status === "WAITING" && (
                            <button
                              className="btn-primary"
                              onClick={() => updateQueueStatus(q, "CALLED")}
                            >
                              Call
                            </button>
                          )}

                          {q.status === "CALLED" && (
                            <button
                              className="btn-warning"
                              onClick={() => updateQueueStatus(q, "IN_PROGRESS")}
                            >
                              Start
                            </button>
                          )}

                          {q.status === "IN_PROGRESS" && (
                            <button
                              className="btn-success"
                              onClick={() => updateQueueStatus(q, "DONE")}
                            >
                              Done
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}

              {!queue.length && (
                <tr>
                  <td colSpan="4" className="empty">
                    No patients in queue
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* ================= RIGHT ================= */}
      <section className="card active-patient-card tall">
        <h3>Active Patient</h3>

        {!activePatient ? (
          <div className="empty-state">
            <p>No patient selected</p>
            <span>Select from queue or search</span>
          </div>
        ) : (
          <div className="active-grid">
            {/* LEFT BIG CARD */}
            <div className="active-left">
              <h4>{activePatient.name}</h4>

              <div className="phone">
                {activePatient.phone || "—"}
              </div>

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

                {!readOnly && (
                  <button
                    onClick={addToQueue}
                    disabled={alreadyInQueue}
                  >
                    {alreadyInQueue
                      ? "Already in Queue"
                      : "Add to Queue"}
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT STATS COLUMN */}
            <div className="active-right">
              <div className="stat-card">
                <span>Total Visits</span>
                <b>{patientStats.totalVisits}</b>
              </div>

              <div className="stat-card">
                <span>Status</span>
                <b>{activeQueueEntry ? activeQueueEntry.status : "—"}</b>
              </div>

              <div className="stat-card">
                <span>Last Visit</span>
                <b>{patientStats.lastVisit || "—"}</b>
              </div>

            </div>
          </div>
        )}
      </section>

    </div>
  );
}
