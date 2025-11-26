// src/components/Topbar.jsx
import React from "react";

const pageTitles = {
  dashboard: "Dashboard",
  calendar: "Content Kalender",
  history: "Generierungs-Verlauf",
  batch: "Batch Generator",
  prompts: "Prompt Generator",
  scripts: "Script Generator",
  hooks: "Hook Generator",
  captions: "Caption Generator",
  titles: "Title Generator",
  trends: "Trend Finder",
  virality: "Virality Analyse",
  team: "Team Management",
  style: "KI-Assistent",
  settings: "Einstellungen",
  credits: "Credits kaufen"
};

export default function Topbar({ theme, onToggleTheme, onLogout, userEmail, credits, onMenuClick, currentPage }) {
  const initial = userEmail?.charAt(0)?.toUpperCase() || "?";
  
  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button 
          className="btn btn-ghost btn-icon mobile-menu-btn"
          onClick={onMenuClick}
          style={{ display: "none" }}
        >
          ☰
        </button>
        <h1 className="topbar-title">{pageTitles[currentPage] || "Dashboard"}</h1>
      </div>
      
      <div className="topbar-actions">
        <div className="credits-badge">
          <span className="icon">⚡</span>
          <span>{credits} Credits</span>
        </div>
        
        <button 
          className="btn btn-ghost btn-icon"
          onClick={onToggleTheme}
          title={theme === "dark" ? "Light Mode" : "Dark Mode"}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        
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
