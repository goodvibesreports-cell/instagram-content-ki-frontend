import React from "react";

export default function SummaryCards({ cards = [] }) {
  if (!cards.length) return null;

  return (
    <div className="insights-summary-grid">
      {cards.map((card) => (
        <article key={card.label} className="insights-summary-card">
          <div className="insights-summary-icon" aria-hidden="true">
            {card.icon}
          </div>
          <div className="insights-summary-content">
            <span className="metric-value">{card.value ?? "—"}</span>
            <span className="metric-label">{card.label}</span>
            {card.hint ? <span className="metric-hint">{card.hint}</span> : null}
          </div>
        </article>
      ))}
    </div>
  );
}


