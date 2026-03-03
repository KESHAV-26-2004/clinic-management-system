//client/src/pages/VisitBilling.jsx
import { useEffect, useState } from "react";
import api from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";
import { FiTrash2 } from "react-icons/fi";
import ConfirmModal from "../components/ConfirmModal";

export default function VisitBilling({ visit, paymentVersion, onBillingChange, }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { user } = useAuth();

  const readOnly =
    user.accessMode === "REMOTE" || user.role === "STAFF";

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [paid, setPaid] = useState(0);

  const [form, setForm] = useState({
    description: "",
    amount: "",
  });

  const [billingStatus, setBillingStatus] = useState(
    visit.billing_status
  );

  const isFinalized = billingStatus === "FINALIZED";

  /* ===== UI PERMISSIONS ===== */
  const canAddBilling = !readOnly && !isFinalized;
  const canDeleteBilling = !readOnly && !isFinalized && paid === 0;
  const canFinalize = !readOnly && !isFinalized;

  /* ===== LOAD DATA ===== */
  const loadBilling = async () => {
    const [billingRes, paymentRes] = await Promise.all([
        api.get(`/billing/visit/${visit.id}`),
        api.get(`/payments/visit/${visit.id}`),
    ]);

    setItems(billingRes.data.items);
    setTotal(billingRes.data.total);
    setPaid(paymentRes.data.summary.paid);

    // 🔥 THIS IS THE FIX
    setBillingStatus(billingRes.data.billing_status);
    };

  useEffect(() => {
    loadBilling();
    }, [visit.id, paymentVersion]); // 🔥 payment change triggers reload

  /* ===== ACTIONS ===== */
  const addBilling = async () => {
    if (!form.description || !form.amount) return;

    try {
        await api.post(`/billing/visit/${visit.id}`, {
        description: form.description,
        amount: Number(form.amount),
        });

        setForm({ description: "", amount: "" });

        await loadBilling();
        onBillingChange(); // 🔥 notify Payments
    } catch (err) {
        alert(err.response?.data?.error || "Cannot add billing");
    }
    };

  const removeBilling = async (id) => {
    try {
      await api.delete(`/billing/${id}`);
      await loadBilling();
      onBillingChange(); // 🔥 notify Payments
    } catch (err) {
      alert(err.response?.data?.error || "Cannot delete billing");
    }
  };

  const finalizeBilling = () => {
    if (!items.length) {
      alert("Add billing before finalizing");
      return;
    }
    setConfirmOpen(true); // just open modal
  };

  const handleConfirmFinalize = async () => {
    await api.post(`/billing/visit/${visit.id}/finalize`);
    setConfirmOpen(false);
    await loadBilling();
  };

  return (
    <div className="billing">
      {/* ===== ADD BILLING ===== */}
      {canAddBilling && (
        <div className="billing-add-form">
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) =>
              setForm({ ...form, amount: e.target.value })
            }
          />
          <button className="add-billing-btn" onClick={addBilling}>
            Add
          </button>
        </div>
      )}

      {/* ===== TABLE ===== */}
      <table className="billing-table">
        <colgroup>
          <col className="col-sno" />
          <col className="col-desc" />
          <col className="col-amount" />
          {canDeleteBilling && <col className="col-action" />}
        </colgroup>

        <thead>
          <tr>
            <th>S.No</th>
            <th>Description</th>
            <th>Amount</th>
            {canDeleteBilling && <th />}
          </tr>
        </thead>

        <tbody>
          {items.length === 0 && (
            <tr>
              <td
                colSpan={canDeleteBilling ? 4 : 3}
                className="empty"
              >
                No billing added
              </td>
            </tr>
          )}

          {items.map((b, i) => (
            <tr key={b.id}>
              <td>{i + 1}</td>
              <td>{b.description}</td>
              <td>₹{b.amount}</td>

              {canDeleteBilling && (
                <td>
                  <button
                    className="billing-remove"
                    onClick={() => removeBilling(b.id)}
                    aria-label="Delete billing item"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ===== TOTAL + FINALIZE ===== */}
      <div className="billing-footer">
        <div className="billing-total">
          <span>Total</span>
          <b>₹{total}</b>
        </div>

        {canFinalize && (
          <button
            className="action-btn teal"
            onClick={finalizeBilling}
          >
            Finalize Billing
          </button>
        )}

        {isFinalized && (
          <span className="badge">Billing Finalized</span>
        )}
      </div>
      <ConfirmModal
        open={confirmOpen}
        title="Finalize Billing"
        message="This action cannot be undone. Are you sure you want to finalize?"
        onConfirm={handleConfirmFinalize}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
