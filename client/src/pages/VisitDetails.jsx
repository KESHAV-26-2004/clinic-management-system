//client/src/pages/VisitDetails.jsx
import { useAuth } from "../auth/AuthContext";
import { useState } from "react";
import Prescriptions from "./Prescriptions";
import VisitBilling from "./VisitBilling";
import Payments from "./Payments";
import api from "../api/apiClient";

// client/src/pages/VisitDetails.jsx
export default function VisitDetails({ visit }) {
  const { user } = useAuth();
  const [paymentVersion, setPaymentVersion] = useState(0);

  const refreshPayments = () => {
    setPaymentVersion(v => v + 1);
  };

  if (!visit) {
    return <p className="center">Loading visit...</p>;
  }

  const isStandalone = !visit.case;

  return (
    <div className="visit-report">
      {/* ================= VISIT HEADER ================= */}
      <div className="visit-header">
        <div>
          <h2>Visit #{visit.id}</h2>
          <div className="visit-meta">
            {new Date(visit.createdAt).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </div>
        </div>

        <div className="visit-context">
          <div className="visit-context-top">
            {isStandalone ? (
              <span className="visit-badge standalone">
                Standalone Visit
              </span>
            ) : (
              <span className="visit-badge case">
                Case: {visit.case.title}
              </span>
            )}
          </div>

          {/* PRINT BUTTON */}
          {user.role !== "ADMIN" && (
            <button
              className="action-btn gray visit-print-btn"
              onClick={async () => {
                const printWindow = window.open("", "_blank");

                if (!printWindow) {
                  alert("Popup blocked. Please allow popups.");
                  return;
                }

                try {
                  const res = await api.get(
                    `/print/visit/${visit.id}`,
                    { responseType: "text" }
                  );

                  printWindow.document.open();
                  printWindow.document.write(res.data);
                  printWindow.document.close();

                } catch (err) {
                  printWindow.close();
                  alert("Unable to generate print preview");
                  console.error(err);
                }
              }}
            >
              Print Summary
            </button>
          )}
        </div>
      </div>

      {/* ================= VISIT SUMMARY ================= */}
      <div className="visit-summary compact">
        <div className="summary-row">
          <span className="label">Complaint</span>
          <span className="value">{visit.complaint || "—"}</span>
        </div>

        <div className="summary-row">
          <span className="label">Diagnosis</span>
          <span className="value">{visit.diagnosis || "—"}</span>
        </div>

        <div className="summary-row">
          <span className="label">Notes</span>
          <span className="value">{visit.notes || "—"}</span>
        </div>
      </div>

      {/* ================= PRESCRIPTIONS ================= */}
        <div className="visit-section">
          <h3>Prescriptions</h3>
          <Prescriptions visitId={visit.id} />
        </div>
      {/* ================= BILLING ================= */}
        {user.role !== "STAFF" && (
          <div className="visit-section">
            <h3>Billing</h3>
            <VisitBilling
              visit={visit}
              paymentVersion={paymentVersion}
              onBillingChange={refreshPayments}
            />
          </div>
        )}
        {/* ================= PAYMENTS ================= */}
        <div className="visit-section">
          <h3>Payments</h3>
          <Payments visitId={visit.id}
          paymentVersion={paymentVersion}
          onPaymentChange={refreshPayments} />
        </div>
    </div>
  );
}
