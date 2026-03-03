//client/src/pages/PatientPayments.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../api/apiClient";
import { FiChevronRight } from "react-icons/fi";
import "../styles/patientPayments.css";

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PatientPayments({ patientId }) {
  const [summary, setSummary] = useState(null);
  const [visits, setVisits] = useState([]);
  const [openVisitId, setOpenVisitId] = useState(null);
  const [visitDetails, setVisitDetails] = useState({});
  const [globalOpen, setGlobalOpen] = useState(true);

  const [globalPayment, setGlobalPayment] = useState({
    amount: "",
    mode: "CASH",
  });

  const [visitPayments, setVisitPayments] = useState({});
  const [globalError, setGlobalError] = useState("");

  /* ---------- LOAD SUMMARY ---------- */
  useEffect(() => {
    api
      .get(`/payments/patient/${patientId}/summary`)
      .then(res => setSummary(res.data))
      .catch(() => setSummary(null));
  }, [patientId]);

  /* ---------- LOAD VISITS ---------- */
  useEffect(() => {
    api
      .get(`/visits/patient/${patientId}`)
      .then(res => setVisits(res.data || []));
  }, [patientId]);

  const settleGlobalPayment = async () => {
    if (!globalPayment.amount || Number(globalPayment.amount) <= 0) {
        setGlobalError("Enter a valid amount");
        return;
    }

    try {
        setGlobalError("");

        await api.post("/payments/global", {
        patientId,
        amount: Number(globalPayment.amount),
        mode: globalPayment.mode,
        });

        setGlobalPayment({ amount: "", mode: "CASH" });

        const [v, s] = await Promise.all([
        api.get(`/visits/patient/${patientId}`),
        api.get(`/payments/patient/${patientId}/summary`),
        ]);

        setVisits(v.data || []);
        setSummary(s.data);
        setVisitDetails({});
    } catch (err) {
        setGlobalError(
        err.response?.data?.error || "Payment failed"
        );
    }
    };

  /* ---------- SORT VISITS ---------- */
  const sortedVisits = useMemo(() => {
    return [...visits].sort((a, b) => {
      const pa = a.paymentStatus === "PAID" ? 1 : 0;
      const pb = b.paymentStatus === "PAID" ? 1 : 0;
      if (pa !== pb) return pa - pb;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [visits]);

  /* ---------- TOGGLE VISIT ---------- */
  const toggleVisit = async (visitId) => {
    if (openVisitId === visitId) {
      setOpenVisitId(null);
      return;
    }

    setOpenVisitId(visitId);

    if (!visitDetails[visitId]) {
      const res = await api.get(`/payments/visit/${visitId}`);
      setVisitDetails(prev => ({ ...prev, [visitId]: res.data }));
    }
  };

  /* ---------- ADD VISIT PAYMENT ---------- */
  const addVisitPayment = async (visitId) => {
    const data = visitPayments[visitId];
    if (!data?.amount) return;

    await api.post("/payments", {
      visitId,
      amount: Number(data.amount),
      mode: data.mode,
    });

    setVisitPayments(prev => {
      const copy = { ...prev };
      delete copy[visitId];
      return copy;
    });

    setOpenVisitId(null);

    const [v, s] = await Promise.all([
      api.get(`/visits/patient/${patientId}`),
      api.get(`/payments/patient/${patientId}/summary`),
    ]);

    setVisits(v.data || []);
    setSummary(s.data);
    setVisitDetails({});
  };

  return (
    <div className="patient-payments">

      {/* ================= GLOBAL PAYMENTS ================= */}
      <div className="pp-card">
        <div
          className="pp-header"
          onClick={() => setGlobalOpen(p => !p)}
        >
          <div className="pp-header-left">
            <FiChevronRight
              className={`pp-arrow ${globalOpen ? "open" : ""}`}
            />
            <strong>Payments</strong>
          </div>

          {!globalOpen && summary && (
            <span className="pp-header-right">
              ₹{summary.pending} pending
            </span>
          )}
        </div>

        {globalOpen && summary && (
          <div className="pp-expanded">
            <div className="pp-left">
              <div className="pp-row">
                <span className="pp-label">Total</span>
                <b>₹{summary.total}</b>
              </div>
              <div className="pp-row">
                <span className="pp-label">Paid</span>
                <b>₹{summary.paid}</b>
              </div>
              <div className="pp-row">
                <span className="pp-label">Pending</span>
                <b>₹{summary.pending}</b>
              </div>
            </div>

            <div className="pp-right">
              <div className="pp-form">
                <input
                  placeholder="Amount"
                  value={globalPayment.amount}
                  onChange={e =>
                    setGlobalPayment({
                      ...globalPayment,
                      amount: e.target.value,
                    })
                  }
                />
                <select
                  value={globalPayment.mode}
                  onChange={e =>
                    setGlobalPayment({
                      ...globalPayment,
                      mode: e.target.value,
                    })
                  }
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                </select>

                <button
                    className="pp-btn"
                    onClick={settleGlobalPayment}
                    >
                    Settle Globally
                </button>
              </div>
            </div>
            {globalError && (
            <div className="pp-error">{globalError}</div>
            )}
          </div>
        )}
      </div>

      {/* ================= VISITS ================= */}
      {sortedVisits.map(v => {
        const isOpen = openVisitId === v.id;
        const detail = visitDetails[v.id];

        return (
          <div key={v.id} className="pp-card">
            <div
              className="pp-header"
              onClick={() => toggleVisit(v.id)}
            >
              <div className="pp-header-left">
                <FiChevronRight
                  className={`pp-arrow ${isOpen ? "open" : ""}`}
                />
                <div>
                  <strong>Visit #{v.id}</strong>
                  <div className="pp-sub">
                    {v.case?.title || "Standalone"}
                  </div>
                </div>
              </div>

              <div className="pp-header-right">
                <span
                    className={`pp-status ${(v.paymentStatus || "PENDING").toLowerCase()}`}
                    >
                    {v.paymentStatus || "PENDING"}
                    </span>
                <div className="pp-time">{formatDate(v.createdAt)}</div>
                </div>
            </div>

            {isOpen && detail && (
              <div className="pp-expanded">
                <div className="pp-left">
                  <div className="pp-row">
                    <span className="pp-label">Complaint</span>
                    <span>{v.complaint || "—"}</span>
                  </div>
                  <div className="pp-row">
                    <span className="pp-label">Diagnosis</span>
                    <span>{v.diagnosis || "—"}</span>
                  </div>
                </div>

                <div className="pp-right">
                  <div className="pp-row">
                    <span className="pp-label">Total</span>
                    <b>₹{detail.summary.total}</b>
                  </div>
                  <div className="pp-row">
                    <span className="pp-label">Paid</span>
                    <b>₹{detail.summary.paid}</b>
                  </div>
                  <div className="pp-row">
                    <span className="pp-label">Pending</span>
                    <b>₹{detail.summary.remaining}</b>
                  </div>

                  {detail.summary.remaining > 0 && (
                    <div className="pp-form">
                        <input
                        placeholder="Amount"
                        value={visitPayments[v.id]?.amount || ""}
                        onChange={e =>
                            setVisitPayments(prev => ({
                            ...prev,
                            [v.id]: {
                                amount: e.target.value,
                                mode: prev[v.id]?.mode || "CASH",
                            },
                            }))
                        }
                        />
                        <select
                        value={visitPayments[v.id]?.mode || "CASH"}
                        onChange={e =>
                            setVisitPayments(prev => ({
                            ...prev,
                            [v.id]: {
                                mode: e.target.value,
                                amount: prev[v.id]?.amount || "",
                            },
                            }))
                        }
                        >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                        </select>

                        <button
                        className="pp-btn"
                        onClick={() => addVisitPayment(v.id)}
                        >
                        Take Payment
                        </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
