// src/pages/Dashboard.jsx - v3.0
import React, { useState, useEffect, useMemo } from "react";
import StatsCard from "../components/StatsCard.jsx";
import UploadZone from "../components/UploadZone.jsx";
import GeneratorTool from "../components/GeneratorTool.jsx";
import {
  getProfile,
  getHistory,
  generatePrompts,
  generateVideoIdeas,
  generateHooks,
  generateCaptions,
  generateTitles,
  analyzeTrends,
  analyzeVirality,
  generateBatch,
  getCalendarEntries,
  createCalendarEntry,
  deleteCalendarEntry,
  getOrganization,
  createOrganization,
  inviteTeamMember,
  updateContentStyle,
  LANGUAGES
} from "../api";

// Tool Configurations
const TOOLS = {
  prompts: {
    title: "Prompt Generator",
    description: "Generiere virale Instagram Reel Prompts",
    icon: "✨",
    cost: 1,
    fields: [
      { id: "category", label: "Kategorie", type: "text", placeholder: "z.B. Fitness, Food, Travel..." },
      { id: "variantsPerPost", label: "Varianten", type: "number", min: 1, max: 10, default: 3 },
      { id: "style", label: "Stil", type: "select", default: "viral", options: [
        { value: "viral", label: "Viral" },
        { value: "educational", label: "Educational" },
        { value: "entertaining", label: "Entertaining" },
        { value: "inspirational", label: "Inspirational" }
      ]},
      { id: "language", label: "Sprache", type: "select", default: "de", options: Object.entries(LANGUAGES).map(([v, l]) => ({ value: v, label: l })) }
    ]
  },
  scripts: {
    title: "Script Generator", description: "Erstelle detaillierte Video-Skripte", icon: "🎬", cost: 2,
    fields: [{ id: "prompt", label: "Prompt / Thema", type: "textarea", placeholder: "Beschreibe deine Video-Idee...", required: true }]
  },
  hooks: {
    title: "Hook Generator", description: "Scroll-stoppende Hooks", icon: "🎣", cost: 1,
    fields: [
      { id: "topic", label: "Thema", type: "text", placeholder: "Worüber ist dein Video?", required: true },
      { id: "count", label: "Anzahl", type: "number", min: 1, max: 20, default: 10 },
      { id: "style", label: "Stil", type: "select", default: "mixed", options: [
        { value: "mixed", label: "Gemischt" }, { value: "question", label: "Fragen" },
        { value: "statement", label: "Statements" }, { value: "shocking", label: "Shocking" }
      ]}
    ]
  },
  captions: {
    title: "Caption Generator", description: "Instagram Captions mit Hashtags", icon: "📝", cost: 1,
    fields: [
      { id: "topic", label: "Thema", type: "text", placeholder: "Worum geht es?", required: true },
      { id: "tone", label: "Ton", type: "select", default: "casual", options: [
        { value: "casual", label: "Locker" }, { value: "professional", label: "Professionell" },
        { value: "funny", label: "Lustig" }, { value: "inspirational", label: "Inspirierend" }
      ]},
      { id: "count", label: "Anzahl", type: "number", min: 1, max: 10, default: 3 }
    ]
  },
  titles: {
    title: "Title Generator", description: "Klickstarke Reel-Titel", icon: "🏷️", cost: 1,
    fields: [
      { id: "topic", label: "Thema", type: "text", placeholder: "Video-Thema...", required: true },
      { id: "style", label: "Stil", type: "select", default: "clickbait", options: [
        { value: "clickbait", label: "Clickbait" }, { value: "informative", label: "Informativ" },
        { value: "question", label: "Frage" }, { value: "how-to", label: "How-To" }
      ]},
      { id: "count", label: "Anzahl", type: "number", min: 1, max: 10, default: 5 }
    ]
  },
  trends: {
    title: "Trend Finder", description: "Aktuelle Trends in deiner Nische", icon: "📈", cost: 3,
    fields: [
      { id: "niche", label: "Nische", type: "text", placeholder: "z.B. Fitness, Kochen...", required: true },
      { id: "platform", label: "Plattform", type: "select", default: "instagram", options: [
        { value: "instagram", label: "Instagram" }, { value: "tiktok", label: "TikTok" },
        { value: "youtube", label: "YouTube" }, { value: "all", label: "Alle" }
      ]},
      { id: "timeframe", label: "Zeitraum", type: "select", default: "week", options: [
        { value: "today", label: "Heute" }, { value: "week", label: "Diese Woche" }, { value: "month", label: "Dieser Monat" }
      ]}
    ]
  },
  virality: {
    title: "Virality Analyse", description: "Virales Potenzial analysieren", icon: "🔥", cost: 2,
    fields: [
      { id: "content", label: "Content", type: "textarea", placeholder: "Füge deinen Hook, Caption oder Script ein...", required: true },
      { id: "type", label: "Typ", type: "select", default: "full", options: [
        { value: "hook", label: "Hook" }, { value: "caption", label: "Caption" },
        { value: "script", label: "Script" }, { value: "full", label: "Vollständig" }
      ]}
    ]
  }
};

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const PLATFORM_EMOJI = {
  instagram: "📸",
  tiktok: "🎵",
  youtube: "▶️",
  linkedin: "💼",
  pinterest: "📌",
  custom: "📝"
};
const STATUS_LABELS = {
  scheduled: "Geplant",
  draft: "Entwurf",
  published: "Veröffentlicht",
  completed: "Fertig"
};
const STATUS_COLORS = {
  scheduled: "#6366f1",
  draft: "#fbbf24",
  published: "#10b981",
  completed: "#14b8a6"
};
const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "custom", label: "Custom" }
];

