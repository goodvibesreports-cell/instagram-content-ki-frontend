// src/components/Topbar.jsx
import React from "react";
import creatorOSBranding from "../constants/creatorOSBranding.js";

const pageTitles = {
  dashboard: "Mission Control",
  calendar: "Operating Calendar",
  history: "Creation History",
  batch: "Batch Generator",
  prompts: "Prompt Generator",
  scripts: "Script Generator",
  hooks: "Hook Generator",
  captions: "Caption Generator",
  titles: "Title Generator",
  trends: "Trend Finder",
  virality: "Virality Check",
  team: "Team Workspace",
  style: "AI Assistant",
  settings: "Settings",
  credits: "Credits & Plans",
  insights: "Creator Insights",
  dna: "Creator DNA Wizard"
};

const pageDescriptions = {
  dashboard: "Überblick über Uploads, AI-Tools und Mission-KPIs.",
  calendar: "Plane Content-Releases und tracke Status in Echtzeit.",
  insights: "Analysiere TikTok-Exports und Creator DNA Findings.",
  batch: "Erzeuge Prompts, Hooks und Captions im Paketlauf.",
  prompts: "AI-Prompts für TikTok, IG & Shorts Teams.",
  scripts: "Strukturierte Video-Skripte basierend auf deiner Creator DNA.",
  hooks: "Scroll-stoppende Hooks für deine nächsten Clips.",
  captions: "Platform-ready Captions inkl. Hashtags.",
  titles: "Klickstarke Titel für Reels, Shorts & TikToks.",
  trends: "Trend Signals aus deiner Nische.",
  virality: "Bewerte Ideen anhand eines CreatorOS Virality Scores.",
  team: "Füge Mitglieder hinzu, verteile Rollen, arbeite synchron.",
  style: "Passe deinen KI-Assistenten an deinen Tone of Voice an.",
  settings: "Organisation, Integrationen & Security auf einen Blick."
};

export default function Topbar({ onLogout, userEmail, credits, onMenuClick, currentPage }) {
  const initial = userEmail?.charAt(0)?.toUpperCase() || "?";
  const title = pageTitles[currentPage] || "Mission Control";
  const description = pageDescriptions[currentPage] || creatorOSBranding.tagline;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button 
          className="btn btn-ghost btn-icon mobile-menu-btn"
          onClick={onMenuClick}
        >
          ☰
        </button>
        <div className="topbar-page-meta">
          <div className="brand-pill">{creatorOSBranding.shortName}</div>
          <div>
            <h1 className="topbar-title">{title}</h1>
            <p className="topbar-description">{description}</p>
          </div>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="credits-badge">
          <span className="icon">⚡</span>
          <span>{credits} Credits</span>
        </div>
        <div className="user-menu" onClick={onLogout} title="Ausloggen">
          <div className="user-avatar">{initial}</div>
          <div className="user-meta">
            <span className="user-name">{userEmail?.split("@")[0]}</span>
            <span className="user-role">CreatorOS</span>
          </div>
        </div>
      </div>
    </header>
  );
}
