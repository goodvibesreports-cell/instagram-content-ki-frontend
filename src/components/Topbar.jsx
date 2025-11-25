// src/components/Topbar.jsx
import React from "react";

export default function Topbar({ theme, onToggleTheme, onLogout, userEmail }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">Dashboard</h1>
        <p className="topbar-subtitle">
          Generiere virale Reels-Prompts & Skripte basierend auf deinen
          Instagram-Posts.
        </p>
      </div>

      <div className="topbar-right">
        <button className="btn btn-ghost" onClick={onToggleTheme}>
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>

        {userEmail && (
          <span className="topbar-user">Eingeloggt als {userEmail}</span>
        )}

        <button className="btn btn-outline" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
