import React from "react";

function formatNumber(value) {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("de-DE").format(value);
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch {
    return value;
  }
}

export default function PlatformAnalysisView({ platform, datasetId, loading, error, analysis, videoCount }) {
  if (loading) {
    return (
      <div className="card insights-card-shell">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Analysiere {platform} Dataset…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card insights-card-shell">
        <div className="status-message error">{error}</div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="card insights-card-shell">
        <div className="empty-state">Keine Insights für dieses Dataset verfügbar.</div>
      </div>
    );
  }

  const stats = analysis.globalStats || {};
  const bestHours = analysis.bestPostingHours || analysis.postingTimes?.hours || [];
  const bestDays = analysis.postingDaysOfWeek || analysis.postingTimes?.days || [];
  const topVideos = analysis.topVideos || [];

  return (
    <div className="card insights-card-shell">
      <header className="card-header" style={{ alignItems: "flex-start" }}>
        <div>
          <h2 className="card-title">📊 {platform.toUpperCase()} Insights</h2>
          <p className="card-subtitle">Dataset ID: {datasetId}</p>
        </div>
        <div className="badge">
          {videoCount ?? stats.totalVideos ?? 0} Videos
        </div>
      </header>

      <section className="stats-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.totalVideos ?? videoCount ?? 0)}</div>
            <div className="stat-label">Videos gesamt</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.totalLikes ?? 0)}</div>
            <div className="stat-label">Likes gesamt</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.avgLikes ?? 0)}</div>
            <div className="stat-label">Durchschnitt Likes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{formatDate(stats.firstPostDate)}</div>
            <div className="stat-label">Erster Post</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{formatDate(stats.lastPostDate)}</div>
            <div className="stat-label">Letzter Post</div>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>Beste Upload-Stunden</h3>
        {bestHours.length ? (
          <ul className="analysis-list">
            {bestHours.slice(0, 6).map((entry) => (
              <li key={entry.hour}>
                <strong>{String(entry.hour).padStart(2, "0")}:00</strong>
                <span>
                  · {formatNumber(entry.avgLikes ?? entry.score ?? 0)} Ø Likes ({entry.videoCount ?? entry.posts ?? 0} Videos)
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">Keine Daten</div>
        )}
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>Beste Wochentage</h3>
        {bestDays.length ? (
          <ul className="analysis-list">
            {bestDays.slice(0, 6).map((entry) => (
              <li key={entry.dayOfWeek ?? entry.index ?? entry.weekday}>
                <strong>{entry.weekday || entry.day || `Tag ${entry.dayOfWeek}`}</strong>
                <span>
                  · {formatNumber(entry.avgLikes ?? entry.score ?? 0)} Ø Likes ({entry.videoCount ?? entry.posts ?? 0} Videos)
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">Keine Daten</div>
        )}
      </section>

      <section>
        <h3>Top Videos</h3>
        {topVideos.length ? (
          <div className="top-videos-grid">
            {topVideos.slice(0, 6).map((video, index) => (
              <article key={video.link || video.externalId || index} className="top-video-card">
                <header>
                  <strong>#{index + 1}</strong> · {video.title || video.caption || "Video"}
                </header>
                <p>👍 {formatNumber(video.likes || 0)} · {video.sound || video.soundOrAudio || "Sound unbekannt"}</p>
                {video.link && (
                  <a href={video.link} target="_blank" rel="noopener noreferrer">
                    Video öffnen ↗
                  </a>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">Noch keine Top-Videos</div>
        )}
      </section>
    </div>
  );
}

