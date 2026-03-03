//client/src/pages/VisitHistory.jsx
import { useMemo, useState } from "react";
import { FiChevronRight } from "react-icons/fi";

function formatDateTime(value) {
  const d = new Date(value);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function VisitHistory({ visits, onSelect, openCases, setOpenCases, standaloneOpen, setStandaloneOpen, }) {
  const [standaloneLimit, setStandaloneLimit] = useState(3);

  /* ---------------- SPLIT DATA ---------------- */
  const { caseGroups, standaloneVisits } = useMemo(() => {
    const caseMap = {};
    const standalone = [];

    visits.forEach(v => {
      if (!v.case?.id) {
        standalone.push(v);
        return;
      }

      const id = v.case.id;

      if (!caseMap[id]) {
        caseMap[id] = {
          caseId: id,
          caseTitle: v.case.title,
          visits: [],
          latest: v.createdAt,
        };
      }

      caseMap[id].visits.push(v);

      if (new Date(v.createdAt) > new Date(caseMap[id].latest)) {
        caseMap[id].latest = v.createdAt;
      }
    });

    // sort visits inside each case
    Object.values(caseMap).forEach(group =>
      group.visits.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )
    );

    // sort cases by latest activity
    const cases = Object.values(caseMap).sort(
      (a, b) => new Date(b.latest) - new Date(a.latest)
    );

    // sort standalone visits
    standalone.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return { caseGroups: cases, standaloneVisits: standalone };
  }, [visits]);

  const toggleCase = (id) => {
    setOpenCases(prev => {
      const next = { ...prev, [id]: !prev[id] };
      return next;
    });
  };

  const toggleStandalone = () => {
    setStandaloneOpen(!standaloneOpen);
  };

  const loadMoreStandalone = () => {
    setStandaloneLimit(prev => prev + 5);
  };

  return (
    <div className="history">
      <h3>Visit History</h3>

      {/* ================= STANDALONE (PINNED) ================= */}
      {standaloneVisits.length > 0 && (
        <div className="history-case-card">
          <div
            className="history-case-header"
            onClick={toggleStandalone}
          >
            <div className="history-case-left">
              <FiChevronRight
                className={`history-arrow ${
                  standaloneOpen ? "open" : ""
                }`}
              />
              <span className="history-case-title">
                Standalone Visits
              </span>
            </div>
          </div>

          {standaloneOpen && (
            <>
              <div className="history-visits">
                {standaloneVisits
                  .slice(0, standaloneLimit)
                  .map(v => (
                    <div
                      key={v.id}
                      className="history-visit-card"
                      onClick={() => onSelect(v)}
                    >
                      <div>
                        <strong>Visit #{v.id}</strong>
                        <span className="history-sub">
                          — Standalone
                        </span>
                      </div>
                      <span className="history-time">
                        {formatDateTime(v.createdAt)}
                      </span>
                    </div>
                  ))}
              </div>

              {standaloneVisits.length > standaloneLimit && (
                <button
                  className="history-load-more"
                  onClick={loadMoreStandalone}
                >
                  Load more
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ================= CASES ================= */}
      {caseGroups.map(group => {
        const isOpen = openCases[group.caseId];

        return (
          <div
            key={group.caseId}
            className="history-case-card"
          >
            <div
              className="history-case-header"
              onClick={() => toggleCase(group.caseId)}
            >
              <div className="history-case-left">
                <FiChevronRight
                  className={`history-arrow ${
                    isOpen ? "open" : ""
                  }`}
                />
                <div>
                  <span className="history-case-title">
                    Case #{group.caseId}
                  </span>
                  {group.caseTitle && (
                    <div className="history-case-name">
                      {group.caseTitle}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isOpen && (
              <div className="history-visits">
                {group.visits.map(v => (
                  <div
                    key={v.id}
                    className="history-visit-card"
                    onClick={() => onSelect(v)}
                  >
                    <strong>Visit #{v.id}</strong>
                    <span className="history-time">
                      {formatDateTime(v.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
