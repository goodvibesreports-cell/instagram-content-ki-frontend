import React from "react";

export default function MomentumMap({ entries }) {
  if (!entries?.length) {
    return <p style={{ color: "var(--text-muted)" }}>Noch keine Performance-Daten. Trage Ergebnisse bei einer Episode ein.</p>;
  }

  return (
    <div className="momentum-map">
      {entries.map((entry) => (
        <div key={entry.episodeId} className="momentum-card">
          <div>
            <strong>{entry.title}</strong>
            <p className="muted">Score: {entry.score}/100</p>
          </div>
          <div className="momentum-metrics">
            <span>👁️ {entry.views}</span>
            <span>❤️ {entry.likes}</span>
            <span>💬 {entry.comments}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

