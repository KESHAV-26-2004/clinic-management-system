import { useEffect, useState } from "react";
import api from "../api/apiClient";
import "../styles/reports.css";

export default function Reports() {
  const [daily, setDaily] = useState(null);
  const [average, setAverage] = useState(null);
  const [global, setGlobal] = useState(null);
  const [caseStats, setCaseStats] = useState(null);
  const [error, setError] = useState("");
  const [revenueRange, setRevenueRange] = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  const [range, setRange] = useState({
    from: today,
    to: today,
  });

  useEffect(() => {
    loadReports();
  }, []);

  const applyRange = async () => {
    try {
      const res = await api.get("/reports/revenue", {
        params: {
          from: range.from,
          to: range.to,
        },
      });
      setRevenueRange(res.data);
    } catch (err) {
      setError("Failed to load revenue report");
    }
  };

  const loadReports = async () => {
    try {
      const [
        dailyRes,
        avgRes,
        globalRes,
        caseRes,
      ] = await Promise.all([
        api.get("/reports/daily", { params: { date: today } }),
        api.get("/reports/average"),
        api.get("/reports/global"),
        api.get("/reports/cases"),
      ]);

      setDaily(dailyRes.data);
      setAverage(avgRes.data);
      setGlobal(globalRes.data);
      setCaseStats(caseRes.data);
    } catch (err) {
      setError("Failed to load reports");
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!daily || !average || !global || !caseStats)
    return <p className="loading">Loading reports…</p>;

  return (
    <div className="reports-page">
      {/* ===== HEADER ===== */}
      <div className="reports-header">
        <h2>Clinic Reports</h2>
        <span className="reports-date">Today · {daily.date}</span>
      </div>

      {/* ===== DATE RANGE PICKER ===== */}
      <div className="canvas">
        <div className="range-picker">
          <div>
            <label>From</label>
            <input
              type="date"
              value={range.from}
              onChange={(e) =>
                setRange({ ...range, from: e.target.value })
              }
            />
          </div>

          <div>
            <label>To</label>
            <input
              type="date"
              value={range.to}
              onChange={(e) =>
                setRange({ ...range, to: e.target.value })
              }
            />
          </div>

          <button className="btn-primary" onClick={applyRange}>
            Apply
          </button>
        </div>
      </div>

      {/* ===== RANGE REVENUE RESULT ===== */}
        {revenueRange && (
          <div className="canvas">
            <div className="canvas-header">
              <span className="canvas-title">
                Revenue ({range.from} → {range.to})
              </span>
            </div>

            <div className="stats-grid three">
              <StatCard
                label="Billed"
                value={`₹${revenueRange.totalBilled}`}
              />
              <StatCard
                label="Paid"
                value={`₹${revenueRange.paid}`}
                tone="success"
              />
              <StatCard
                label="Pending"
                value={`₹${revenueRange.pending}`}
                tone="warning"
              />
            </div>
          </div>
        )}

      {/* ===== TODAY vs AVERAGE ===== */}
      <div className="canvas">
        <div className="canvas-header">
          <span className="canvas-title">
            Today vs Daily Average
          </span>
        </div>

        <div className="stats-grid four">
          <CompareCard
            label="Patients"
            today={daily.patients}
            avg={average.patients}
          />
          <CompareCard
            label="Visits"
            today={daily.visits}
            avg={average.visits}
          />
          <CompareCard
            label="New Cases"
            today={daily.newCases}
            avg={average.newCases}
          />
          <CompareCard
            label="Revenue Paid"
            today={daily.revenue.paid}
            avg={average.revenuePaid}
            currency
          />
        </div>
      </div>

      {/* ===== REVENUE BREAKDOWN ===== */}
        <div className="canvas">
          <div className="canvas-header">
            <span className="canvas-title">Revenue Breakdown</span>
          </div>

          <div className="stats-grid four">
            <StatCard
              label="Paid Today"
              value={`₹${daily.revenue.paid}`}
              tone="success"
            />

            <StatCard
              label="Pending Today"
              value={`₹${daily.revenue.pending}`}
              tone="warning"
            />

            <StatCard
              label="Total Collected"
              value={`₹${global.revenue_paid}`}
              tone="success"
            />

            <StatCard
              label="Total Billed"
              value={`₹${global.revenue_billed}`}
            />
          </div>
        </div>

      {/* ===== TOTALS ===== */}
      <div className="canvas">
        <div className="canvas-header">
          <span className="canvas-title">
            Clinic Totals (All Time)
          </span>
        </div>

        <div className="stats-grid four">
          <StatCard label="Days Active" value={global.days} />
          <StatCard label="Total Patients" value={global.patients} />
          <StatCard label="Total Visits" value={global.visits} />
          <StatCard
            label="Total Revenue"
            value={`₹${global.revenue_paid}`}
            tone="success"
          />
        </div>
      </div>

      {/* ===== CLINIC HEALTH ===== */}
      <div className="canvas">
        <div className="canvas-header">
          <span className="canvas-title">Clinic Health</span>
        </div>

        <div className="stats-grid three">
          <StatCard label="Open Cases" value={caseStats.open} />
          <StatCard label="Closed Cases" value={caseStats.closed} />
          <StatCard
            label="Avg Visits / Case"
            value={caseStats.avgVisitsPerCase}
          />
        </div>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function StatCard({ label, value, tone }) {
  return (
    <div className={`stat-card ${tone || ""}`}>
      <span className="stat-label">{label}</span>
      <b className="stat-value">{value}</b>
    </div>
  );
}

function CompareCard({ label, today, avg, currency }) {
  const diff = today - avg;
  const positive = diff >= 0;

  return (
    <div className="stat-card compare">
      <span className="stat-label">{label}</span>

      <b className="stat-value">
        {currency ? "₹" : ""}
        {today}
      </b>

      <span className={`delta ${positive ? "up" : "down"}`}>
        {positive ? "▲" : "▼"}{" "}
        {Math.abs(diff).toFixed(1)} vs avg
      </span>
    </div>
  );
}
