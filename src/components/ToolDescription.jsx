import React from "react";

export default function ToolDescription({
  title,
  description,
  usageSteps = [],
  example,
  tips = []
}) {
  if (!title) {
    return null;
  }

  return (
    <section className="card" style={{ marginTop: "2rem" }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">{title}</h3>
          {description && <p className="card-subtitle">{description}</p>}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gap: "1.25rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
        }}
      >
        {usageSteps.length > 0 && (
          <div>
            <h4 style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>Usage Steps</h4>
            <ol style={{ paddingLeft: "1.2rem", margin: 0, color: "var(--text-secondary)" }}>
              {usageSteps.map((step) => (
                <li key={step} style={{ marginBottom: "0.35rem" }}>{step}</li>
              ))}
            </ol>
          </div>
        )}
        {tips.length > 0 && (
          <div>
            <h4 style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>Tips</h4>
            <ul style={{ paddingLeft: "1.1rem", margin: 0, color: "var(--text-secondary)" }}>
              {tips.map((tip) => (
                <li key={tip} style={{ marginBottom: "0.35rem" }}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
        {example && (
          <div
            style={{
              padding: "1rem",
              borderRadius: "var(--border-radius-sm)",
              background: "var(--bg-tertiary)"
            }}
          >
            <h4 style={{ marginBottom: "0.35rem", fontSize: "0.95rem" }}>Example</h4>
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>{example}</p>
          </div>
        )}
      </div>
    </section>
  );
}



