// src/pages/Dashboard.jsx - v3.0
import React, { useState, useEffect } from "react";
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
  getApiKeyStatus,
  setApiKey,
  removeApiKey,
  toggleUseOwnApiKeys,
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

export default function Dashboard({ token, userEmail, currentPage, onCreditsUpdate }) {
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Team State
  const [organization, setOrganization] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  
  // Style State
  const [styleForm, setStyleForm] = useState({});
  
  // API Keys State
  const [apiKeyStatus, setApiKeyStatus] = useState({});
  const [newApiKey, setNewApiKey] = useState("");

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
      
      const keyRes = await getApiKeyStatus(token);
      if (keyRes.success) setApiKeyStatus(keyRes.data);
    }
    loadData();
  }, [token]);

  useEffect(() => {
    setResult(null);
    setError(null);
    setBatchResult(null);
  }, [currentPage]);

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
            <div key={t.id} className="tool-card" onClick={() => window.dispatchEvent(new CustomEvent("navigate", { detail: t.id }))}>
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
    return (
      <div className="card">
        <div className="card-header"><h2 className="card-title">📅 Content Kalender</h2></div>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
          Plane deine Posts und behalte den Überblick über deinen Content.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem", marginBottom: "2rem" }}>
          {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => (
            <div key={d} style={{ textAlign: "center", fontWeight: 600, color: "var(--text-muted)", fontSize: "0.8rem" }}>{d}</div>
          ))}
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} style={{
              padding: "1rem", textAlign: "center", background: "var(--bg-tertiary)",
              borderRadius: "var(--border-radius-sm)", cursor: "pointer", fontSize: "0.9rem"
            }}>{i + 1 <= 31 ? i + 1 : ""}</div>
          ))}
        </div>
        <p style={{ color: "var(--text-muted)", textAlign: "center" }}>Kalender-Vollversion kommt bald!</p>
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

  // API Keys
  if (currentPage === "apikeys") {
    return (
      <div className="card">
        <div className="card-header"><h2 className="card-title">🔑 API Keys</h2><p className="card-subtitle">Verwende deinen eigenen OpenAI Key (keine Credits nötig)</p></div>
        <div style={{ padding: "1rem", background: apiKeyStatus.keys?.openai ? "rgba(16, 185, 129, 0.1)" : "var(--bg-tertiary)", borderRadius: "var(--border-radius-sm)", marginBottom: "1rem" }}>
          <strong>OpenAI API Key:</strong> {apiKeyStatus.keys?.openai ? "✅ Hinterlegt" : "❌ Nicht hinterlegt"}
        </div>
        {!apiKeyStatus.keys?.openai ? (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input type="password" className="form-input" placeholder="sk-..." value={newApiKey} onChange={e => setNewApiKey(e.target.value)} />
            <button className="btn btn-primary" onClick={async () => {
              const res = await setApiKey(token, "openai", newApiKey);
              if (res.success) { setApiKeyStatus(p => ({ ...p, keys: { ...p.keys, openai: true } })); setNewApiKey(""); alert("API Key gespeichert!"); }
              else alert(res.error?.message);
            }}>Speichern</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary" onClick={async () => {
              const res = await toggleUseOwnApiKeys(token, !apiKeyStatus.useOwnApiKeys);
              if (res.success) setApiKeyStatus(p => ({ ...p, useOwnApiKeys: res.data.useOwnApiKeys }));
            }}>{apiKeyStatus.useOwnApiKeys ? "🔄 Platform-Credits nutzen" : "⚡ Eigenen Key nutzen"}</button>
            <button className="btn btn-ghost" onClick={async () => {
              if (confirm("API Key wirklich entfernen?")) {
                await removeApiKey(token, "openai");
                setApiKeyStatus(p => ({ ...p, keys: { ...p.keys, openai: false }, useOwnApiKeys: false }));
              }
            }}>🗑️ Entfernen</button>
          </div>
        )}
        {apiKeyStatus.useOwnApiKeys && <p style={{ marginTop: "1rem", color: "var(--success)" }}>✅ Du verwendest deinen eigenen API Key - keine Credits werden verbraucht!</p>}
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
