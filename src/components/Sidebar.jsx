// src/components/Sidebar.jsx
import React from "react";

const navItems = [
  {
    section: "Übersicht",
    items: [
      { id: "dashboard", icon: "📊", label: "Dashboard" },
      { id: "history", icon: "📜", label: "Verlauf" },
    ]
  },
  {
    section: "KI-Tools",
    items: [
      { id: "prompts", icon: "✨", label: "Prompt Generator", cost: 1 },
      { id: "scripts", icon: "🎬", label: "Script Generator", cost: 2 },
      { id: "hooks", icon: "🎣", label: "Hook Generator", cost: 1 },
      { id: "captions", icon: "📝", label: "Caption Generator", cost: 1 },
      { id: "titles", icon: "🏷️", label: "Title Generator", cost: 1 },
      { id: "trends", icon: "📈", label: "Trend Finder", cost: 3, badge: "NEU" },
      { id: "virality", icon: "🔥", label: "Virality Check", cost: 2 },
    ]
  },
  {
    section: "Einstellungen",
    items: [
      { id: "settings", icon: "⚙️", label: "Einstellungen" },
      { id: "credits", icon: "💰", label: "Credits kaufen", badge: "PRO" },
    ]
  }
];

export default function Sidebar({ isOpen, onClose, onNavigate, currentPage }) {
  return (
    <>
      {/* Overlay für Mobile */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 99,
            display: "none"
          }}
        />
      )}
      
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">🎯</div>
            <span>Content KI</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((section) => (
            <div className="nav-section" key={section.section}>
              <div className="nav-section-title">{section.section}</div>
              
              {section.items.map((item) => (
                <div
                  key={item.id}
                  className={`nav-item ${currentPage === item.id ? "active" : ""}`}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose?.();
                  }}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="nav-item-badge">{item.badge}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Instagram Content KI v2.0
          </div>
        </div>
      </aside>
    </>
  );
}