function formatInputDate(date) {
  return date.toLocaleDateString("en-CA");
}

function toDateKey(date) {
  return date.toLocaleDateString("en-CA");
}

function formatReadableDate(date) {
  return date.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });
}

export default function Dashboard({ token, userEmail, currentPage, onCreditsUpdate, onNavigate }) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ prompts: 0, scripts: 0, uploads: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  
  // Batch State
  const [batchResult, setBatchResult] = useState(null);
  
  // Calendar State
  const [calendarEntries, setCalendarEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [activeDay, setActiveDay] = useState(new Date());
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState(null);
  const [calendarMessage, setCalendarMessage] = useState(null);
  const [calendarSaving, setCalendarSaving] = useState(false);
  const [calendarForm, setCalendarForm] = useState(() => ({
    title: "",
    content: "",
    platform: "instagram",
    scheduledDate: formatInputDate(new Date()),
    scheduledTime: "12:00",
    color: "#6366f1"
  }));
  const entriesByDate = useMemo(() => {
    const map = {};
    for (const entry of calendarEntries) {
      const key = toDateKey(new Date(entry.scheduledFor));
      if (!map[key]) map[key] = [];
      map[key].push(entry);
    }
    return map;
  }, [calendarEntries]);
  const upcomingEntries = useMemo(() => {
    const now = new Date();
    return [...calendarEntries]
      .filter(entry => new Date(entry.scheduledFor) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
      .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))
      .slice(0, 5);
  }, [calendarEntries]);
  
  // Team State
  const [organization, setOrganization] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  
  // Style State
  const [styleForm, setStyleForm] = useState({});
  
  // Load data
  useEffect(() => {
    async function loadData() {
      if (!token) return;
      
      const profileRes = await getProfile(token);
      if (profileRes.success) {
        setProfile(profileRes.data.user);
        setStats({
          prompts: profileRes.data.user.usage?.promptsGenerated || 0,
          scripts: profileRes.data.user.usage?.scriptsGenerated || 0,
          uploads: profileRes.data.user.usage?.uploadsCount || 0
        });
        setStyleForm(profileRes.data.user.contentStyle || {});
        onCreditsUpdate?.(profileRes.data.user.totalCredits);
      }
      
      const historyRes = await getHistory(token, { limit: 5 });
      if (historyRes.success) setHistory(historyRes.data.history);
      
      const orgRes = await getOrganization(token);
      if (orgRes.success) setOrganization(orgRes.data.organization);
    }
    loadData();
  }, [token]);

  useEffect(() => {
    setResult(null);
    setError(null);
    setBatchResult(null);
  }, [currentPage]);
  
  useEffect(() => {
    if (currentPage !== "calendar" || !token) return;
    loadCalendarEntries(selectedDate);
  }, [currentPage, selectedDate, token]);
  
  useEffect(() => {
    setActiveDay(prev => {
      if (
        prev.getFullYear() === selectedDate.getFullYear() &&
        prev.getMonth() === selectedDate.getMonth()
      ) {
        return prev;
      }
      return new Date(selectedDate);
    });
    setCalendarForm(form => ({ ...form, scheduledDate: formatInputDate(selectedDate) }));
  }, [selectedDate]);

  // Generate Handler
  async function handleGenerate(formData) {
    setIsLoading(true); setError(null); setResult(null);
    try {
      let response;
      switch (currentPage) {
        case "prompts": response = await generatePrompts(token, formData); break;
        case "scripts": response = await generateVideoIdeas([formData.prompt], token, true); break;
        case "hooks": response = await generateHooks(formData.topic, token, formData); break;
        case "captions": response = await generateCaptions(formData.topic, token, formData); break;
        case "titles": response = await generateTitles(formData.topic, token, formData); break;
        case "trends": response = await analyzeTrends(formData.niche, token, formData); break;
        case "virality": response = await analyzeVirality(formData.content, token, formData.type); break;
        default: return;
      }
      if (response.success) {
        let content = response.data.prompts?.[0] || response.data.videoIdeas?.[0]?.idea ||
          response.data.hooks || response.data.captions || response.data.titles || response.data.analysis;
        setResult(content);
        const profileRes = await getProfile(token);
        if (profileRes.success) onCreditsUpdate?.(profileRes.data.user.totalCredits);
      } else {
        setError(response.error?.message || "Fehler");
      }
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  }

  // Batch Handler
  async function handleBatchGenerate(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    setIsLoading(true); setError(null);
    const res = await generateBatch(token, {
      topic: formData.get("topic"),
      niche: formData.get("niche"),
      language: formData.get("language") || "de"
    });
    setIsLoading(false);
    if (res.success) {
      setBatchResult(res.data);
      const profileRes = await getProfile(token);
      if (profileRes.success) onCreditsUpdate?.(profileRes.data.user.totalCredits);
    } else { setError(res.error?.message); }
  }
  
  async function loadCalendarEntries(targetDate = selectedDate) {
    if (!token) return;
    setCalendarLoading(true);
    setCalendarError(null);
    try {
      const ref = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const start = new Date(ref);
      const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
      const res = await getCalendarEntries(token, start.toISOString(), end.toISOString());
      if (res.success) {
        setCalendarEntries(res.data.entries);
      } else {
        setCalendarError(res.error?.message || "Kalender konnte nicht geladen werden");
      }
    } catch (err) {
      setCalendarError(err.message || "Kalender konnte nicht geladen werden");
    } finally {
      setCalendarLoading(false);
    }
  }
  
  function handleMonthChange(direction) {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  }
  
  function handleDayClick(dayDate) {
    setActiveDay(dayDate);
    setCalendarForm(form => ({ ...form, scheduledDate: formatInputDate(dayDate) }));
  }
  
  async function handleCreateCalendarEntry(e) {
    e.preventDefault();
    if (!calendarForm.title.trim() || !calendarForm.content.trim()) {
      setCalendarError("Titel und Content sind erforderlich");
      return;
    }
    setCalendarSaving(true);
    setCalendarError(null);
    setCalendarMessage(null);
    try {
      const payload = {
        title: calendarForm.title.trim(),
        content: calendarForm.content.trim(),
        platform: calendarForm.platform,
        scheduledFor: calendarForm.scheduledDate,
        scheduledTime: calendarForm.scheduledTime,
        color: calendarForm.color
      };
      const res = await createCalendarEntry(token, payload);
      if (res.success) {
        const entryDate = new Date(res.data.entry.scheduledFor);
        setCalendarForm(form => ({
          ...form,
          title: "",
          content: "",
          scheduledDate: formatInputDate(entryDate)
        }));
        setActiveDay(entryDate);
        const sameMonth = entryDate.getFullYear() === selectedDate.getFullYear() &&
          entryDate.getMonth() === selectedDate.getMonth();
        if (!sameMonth) {
          setSelectedDate(new Date(entryDate.getFullYear(), entryDate.getMonth(), 1));
        }
        await loadCalendarEntries(entryDate);
        setCalendarMessage("Eintrag gespeichert");
        setTimeout(() => setCalendarMessage(null), 4000);
      } else {
        setCalendarError(res.error?.message || "Eintrag konnte nicht erstellt werden");
      }
    } catch (err) {
      setCalendarError(err.message || "Eintrag konnte nicht erstellt werden");
    } finally {
      setCalendarSaving(false);
    }
  }
  
  async function handleDeleteEntry(entryId) {
    const confirmed = window.confirm("Eintrag wirklich löschen?");
    if (!confirmed) return;
    try {
      const res = await deleteCalendarEntry(token, entryId);
      if (res.success) {
        setCalendarEntries(prev => prev.filter(entry => entry._id !== entryId));
        setCalendarMessage("Eintrag gelöscht");
        setTimeout(() => setCalendarMessage(null), 3000);
      } else {
        setCalendarError(res.error?.message || "Löschen fehlgeschlagen");
      }
    } catch (err) {
      setCalendarError(err.message || "Löschen fehlgeschlagen");
    }
  }

  // ======== RENDER PAGES ========

  // Dashboard Overview
  if (currentPage === "dashboard") {
    return (
      <div>
        <div className="stats-grid">
          <StatsCard icon="✨" iconColor="purple" value={stats.prompts} label="Prompts generiert" />
          <StatsCard icon="🎬" iconColor="blue" value={stats.scripts} label="Scripts erstellt" />
          <StatsCard icon="📁" iconColor="green" value={stats.uploads} label="Uploads" />
          <StatsCard icon="⚡" iconColor="orange" value={profile?.totalCredits || 0} label="Credits" />
        </div>
        <div className="card" style={{ marginBottom: "2rem" }}>
          <div className="card-header"><h2 className="card-title">📤 Posts hochladen</h2></div>
          <UploadZone token={token} onUploadSuccess={() => setStats(p => ({ ...p, uploads: p.uploads + 1 }))} />
        </div>
        <h2 style={{ marginBottom: "1rem" }}>🚀 Schnellzugriff</h2>
        <div className="tools-grid">
          {[
            { id: "batch", icon: "⚡", title: "Batch Generator", desc: "10 Prompts + 10 Hooks + 10 Captions", cost: 5 },
            ...Object.entries(TOOLS).slice(0, 3).map(([k, t]) => ({ id: k, ...t, desc: t.description }))
          ].map(t => (
            <div
              key={t.id}
              className="tool-card"
              onClick={() => onNavigate?.(t.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") onNavigate?.(t.id);
              }}
            >
              <div className="tool-icon">{t.icon}</div>
              <h3 className="tool-title">{t.title}</h3>
              <p className="tool-description">{t.desc}</p>
              <div className="tool-cost">⚡ {t.cost} Credits</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Batch Generator
  if (currentPage === "batch") {
  return (
      <div className="card">
        <div className="card-header">
          <div><h2 className="card-title">⚡ Batch Generator</h2><p className="card-subtitle">10 Prompts + 10 Hooks + 10 Captions auf einmal</p></div>
          <div className="tool-cost">⚡ 5 Credits</div>
        </div>
        <form onSubmit={handleBatchGenerate}>
          <div className="form-group">
            <label className="form-label">Thema *</label>
            <input name="topic" className="form-input" placeholder="z.B. Fitness Motivation" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nische</label>
              <input name="niche" className="form-input" placeholder="z.B. Fitness, Food..." />
            </div>
            <div className="form-group">
              <label className="form-label">Sprache</label>
              <select name="language" className="form-select" defaultValue="de">
                {Object.entries(LANGUAGES).slice(0, 7).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ width: "100%" }}>
            {isLoading ? "Generiere 30 Inhalte..." : "⚡ Batch generieren"}
          </button>
        </form>
        {error && <div className="status-message error" style={{ marginTop: "1rem" }}>{error}</div>}
        {batchResult && (
          <div style={{ marginTop: "2rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>✅ Ergebnis</h3>
            {["prompts", "hooks", "captions"].map(type => (
              <div key={type} style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ marginBottom: "0.5rem", textTransform: "capitalize" }}>📌 {type === "prompts" ? "10 Prompts" : type === "hooks" ? "10 Hooks" : "10 Captions"}</h4>
                <div className="generated-content">
                  <pre className="generated-text">{batchResult[type]?.join("\n\n") || "Keine Ergebnisse"}</pre>
          </div>
        </div>
            ))}
        </div>
        )}
        </div>
    );
  }

  // Calendar
  if (currentPage === "calendar") {
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
    const startOffset = (monthStart.getDay() + 6) % 7; // Montag als Wochenstart
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    const todayKey = toDateKey(new Date());
    const activeDayKey = toDateKey(activeDay);
    const activeEntries = entriesByDate[activeDayKey] || [];
    const monthLabel = selectedDate.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
    const scheduledCount = calendarEntries.filter(entry => entry.status === "scheduled").length;
    const publishedCount = calendarEntries.filter(entry => entry.status === "published").length;
    const draftCount = calendarEntries.filter(entry => entry.status === "draft").length;
    
    return (
      <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", alignItems: "start" }}>
        <div className="card">
          <div className="card-header" style={{ alignItems: "center" }}>
            <div>
              <h2 className="card-title">📅 Content Kalender</h2>
              <p className="card-subtitle">Plane deine Posts und behalte Deadlines im Blick</p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" className="btn btn-secondary" onClick={() => handleMonthChange(-1)} aria-label="Vorheriger Monat">←</button>
              <button type="button" className="btn btn-secondary" onClick={() => handleMonthChange(1)} aria-label="Nächster Monat">→</button>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div style={{ fontWeight: 600, fontSize: "1.125rem", textTransform: "capitalize" }}>{monthLabel}</div>
            {calendarLoading && <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Aktualisiere…</span>}
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            {[
              { label: "Geplant", value: scheduledCount, color: STATUS_COLORS.scheduled },
              { label: "Veröffentlicht", value: publishedCount, color: STATUS_COLORS.published },
              { label: "Entwürfe", value: draftCount, color: STATUS_COLORS.draft }
            ].map(stat => (
              <div key={stat.label} style={{
                padding: "0.6rem 0.85rem",
                borderRadius: "var(--border-radius-sm)",
                background: "var(--bg-tertiary)",
                border: `1px solid ${stat.color}33`,
                minWidth: "110px"
              }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{stat.label}</span>
                <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>{stat.value}</div>
              </div>
            ))}
          </div>
          {calendarError && (
            <div className="status-message error" style={{ marginBottom: "1rem" }}>{calendarError}</div>
          )}
          {calendarMessage && (
            <div className="status-message success" style={{ marginBottom: "1rem" }}>{calendarMessage}</div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "0.5rem", marginBottom: "0.75rem" }}>
            {WEEKDAYS.map(day => (
              <div key={day} style={{ textAlign: "center", fontWeight: 600, color: "var(--text-muted)", fontSize: "0.85rem" }}>{day}</div>
            ))}
            {Array.from({ length: totalCells }, (_, index) => {
              const dayNumber = index - startOffset + 1;
              if (dayNumber < 1 || dayNumber > daysInMonth) {
                return <div key={`empty-${index}`} style={{ padding: "1rem" }} />;
              }
              const dayDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), dayNumber);
              const dateKey = toDateKey(dayDate);
              const dayEntries = entriesByDate[dateKey] || [];
              const isToday = dateKey === todayKey;
              const isActive = dateKey === activeDayKey;
              
              return (
                <div
                  key={dateKey}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleDayClick(dayDate)}
                  onKeyDown={e => { if (e.key === "Enter") handleDayClick(dayDate); }}
                  style={{
                    padding: "0.85rem",
                    borderRadius: "var(--border-radius-sm)",
                    background: isActive ? "rgba(99,102,241,0.15)" : "var(--bg-tertiary)",
                    border: isToday ? "1px solid var(--accent)" : "1px solid transparent",
                    cursor: "pointer",
                    minHeight: "95px",
                    display: "flex",
                    flexDirection: "column",
                    outline: "none"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: 600 }}>
                    <span>{dayNumber}</span>
                    {dayEntries.length > 0 && (
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{dayEntries.length}</span>
                    )}
                  </div>
                  <div style={{ marginTop: "0.35rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    {dayEntries.slice(0, 2).map(entry => (
                      <span
                        key={entry._id}
                        style={{
                          fontSize: "0.7rem",
                          padding: "0.15rem 0.45rem",
                          borderRadius: "999px",
                          background: `${(STATUS_COLORS[entry.status] || "#94a3b8")}22`,
                          color: "var(--text-secondary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {PLATFORM_EMOJI[entry.platform] || PLATFORM_EMOJI.custom} {entry.title}
                      </span>
                    ))}
                    {dayEntries.length > 2 && (
                      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>+{dayEntries.length - 2} mehr</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div>
                <h3 style={{ marginBottom: "0.25rem", fontSize: "1rem" }}>{formatReadableDate(activeDay)}</h3>
                <p className="card-subtitle" style={{ margin: 0 }}>{activeEntries.length ? `${activeEntries.length} Posts geplant` : "Noch keine Posts geplant"}</p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  const today = new Date();
                  setSelectedDate(new Date(today.getFullYear(), today.getMonth(), 1));
                  handleDayClick(today);
                }}
              >
                Heute
              </button>
            </div>
            {calendarLoading ? (
              <p style={{ color: "var(--text-muted)" }}>Lade Einträge…</p>
            ) : activeEntries.length === 0 ? (
              <div style={{ padding: "1rem", background: "var(--bg-tertiary)", borderRadius: "var(--border-radius-sm)" }}>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)" }}>Keine Einträge für diesen Tag. Plane rechts einen neuen Post.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {activeEntries.map(entry => (
                  <div key={entry._id} style={{
                    padding: "1rem",
                    background: "var(--bg-tertiary)",
                    borderRadius: "var(--border-radius-sm)",
                    borderLeft: `4px solid ${STATUS_COLORS[entry.status] || "#94a3b8"}`
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                      <strong>{entry.title}</strong>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{entry.scheduledTime || "12:00"}</span>
                    </div>
                    <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>{entry.content}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem" }}>
                      <span style={{ color: STATUS_COLORS[entry.status] || "var(--text-muted)" }}>
                        {STATUS_LABELS[entry.status] || "Geplant"} · {PLATFORM_OPTIONS.find(p => p.value === entry.platform)?.label || "Custom"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(entry._id)}
                        style={{ background: "transparent", border: "none", color: "var(--danger, #f87171)", fontWeight: 600, cursor: "pointer" }}
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">✍️ Neuer Kalender-Eintrag</h2>
            <p className="card-subtitle">Verbinde deine AI-Ergebnisse direkt mit Publishing-Slots</p>
          </div>
          <form onSubmit={handleCreateCalendarEntry} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Titel *</label>
              <input
                className="form-input"
                placeholder="Hook, Caption oder Videotitel"
                value={calendarForm.title}
                onChange={e => setCalendarForm(form => ({ ...form, title: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Content / Caption *</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Kurze Content-Zusammenfassung oder finale Caption"
                value={calendarForm.content}
                onChange={e => setCalendarForm(form => ({ ...form, content: e.target.value }))}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Datum *</label>
                <input
                  type="date"
                  className="form-input"
                  value={calendarForm.scheduledDate}
                  onChange={e => setCalendarForm(form => ({ ...form, scheduledDate: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Uhrzeit</label>
                <input
                  type="time"
                  className="form-input"
                  value={calendarForm.scheduledTime}
                  onChange={e => setCalendarForm(form => ({ ...form, scheduledTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Plattform</label>
                <select
                  className="form-select"
                  value={calendarForm.platform}
                  onChange={e => setCalendarForm(form => ({ ...form, platform: e.target.value }))}
                >
                  {PLATFORM_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Farbe</label>
                <input
                  type="color"
                  className="form-input"
                  style={{ padding: 0, height: "42px" }}
                  value={calendarForm.color}
                  onChange={e => setCalendarForm(form => ({ ...form, color: e.target.value }))}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={calendarSaving}>
              {calendarSaving ? "Speichere..." : "Eintrag planen"}
            </button>
          </form>
          <div style={{ marginTop: "2rem" }}>
            <h3 style={{ marginBottom: "0.5rem" }}>🚀 Nächste Posts</h3>
            {upcomingEntries.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>Noch keine anstehenden Posts für diesen Monat.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {upcomingEntries.map(entry => {
                  const date = new Date(entry.scheduledFor);
                  return (
                    <div key={entry._id} style={{ padding: "0.85rem", background: "var(--bg-tertiary)", borderRadius: "var(--border-radius-sm)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                        <strong>{entry.title}</strong>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{date.toLocaleDateString("de-DE")} · {entry.scheduledTime || "12:00"}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        {PLATFORM_EMOJI[entry.platform] || PLATFORM_EMOJI.custom} {STATUS_LABELS[entry.status] || "Geplant"}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Team
  if (currentPage === "team") {
    return (
      <div className="card">
        <div className="card-header"><h2 className="card-title">👥 Team Management</h2></div>
        {organization ? (
          <div>
            <div style={{ padding: "1rem", background: "var(--bg-tertiary)", borderRadius: "var(--border-radius-sm)", marginBottom: "1rem" }}>
              <strong>{organization.name}</strong>
              <span style={{ marginLeft: "1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {organization.members?.length || 0} / {organization.maxMembers} Mitglieder
              </span>
            </div>
            <div className="form-group">
              <label className="form-label">Mitglied einladen</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input className="form-input" placeholder="email@beispiel.de" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                <button className="btn btn-primary" onClick={async () => {
                  const res = await inviteTeamMember(token, inviteEmail);
                  if (res.success) { alert("Einladung gesendet!"); setInviteEmail(""); }
                  else alert(res.error?.message);
                }}>Einladen</button>
              </div>
                  </div>
                </div>
        ) : (
          <div>
            <p style={{ marginBottom: "1rem" }}>Erstelle ein Team, um mit anderen zusammenzuarbeiten.</p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input className="form-input" placeholder="Team-Name" value={teamName} onChange={e => setTeamName(e.target.value)} />
              <button className="btn btn-primary" onClick={async () => {
                const res = await createOrganization(token, teamName);
                if (res.success) setOrganization(res.data.organization);
                else alert(res.error?.message);
              }}>Team erstellen</button>
            </div>
                </div>
        )}
      </div>
    );
  }

  // Style (Persönlicher Assistent)
  if (currentPage === "style") {
    return (
      <div className="card">
        <div className="card-header"><h2 className="card-title">🎨 KI-Assistent Konfiguration</h2><p className="card-subtitle">Trainiere die KI auf deinen Stil</p></div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Nische</label>
            <input className="form-input" value={styleForm.niche || ""} onChange={e => setStyleForm(p => ({ ...p, niche: e.target.value }))} placeholder="z.B. Fitness, Tech, Food..." />
          </div>
          <div className="form-group">
            <label className="form-label">Zielgruppe</label>
            <input className="form-input" value={styleForm.targetAudience || ""} onChange={e => setStyleForm(p => ({ ...p, targetAudience: e.target.value }))} placeholder="z.B. 18-25 jährige Frauen..." />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Ton</label>
            <select className="form-select" value={styleForm.toneOfVoice || "casual"} onChange={e => setStyleForm(p => ({ ...p, toneOfVoice: e.target.value }))}>
              <option value="casual">Locker</option><option value="professional">Professionell</option>
              <option value="humorous">Humorvoll</option><option value="inspirational">Inspirierend</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Emoji-Nutzung</label>
            <select className="form-select" value={styleForm.emojiUsage || "moderate"} onChange={e => setStyleForm(p => ({ ...p, emojiUsage: e.target.value }))}>
              <option value="none">Keine</option><option value="minimal">Minimal</option>
              <option value="moderate">Moderat</option><option value="heavy">Viel</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Spezielle Anweisungen</label>
          <textarea className="form-textarea" value={styleForm.customInstructions || ""} onChange={e => setStyleForm(p => ({ ...p, customInstructions: e.target.value }))} placeholder="z.B. Immer mit einer Frage enden..." />
        </div>
        <button className="btn btn-primary" onClick={async () => {
          const res = await updateContentStyle(token, styleForm);
          if (res.success) alert("Stil gespeichert!"); else alert(res.error?.message);
        }}>💾 Speichern</button>
          </div>
    );
  }

  // History
  if (currentPage === "history") {
    return (
      <div className="card">
        <div className="card-header"><h2 className="card-title">📜 Verlauf</h2></div>
        {history.length === 0 ? <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>Keine Generierungen vorhanden.</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {history.map(item => (
              <div key={item._id} style={{ padding: "1rem", background: "var(--bg-tertiary)", borderRadius: "var(--border-radius-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontWeight: 500 }}>{item.type === "prompt" ? "✨ Prompt" : item.type === "video_idea" ? "🎬 Script" : item.type === "batch" ? "⚡ Batch" : "📝 " + item.type}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(item.createdAt).toLocaleString("de-DE")}</span>
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.prompt}</p>
              </div>
            ))}
          </div>
      )}
    </div>
  );
  }

  // Settings
  if (currentPage === "settings") {
    return (
      <div className="card">
        <div className="card-header"><h2 className="card-title">⚙️ Einstellungen</h2></div>
        <div className="form-group">
          <label className="form-label">Standard-Sprache</label>
          <select className="form-select" defaultValue={profile?.language || "de"}>
            {Object.entries(LANGUAGES).slice(0, 7).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <button className="btn btn-primary">💾 Speichern</button>
      </div>
    );
  }

  // Credits
  if (currentPage === "credits") {
    return (
      <div className="card">
        <div className="card-header"><h2 className="card-title">💰 Credits kaufen</h2></div>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>Stripe-Integration kommt bald!</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {[{ name: "Starter", credits: 100, price: "4,99€" }, { name: "Pro", credits: 500, price: "19,99€", popular: true }, { name: "Unlimited", credits: 1000, price: "34,99€" }].map(pkg => (
            <div key={pkg.name} style={{ padding: "1.5rem", background: pkg.popular ? "var(--accent-gradient)" : "var(--bg-tertiary)", borderRadius: "var(--border-radius)", color: pkg.popular ? "white" : "inherit", textAlign: "center" }}>
              <h3>{pkg.name}</h3>
              <div style={{ fontSize: "2rem", fontWeight: 700 }}>{pkg.credits}</div>
              <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>Credits</div>
              <div style={{ marginTop: "1rem", fontSize: "1.25rem", fontWeight: 600 }}>{pkg.price}</div>
              <button className={pkg.popular ? "btn btn-secondary" : "btn btn-primary"} style={{ marginTop: "1rem", width: "100%" }}>Kaufen</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Tool Pages
  const currentTool = TOOLS[currentPage];
  if (currentTool) {
    return <GeneratorTool {...currentTool} onGenerate={handleGenerate} isLoading={isLoading} result={result} error={error} />;
  }

  return <div>Seite nicht gefunden</div>;
}
