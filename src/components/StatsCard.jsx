// src/components/StatsCard.jsx
import React from "react";

export default function StatsCard({ icon, iconColor, value, label, trend }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconColor}`}>
        {icon}
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {trend && (
          <div style={{ 
            fontSize: "0.75rem", 
            color: trend.startsWith("+") ? "var(--success)" : "var(--error)",
            marginTop: "0.25rem"
          }}>
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

