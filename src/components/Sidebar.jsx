// src/components/Sidebar.jsx
import React from "react";
import creatorOSBranding from "../constants/creatorOSBranding.js";

const navItems = [
  {
    section: "Mission Control",
    items: [
      { id: "dashboard", icon: "🚀", label: "Mission Control" },
      { id: "insights", icon: "🎥", label: "Creator Insights" },
      { id: "calendar", icon: "📅", label: "Operating Calendar" },
      { id: "history", icon: "📜", label: "History Log" }
    ]
  },
  {
    section: "AI Studio",
    items: [
      { id: "batch", icon: "⚡", label: "Batch Generator", badge: "PRO" },
      { id: "prompts", icon: "✨", label: "Prompt Generator" },
      { id: "scripts", icon: "🎬", label: "Script Generator" },
      { id: "hooks", icon: "🎣", label: "Hook Generator" },
      { id: "captions", icon: "📝", label: "Caption Generator" },
      { id: "titles", icon: "🏷️", label: "Title Generator" },
      { id: "trends", icon: "📈", label: "Trend Finder" },
      { id: "virality", icon: "🔥", label: "Virality Check" }
    ]
  },
  {
    section: "Operations",
    items: [
      { id: "dna", icon: "🧬", label: "Creator DNA Wizard" },
      { id: "team", icon: "👥", label: "Team Workspace" },
      { id: "style", icon: "🎨", label: "AI Assistant" },
      { id: "settings", icon: "⚙️", label: "Settings" },
      { id: "credits", icon: "💳", label: "Credits & Plans" }
    ]
  }
];

export default function Sidebar({ isOpen, onClose, onNavigate, currentPage }) {
  return (
    <>
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 99
          }}
        />
      )}
      
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">{creatorOSBranding.shortName}</div>
            <div>
              <span className="sidebar-logo-text">{creatorOSBranding.name}</span>
              <small>{creatorOSBranding.tagline}</small>
            </div>
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
            CreatorOS · Operating System for Modern Creators
          </div>
        </div>
      </aside>
    </>
  );
}
