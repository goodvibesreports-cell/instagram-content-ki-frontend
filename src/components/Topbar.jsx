// src/components/Topbar.jsx
import React from "react";

const pageTitles = {
  dashboard: "Dashboard",
  history: "Generierungs-Verlauf",
  prompts: "Prompt Generator",
  scripts: "Script Generator",
  hooks: "Hook Generator",
  captions: "Caption Generator",
  titles: "Title Generator",
  trends: "Trend Finder",
  virality: "Virality Analyse",
  settings: "Einstellungen",
  credits: "Credits kaufen"
};

export default function Topbar({ theme, onToggleTheme, onLogout, userEmail, credits, onMenuClick, currentPage }) {
  const initial = userEmail?.charAt(0)?.toUpperCase() || "?";
  
  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button 
          className="btn btn-ghost btn-icon"
          onClick={onMenuClick}
          style={{ display: "none" }} // Nur auf Mobile sichtbar
        >
          ☰
        </button>
        <h1 className="topbar-title">{pageTitles[currentPage] || "Dashboard"}</h1>
      </div>
      
      <div className="topbar-actions">
        {/* Credits Badge */}
        <div className="credits-badge">
          <span className="icon">⚡</span>
          <span>{credits} Credits</span>
        </div>
        
        {/* Theme Toggle */}
        <button 
          className="btn btn-ghost btn-icon"
          onClick={onToggleTheme}
          title={theme === "dark" ? "Light Mode" : "Dark Mode"}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        
        {/* User Menu */}
        <div className="user-menu" onClick={onLogout} title="Ausloggen">
          <div className="user-avatar">{initial}</div>
          <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            {userEmail?.split("@")[0]}
          </span>
        </div>
      </div>
    </header>
  );
}
