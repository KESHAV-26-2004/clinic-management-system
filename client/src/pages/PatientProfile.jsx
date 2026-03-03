//src/pages/PatientProfile.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";
import {FiChevronRight } from "react-icons/fi";
import PatientPayments from "./PatientPayments";
import { formatName } from "../utils/format";

import VisitForm from "./VisitForm";
import VisitDetails from "./VisitDetails";
import VisitHistory from "./VisitHistory";

import "../styles/patientProfile.css";

export const VISIT_MODE = {
  NONE: "NONE",
  CREATE_CASE: "CREATE_CASE",
  CREATE_VISIT: "CREATE_VISIT",
  VIEW_VISIT: "VIEW_VISIT",
  HISTORY: "HISTORY",
  PAYMENTS: "PAYMENTS",
};

export default function PatientProfile() {
  const { patientId } = useParams();
  const { user } = useAuth();

  const readOnly =
    user.accessMode === "REMOTE" || user.role === "STAFF";

  const [patient, setPatient] = useState(null);
  const [cases, setCases] = useState(null);
  const [visits, setVisits] = useState([]);

  const [activeCaseId, setActiveCaseId] = useState(null);
  const [expandedCaseId, setExpandedCaseId] = useState(null);
  const [activeVisitId, setActiveVisitId] = useState(null);

  const [mode, setMode] = useState(VISIT_MODE.NONE);

  const [caseTitle, setCaseTitle] = useState("");
  const [search, setSearch] = useState("");
  const [paymentSummary, setPaymentSummary] = useState({
    pending: 0,
    last: null,
  });

  // live history UI (local only)
  const [historyUI, setHistoryUI] = useState({
    openCases: {},
    standaloneOpen: false,
  });

  // frozen snapshot (browser-owned)
  const [historySnapshot, setHistorySnapshot] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const pushUIState = (next) => {
    navigate(".", {
      replace: false, // 🔥 important: push, not replace
      state: {
      mode,
      activeVisitId,
      activeCaseId,
      expandedCaseId,
      historySnapshot,
      ...next,
    },
    });
  };

  useEffect(() => {
    if (!location.state) return;

    if (location.state.mode !== undefined) {
      setMode(location.state.mode);
    }

    if (location.state.activeVisitId !== undefined) {
      setActiveVisitId(location.state.activeVisitId);
    }

    if (location.state.activeCaseId !== undefined) {
      setActiveCaseId(location.state.activeCaseId);
    }

    if (location.state.expandedCaseId !== undefined) {
      setExpandedCaseId(location.state.expandedCaseId);
    }

    // ✅ ONLY restore snapshot
    if (location.state.historySnapshot) {
      setHistoryUI(location.state.historySnapshot);
    }
  }, [location.state]);

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    api.get(`/patients/${patientId}`).then(res => setPatient(res.data));
    reloadCases();
    loadVisits();
  }, [patientId]);

  const reloadCases = async () => {
    const res = await api.get(`/cases/patient/${patientId}`);
    setCases(res.data);
  };
  
  useEffect(() => {
    if (mode !== VISIT_MODE.HISTORY) return;
    if (location.state) return; // ⛔ coming from history

    // fresh entry only
    if (cases?.openCase) {
      setExpandedCaseId(cases.openCase.id);
    }
  }, [mode, cases]);

  useEffect(() => {
    if (!patientId) return;

    const loadPaymentSummary = async () => {
      try {
        const res = await api.get(
          `/payments/patient/${patientId}/summary`
        );

        setPaymentSummary({
          pending: res.data.pending || 0,
          last: res.data.last || null,
        });
      } catch {
        setPaymentSummary({ pending: 0, last: null });
      }
    };

    loadPaymentSummary();
  }, [patientId]);

  useEffect(() => {
    if (
      mode !== VISIT_MODE.VIEW_VISIT &&
      activeVisitId !== null
    ) {
      setActiveVisitId(null);
    }
  }, [mode]);

  const loadVisits = async () => {
    const res = await api.get(`/visits/patient/${patientId}`);
    setVisits(res.data);
  };

  /* ---------------- DERIVED ---------------- */
  const visitsByCase = useMemo(() => {
    const map = {};
    [...visits]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .forEach(v => {
        if (v.case?.id) {
          if (!map[v.case.id]) map[v.case.id] = [];
          map[v.case.id].push(v);
        }
      });
    return map;
  }, [visits]);

  /* ---------------- ACTIONS ---------------- */

  const handleNewCaseClick = () => {
    if (cases?.openCase) {
      alert("Close the active case before starting a new one.");
      return;
    }
    setMode(VISIT_MODE.CREATE_CASE);
  };

  const startNewCase = async () => {
    if (!caseTitle.trim()) return alert("Case title required");

    const res = await api.post("/cases", {
      patientId,
      title: formatName(caseTitle),
    });

    const newCaseId = res.data.id; // ← IMPORTANT

    setCaseTitle("");
    await reloadCases();

    setActiveCaseId(newCaseId);
    setExpandedCaseId(newCaseId);
    setMode(VISIT_MODE.CREATE_VISIT);

    pushUIState({
      mode: VISIT_MODE.CREATE_VISIT,
      activeCaseId: newCaseId,
      expandedCaseId: newCaseId,
    });
  };

  const closeCase = async (id) => {
    if (!window.confirm("Close this case?")) return;
    await api.patch(`/cases/${id}/close`);
    setMode(VISIT_MODE.NONE);
    reloadCases();
  };

  const selectVisit = (visit) => {
    // 🔒 FREEZE history EXACTLY ONCE
    const snapshot = historyUI;
    setHistorySnapshot(snapshot);

    pushUIState({
      mode: VISIT_MODE.VIEW_VISIT,
      activeVisitId: visit.id,
      activeCaseId: visit.case?.id || null,
      historySnapshot: snapshot,
    });

    setMode(VISIT_MODE.VIEW_VISIT);
    setActiveVisitId(visit.id);
    setActiveCaseId(visit.case?.id || null);
  };

  if (!patient) return <p>Loading…</p>;

  return (
    <div className="patient-profile-page">
      {/* ================= LEFT ================= */}
      <aside className="column-left">
        <div className="column-left-inner">
          {/* CANVAS 1 — PATIENT INFO */}
          <div className="canvas">
            <div className="canvas-header">
              <span className="canvas-title">Patient</span>
            </div>

            <h3>{patient.name}</h3>
            <div>{patient.age} • {patient.gender}</div>
            <div>{patient.phone}</div>
            <div className="muted">ID: {patient.id}</div>
          </div>

          {/* CANVAS 2 — CASE MANAGER */}
          <div className="canvas">
            <div className="canvas-header">
              <span className="canvas-title">Cases & Visits</span>
            </div>

            <input
              className="search search-disabled"
              placeholder="Search visits (coming soon)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled
            />

            <div className="actions">
              {!readOnly && (
                <>
                  <button className="btn-case" onClick={handleNewCaseClick}>
                    + New Case
                  </button>

                  <button
                    className="btn-visit"
                    onClick={() => {
                      setMode(VISIT_MODE.CREATE_VISIT);
                      setActiveCaseId(null);
                      setActiveVisitId(null);
                      setExpandedCaseId(null);

                      pushUIState({
                        mode: VISIT_MODE.CREATE_VISIT,
                        activeCaseId: null,
                        activeVisitId: null,
                        expandedCaseId: null,
                      });
                    }}
                  >
                    + New Visit
                  </button>
                </>
              )}

              {/* 🔥 History should be visible to everyone */}
              <button
                className="btn-history"
                onClick={() => {
                  setMode(VISIT_MODE.HISTORY);
                  setActiveVisitId(null);
                  pushUIState({
                    mode: VISIT_MODE.HISTORY,
                    activeVisitId: null,
                  });
                }}
              >
                History
              </button>
            </div>

            {mode === VISIT_MODE.CREATE_CASE && (
              <div className="inline-form">
                <input
                  className="case-input"
                  placeholder="Case title"
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                />
                <button className="primary-btn" onClick={startNewCase}>
                  Start Case
                </button>
              </div>
            )}

            {cases?.openCase && (
              <>
                {/* ===== ACTIVE CASE HEADER ===== */}
                <div className="case-card active">
                  <div className="case-header-static">
                    <div className="case-title">Active Case</div>
                    <div className="case-name">
                      {cases.openCase.title || "Untitled Case"}
                    </div>
                  </div>
                </div>

                {/* ===== VISITS (COLLAPSIBLE) ===== */}
                <div className="case-card">
                  <div
                    className="case-header"
                    onClick={() => {
                      const next =
                        expandedCaseId === cases.openCase.id
                          ? null
                          : cases.openCase.id;

                      setExpandedCaseId(next);
                      pushUIState({ expandedCaseId: next });
                    }}
                  >
                    <span className="case-title">Visits</span>

                    <FiChevronRight
                      className={`case-arrow ${
                        expandedCaseId === cases.openCase.id ? "open" : ""
                      }`}
                    />
                  </div>

                  {expandedCaseId === cases.openCase.id && (
                    <>
                      <div className="divider" />
                      {(visitsByCase[cases.openCase.id] || []).map(v => (
                        <div
                          key={v.id}
                          className={`visit-item ${
                            activeVisitId === v.id ? "selected" : ""
                          }`}
                          onClick={() => selectVisit(v)}
                        >
                          Visit #{v.id}
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* ===== ACTIONS ===== */}
                {!readOnly && (
                  <div className="case-actions-bar">
                    <button
                      className="btn-visit"
                      onClick={() => {
                        setMode(VISIT_MODE.CREATE_VISIT);
                        setActiveCaseId(cases.openCase.id);
                        setExpandedCaseId(cases.openCase.id);
                        setActiveVisitId(null);

                        pushUIState({
                          mode: VISIT_MODE.CREATE_VISIT,
                          activeCaseId: cases.openCase.id,
                          expandedCaseId: cases.openCase.id,
                          activeVisitId: null,
                        });
                      }}
                    >
                      + New Visit
                    </button>

                    <button
                      className="danger"
                      onClick={() => closeCase(cases.openCase.id)}
                    >
                      Close Case
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
          <div className="canvas">
            <div className="canvas-header">
              <span className="canvas-title">Payments</span>
            </div>

            <div className="payment-summary-mini">
              <div>
                <span className="label">Total Pending</span>
                <b>₹{paymentSummary.pending}</b>
              </div>

              <div>
                <span className="label">Last Payment</span>
                <b>{paymentSummary.last || "—"}</b>
              </div>
            </div>

            <button
              className="btn-visit"
              onClick={() => {
                setMode(VISIT_MODE.PAYMENTS);
                setActiveVisitId(null);

                pushUIState({
                  mode: VISIT_MODE.PAYMENTS,
                  activeVisitId: null,
                });
              }}
            >
              View Payments
            </button>
          </div>
        </div>
      </aside>

      {/* ================= RIGHT ================= */}
      <section className="column-right">
        <div className="canvas">
          <div className="canvas-header">
            <span className="canvas-title">Workspace</span>
          </div>

          {mode === VISIT_MODE.NONE && (
            <p className="center">Select or create a visit</p>
          )}

          {mode === VISIT_MODE.CREATE_VISIT && (
            <VisitForm
              patientId={patientId}
              caseId={activeCaseId}
              onCreated={(visitId) => {
                loadVisits();
                setActiveVisitId(visitId);
                setMode(VISIT_MODE.VIEW_VISIT);

                pushUIState({
                  mode: VISIT_MODE.VIEW_VISIT,
                  activeVisitId: visitId,
                  activeCaseId,
                  expandedCaseId: activeCaseId ? activeCaseId : null,
                });

                // 👇 CASE VISIT
                if (activeCaseId) {
                  setExpandedCaseId(activeCaseId);
                }

                // 👇 STANDALONE VISIT
                if (!activeCaseId) {
                  setExpandedCaseId(null);
                }
              }}
            />
          )}

          {mode === VISIT_MODE.VIEW_VISIT && activeVisitId && (
            <VisitDetails
              visit={visits.find(v => v.id === activeVisitId)}
            />
          )}

          {mode === VISIT_MODE.HISTORY && (
            <VisitHistory
              visits={visits}
              onSelect={selectVisit}
              openCases={historyUI.openCases}
              setOpenCases={(fn) =>
                setHistoryUI(prev => ({
                  ...prev,
                  openCases: typeof fn === "function"
                    ? fn(prev.openCases)
                    : fn,
                }))
              }
              standaloneOpen={historyUI.standaloneOpen}
              setStandaloneOpen={(v) =>
                setHistoryUI(prev => ({
                  ...prev,
                  standaloneOpen: v,
                }))
              }
            />
          )}

          {mode === VISIT_MODE.PAYMENTS && (
            <PatientPayments
              patientId={patientId}
              role={user.role}
            />
          )}

        </div>
      </section>
    </div>
  );
}
