import React, { useState } from "react";

export default function AnalyzeForm({ onSubmit, isLoading }) {
  const [caption, setCaption] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [metrics, setMetrics] = useState({ views: "", likes: "", comments: "", saves: "" });

  const handleChangeMetric = (field, value) => {
    setMetrics((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      platform,
      caption,
      metrics: Object.fromEntries(Object.entries(metrics).map(([key, val]) => [key, Number(val) || 0]))
    });
  };

  return (
    <form onSubmit={handleSubmit} className="analyze-form">
      <div className="form-row">
        <label>
          Plattform
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="twitter">Twitter/X</option>
            <option value="linkedin">LinkedIn</option>
          </select>
        </label>
        <label>
          Views
          <input type="number" value={metrics.views} onChange={(e) => handleChangeMetric("views", e.target.value)} min="0" />
        </label>
        <label>
          Likes
          <input type="number" value={metrics.likes} onChange={(e) => handleChangeMetric("likes", e.target.value)} min="0" />
        </label>
        <label>
          Comments
          <input type="number" value={metrics.comments} onChange={(e) => handleChangeMetric("comments", e.target.value)} min="0" />
        </label>
        <label>
          Saves
          <input type="number" value={metrics.saves} onChange={(e) => handleChangeMetric("saves", e.target.value)} min="0" />
        </label>
      </div>
      <label>
        Caption / Beschreibung
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={4} required placeholder="Füge hier deine Caption ein…" />
      </label>
      <button type="submit" className="btn btn-primary" disabled={isLoading}>
        {isLoading ? "Analysiere…" : "🔍 Analyse starten"}
      </button>
    </form>
  );
}

