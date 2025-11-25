// src/components/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">🎥</span>
        <span className="sidebar-logo-text">IG Content KI</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            "sidebar-link" + (isActive ? " sidebar-link--active" : "")
          }
        >
          Dashboard
        </NavLink>
        {/* Platz für weitere Menüpunkte: History, Credits, Settings etc. */}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-footer-text">v1.0 • SaaS Mode</span>
      </div>
    </aside>
  );
}
