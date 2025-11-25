// src/pages/Dashboard.jsx
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
  analyzeVirality
} from "../api";

// Tool Configurations
const TOOLS = {
  prompts: {
    title: "Prompt Generator",
    description: "Generiere virale Instagram Reel Prompts basierend auf deinen Posts",
    icon: "✨",
    cost: 1,
    fields: [
      { id: "category", label: "Kategorie", type: "text", placeholder: "z.B. Fitness, Food, Travel..." },
      { id: "variantsPerPost", label: "Varianten pro Post", type: "number", min: 1, max: 10, default: 3 },
      { id: "style", label: "Stil", type: "select", default: "viral", options: [
        { value: "viral", label: "Viral" },
        { value: "educational", label: "Educational" },
        { value: "entertaining", label: "Entertaining" },
        { value: "inspirational", label: "Inspirational" }
      ]},
      { id: "tone", label: "Ton", type: "select", default: "engaging", options: [
        { value: "engaging", label: "Engaging" },
        { value: "professional", label: "Professional" },
        { value: "casual", label: "Casual" },
        { value: "humorous", label: "Humorvoll" }
      ]}
    ]
  },
  scripts: {
    title: "Script Generator",
    description: "Erstelle detaillierte Video-Skripte mit Hook, Handlung und CTA",
    icon: "🎬",
    cost: 2,
    fields: [
      { id: "prompt", label: "Prompt / Thema", type: "textarea", placeholder: "Beschreibe deine Video-Idee...", required: true }
    ]
  },
  hooks: {
    title: "Hook Generator",
    description: "Generiere scroll-stoppende Hooks für deine Reels",
    icon: "🎣",
    cost: 1,
    fields: [
      { id: "topic", label: "Thema", type: "text", placeholder: "Worüber ist dein Video?", required: true },
      { id: "count", label: "Anzahl Hooks", type: "number", min: 1, max: 20, default: 10 },
      { id: "style", label: "Hook-Stil", type: "select", default: "mixed", options: [
        { value: "mixed", label: "Gemischt" },
        { value: "question", label: "Fragen" },
        { value: "statement", label: "Statements" },
        { value: "shocking", label: "Shocking Facts" },
        { value: "story", label: "Story-Opener" }
      ]}
    ]
  },
  captions: {
    title: "Caption Generator",
    description: "Erstelle perfekte Instagram Captions mit Hashtags",
    icon: "📝",
    cost: 1,
    fields: [
      { id: "topic", label: "Thema", type: "text", placeholder: "Worum geht es im Post?", required: true },
      { id: "tone", label: "Ton", type: "select", default: "casual", options: [
        { value: "casual", label: "Locker" },
        { value: "professional", label: "Professionell" },
        { value: "funny", label: "Lustig" },
        { value: "inspirational", label: "Inspirierend" }
      ]},
      { id: "count", label: "Anzahl Captions", type: "number", min: 1, max: 10, default: 3 }
    ]
  },
  titles: {
    title: "Title Generator",
    description: "Generiere klickstarke Reel-Titel",
    icon: "🏷️",
    cost: 1,
    fields: [
      { id: "topic", label: "Thema", type: "text", placeholder: "Video-Thema...", required: true },
      { id: "style", label: "Titel-Stil", type: "select", default: "clickbait", options: [
        { value: "clickbait", label: "Clickbait" },
        { value: "informative", label: "Informativ" },
        { value: "question", label: "Frage" },
        { value: "how-to", label: "How-To" },
        { value: "listicle", label: "Liste" }
      ]},
      { id: "count", label: "Anzahl", type: "number", min: 1, max: 10, default: 5 }
    ]
  },
  trends: {
    title: "Trend Finder",
    description: "Finde aktuelle Trends in deiner Nische",
    icon: "📈",
    cost: 3,
    fields: [
      { id: "niche", label: "Deine Nische", type: "text", placeholder: "z.B. Fitness, Kochen, Tech...", required: true },
      { id: "platform", label: "Plattform", type: "select", default: "instagram", options: [
        { value: "instagram", label: "Instagram" },
        { value: "tiktok", label: "TikTok" },
        { value: "youtube", label: "YouTube" },
        { value: "all", label: "Alle" }
      ]},
      { id: "timeframe", label: "Zeitraum", type: "select", default: "week", options: [
        { value: "today", label: "Heute" },
        { value: "week", label: "Diese Woche" },
        { value: "month", label: "Dieser Monat" }
      ]}
    ]
  },
  virality: {
    title: "Virality Analyse",
    description: "Analysiere das virale Potenzial deines Contents",
    icon: "🔥",
    cost: 2,
    fields: [
      { id: "content", label: "Dein Content", type: "textarea", placeholder: "Füge deinen Hook, Caption oder Script ein...", required: true },
      { id: "type", label: "Content-Typ", type: "select", default: "full", options: [
        { value: "hook", label: "Hook" },
        { value: "caption", label: "Caption" },
        { value: "script", label: "Script" },
        { value: "full", label: "Vollständig" }
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

  // Load profile and stats
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
        onCreditsUpdate?.(profileRes.data.user.credits + profileRes.data.user.bonusCredits);
      }
      
      const historyRes = await getHistory(token, { limit: 5 });
      if (historyRes.success) {
        setHistory(historyRes.data.history);
      }
    }
    loadData();
  }, [token]);

  // Reset result when changing pages
  useEffect(() => {
    setResult(null);
    setError(null);
  }, [currentPage]);

  // Handle generation
  async function handleGenerate(formData) {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let response;
      
      switch (currentPage) {
        case "prompts":
          response = await generatePrompts(token, formData);
          break;
        case "scripts":
          response = await generateVideoIdeas([formData.prompt], token, true);
          break;
        case "hooks":
          response = await generateHooks(formData.topic, token, formData);
          break;
        case "captions":
          response = await generateCaptions(formData.topic, token, formData);
          break;
        case "titles":
          response = await generateTitles(formData.topic, token, formData);
          break;
        case "trends":
          response = await analyzeTrends(formData.niche, token, formData);
          break;
        case "virality":
          response = await analyzeVirality(formData.content, token, formData.type);
          break;
        default:
          return;
      }

      if (response.success) {
        // Extract content based on response type
        let content = "";
        if (response.data.prompts) content = response.data.prompts[0];
        else if (response.data.videoIdeas) content = response.data.videoIdeas[0]?.idea;
        else if (response.data.hooks) content = response.data.hooks;
        else if (response.data.captions) content = response.data.captions;
        else if (response.data.titles) content = response.data.titles;
        else if (response.data.analysis) content = response.data.analysis;
        
        setResult(content);
        
        // Update credits
        if (response.data.metadata?.creditsRemaining !== undefined) {
          onCreditsUpdate?.(response.data.metadata.creditsRemaining);
        }
        
        // Refresh profile
        const profileRes = await getProfile(token);
        if (profileRes.success) {
          setProfile(profileRes.data.user);
          onCreditsUpdate?.(profileRes.data.user.credits + profileRes.data.user.bonusCredits);
        }
      } else {
        setError(response.error?.message || "Generierung fehlgeschlagen");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Render Dashboard Overview
  if (currentPage === "dashboard") {
    return (
      <div>
        {/* Stats Grid */}
        <div className="stats-grid">
          <StatsCard
            icon="✨"
            iconColor="purple"
            value={stats.prompts}
            label="Prompts generiert"
          />
          <StatsCard
            icon="🎬"
            iconColor="blue"
            value={stats.scripts}
            label="Scripts erstellt"
          />
          <StatsCard
            icon="📁"
            iconColor="green"
            value={stats.uploads}
            label="Uploads"
          />
          <StatsCard
            icon="⚡"
            iconColor="orange"
            value={profile?.credits || 0}
            label="Credits verfügbar"
          />
        </div>

        {/* Upload Zone */}
        <div className="card" style={{ marginBottom: "2rem" }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">📤 Posts hochladen</h2>
              <p className="card-subtitle">Lade deine Instagram-Posts als JSON hoch</p>
            </div>
          </div>
          <UploadZone 
            token={token} 
            onUploadSuccess={(data) => {
              setStats(prev => ({ ...prev, uploads: prev.uploads + 1 }));
            }}
          />
        </div>

        {/* Quick Access Tools */}
        <h2 style={{ marginBottom: "1rem", fontSize: "1.125rem", fontWeight: 600 }}>
          🚀 Schnellzugriff
        </h2>
        <div className="tools-grid">
          {Object.entries(TOOLS).slice(0, 4).map(([key, tool]) => (
            <div 
              key={key}
              className="tool-card"
              onClick={() => window.dispatchEvent(new CustomEvent("navigate", { detail: key }))}
            >
              <div className="tool-icon">{tool.icon}</div>
              <h3 className="tool-title">{tool.title}</h3>
              <p className="tool-description">{tool.description}</p>
              <div className="tool-cost">⚡ {tool.cost} Credit{tool.cost > 1 ? "s" : ""}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render History
  if (currentPage === "history") {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">📜 Dein Verlauf</h2>
        </div>
        
        {history.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>
            Noch keine Generierungen vorhanden.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {history.map((item) => (
              <div 
                key={item._id}
                style={{
                  padding: "1rem",
                  background: "var(--bg-tertiary)",
                  borderRadius: "var(--border-radius-sm)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontWeight: 500 }}>
                    {item.type === "prompt" && "✨ Prompt"}
                    {item.type === "video_idea" && "🎬 Script"}
                    {item.type === "hook" && "🎣 Hook"}
                    {item.type === "caption" && "📝 Caption"}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {new Date(item.createdAt).toLocaleString("de-DE")}
                  </span>
                </div>
                <p style={{ 
                  fontSize: "0.875rem", 
                  color: "var(--text-secondary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                  {item.prompt}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render Settings
  if (currentPage === "settings") {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">⚙️ Einstellungen</h2>
        </div>
        <p style={{ color: "var(--text-muted)" }}>
          Einstellungen werden bald verfügbar sein.
        </p>
      </div>
    );
  }

  // Render Credits Page
  if (currentPage === "credits") {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">💰 Credits kaufen</h2>
        </div>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
          Stripe-Integration kommt bald!
        </p>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {[
            { name: "Starter", credits: 100, price: "4,99€" },
            { name: "Pro", credits: 500, price: "19,99€", popular: true },
            { name: "Unlimited", credits: 1000, price: "34,99€" }
          ].map((pkg) => (
            <div 
              key={pkg.name}
              style={{
                padding: "1.5rem",
                background: pkg.popular ? "var(--accent-gradient)" : "var(--bg-tertiary)",
                borderRadius: "var(--border-radius)",
                color: pkg.popular ? "white" : "inherit",
                textAlign: "center"
              }}
            >
              <h3 style={{ marginBottom: "0.5rem" }}>{pkg.name}</h3>
              <div style={{ fontSize: "2rem", fontWeight: 700 }}>{pkg.credits}</div>
              <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>Credits</div>
              <div style={{ marginTop: "1rem", fontSize: "1.25rem", fontWeight: 600 }}>{pkg.price}</div>
              <button 
                className={pkg.popular ? "btn btn-secondary" : "btn btn-primary"}
                style={{ marginTop: "1rem", width: "100%" }}
              >
                Kaufen
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render Tool Page
  const currentTool = TOOLS[currentPage];
  if (currentTool) {
    return (
      <GeneratorTool
        {...currentTool}
        onGenerate={handleGenerate}
        isLoading={isLoading}
        result={result}
        error={error}
      />
    );
  }

  return <div>Seite nicht gefunden</div>;
}
