//client/src/pages/Payments.jsx
import { useEffect, useState } from "react";
import api from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";

export default function Payments({ visitId, paymentVersion, onPaymentChange }) {
  const { user } = useAuth();

  const readOnly = user.accessMode === "REMOTE";

  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);

  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("CASH");

  const loadPayments = async () => {
  try {
    const res = await api.get(`/payments/visit/${visitId}`);
    setPayments(res.data.payments);
    setSummary(res.data.summary);
  } catch (err) {
    console.error("Payment load error:", err);
    setSummary({
      total: 0,
      paid: 0,
      remaining: 0,
      status: "ERROR",
    });
  }
};


  useEffect(() => {
    loadPayments();
  }, [visitId, paymentVersion]);

  const addPayment = async () => {
    if (!amount) return;

    try {
      await api.post("/payments", {
        visitId,
        amount: Number(amount),
        mode,
      });

      setAmount("");
      await loadPayments();

      onPaymentChange(); // 🔥 notify billing
    } catch (err) {
      alert(err.response?.data?.error || "Payment failed");
    }
  };


  if (!summary) return <p>Loading payments...</p>;

  return (
    <div className="payments">
      {/* ===== SUMMARY ===== */}
      <div className="payment-summary">
        <div className="summary-card">
          <span>Total</span>
          <b>₹{summary.total}</b>
        </div>

        <div className="summary-card">
          <span>Paid</span>
          <b>₹{summary.paid}</b>
        </div>

        <div className="summary-card">
          <span>Remaining</span>
          <b>₹{summary.remaining}</b>
        </div>

        <div className={`summary-card status ${summary.status.toLowerCase()}`}>
          <span>Status</span>
          <b>{summary.status}</b>
        </div>
      </div>

      {/* ===== ADD PAYMENT ===== */}
      {!readOnly && summary.remaining > 0 && (
        <div className="payment-add-form">
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
          </select>

          <button className="add-payment-btn" onClick={addPayment}>
            Add
          </button>
        </div>
      )}

      {/* ===== TABLE ===== */}
      <table className="payment-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Amount</th>
            <th>Mode</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {payments.length === 0 && (
            <tr>
              <td colSpan="4" className="empty">
                No payments recorded
              </td>
            </tr>
          )}

          {payments.map((p, i) => (
            <tr key={p.id}>
              <td>{i + 1}</td>
              <td>₹{p.amount}</td>
              <td>{p.mode}</td>
              <td>{new Date(p.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
