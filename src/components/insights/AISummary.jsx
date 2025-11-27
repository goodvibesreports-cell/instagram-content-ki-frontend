import React, { useEffect, useState } from "react";
import { getAISummary } from "../../api";

const STORAGE_PREFIX = "ic-ki-ai-summary";

function buildCacheKey(datasetId) {
  return datasetId ? `${STORAGE_PREFIX}-${datasetId}` : null;
}

export default function AISummary({ token, analysis, datasetId, summary: externalSummary, onSummaryChange, readOnly = false }) {
  const [summary, setSummary] = useState(externalSummary || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cacheKey = buildCacheKey(datasetId);

  useEffect(() => {
    if (!cacheKey) return;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        setSummary(JSON.parse(cached));
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    } else if (!externalSummary) {
      setSummary(null);
    }
  }, [cacheKey, externalSummary]);

  useEffect(() => {
    if (externalSummary) {
      setSummary(externalSummary);
    }
  }, [externalSummary]);

  async function handleGenerate() {
    if (!analysis) {
      setError("Keine Analyse-Daten vorhanden.");
      return;
    }
    setLoading(true);
    setError(null);
    const response = await getAISummary(analysis, token);
    setLoading(false);

    if (!response.success) {
      setError(response.error?.message || "AI Summary konnte nicht erstellt werden.");
      return;
    }

    const payload = response.data?.summary || response.summary || response.data;
    if (!payload) {
      setError("Unerwartete KI-Antwort.");
      return;
    }

    setSummary(payload);
    if (cacheKey) {
      sessionStorage.setItem(cacheKey, JSON.stringify(payload));
    }
    onSummaryChange?.(payload);
  }

  return (
    <article className="insights-section">
      <header className="section-header">
        <div>
          <h3>AI Summary & Recommendations</h3>
          <p>Fünf konkrete Handlungsempfehlungen basierend auf deinen TikTok-Daten</p>
        </div>
        {!readOnly && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Analysiere…" : summary ? "Neu generieren" : "AI Summary erzeugen"}
          </button>
        )}
      </header>
      {error ? <div className="status-message error">{error}</div> : null}
      {summary ? (
        <ul className="ai-summary-list">
          {[
            { label: "Best Time Strategy", value: summary.bestTimeStrategy },
            { label: "Content Style", value: summary.contentStyle },
            { label: "Hook Type", value: summary.hookType },
            { label: "Posting Frequency", value: summary.postingFrequency },
            { label: "What To Stop Doing", value: summary.stopDoing }
          ].map((item) => (
            <li key={item.label}>
              <strong>{item.label}</strong>
              <p>{item.value || "Keine Empfehlung verfügbar."}</p>
            </li>
          ))}
        </ul>
      ) : !loading ? (
        <div className="empty-state">Noch keine AI-Empfehlungen generiert.</div>
      ) : null}
    </article>
  );
}

