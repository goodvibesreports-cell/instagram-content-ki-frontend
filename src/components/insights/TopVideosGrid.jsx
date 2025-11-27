import React from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

function formatDate(value) {
  if (!value) return "—";
  try {
    return format(new Date(value), "dd.MM.yyyy HH:mm", { locale: de });
  } catch {
    return "—";
  }
}

export default function TopVideosGrid({ videos = [] }) {
  if (!videos.length) {
    return (
      <article className="insights-section">
        <header className="section-header">
          <div>
            <h3>Top Performing Videos</h3>
            <p>Die viralsten Clips basierend auf Likes & Virality Score</p>
          </div>
        </header>
        <div className="empty-state">Noch keine viralen Videos erkannt.</div>
      </article>
    );
  }

  return (
    <article className="insights-section">
      <header className="section-header">
        <div>
          <h3>Top Performing Videos</h3>
          <p>Best-of Liste inkl. Datum, Sound und Direkt-Link</p>
        </div>
      </header>
      <div className="top-videos-grid">
        {videos.slice(0, 6).map((video, index) => (
          <article key={`${video.link || index}-${video.title}`} className="top-video-card">
            {video.coverImage || video.meta?.coverImage ? (
              <img
                src={video.coverImage || video.meta?.coverImage}
                alt={video.title || video.caption || "Video Cover"}
                className="top-video-cover"
              />
            ) : (
              <div className="top-video-cover placeholder">
                <span>Kein Cover</span>
              </div>
            )}
            <div className="top-video-body">
              <div className="top-video-rank">#{index + 1}</div>
              <h4 title={video.title || video.caption}>{video.title || video.caption || "Video"}</h4>
              <p className="top-video-meta">
                👍 {video.likes ?? 0} · {formatDate(video.timestamp || video.date)} · {video.weekday || "-"}
              </p>
              {video.sound || video.soundOrAudio ? (
                <p className="top-video-sound">🎵 {video.sound || video.soundOrAudio}</p>
              ) : null}
              <div className="top-video-actions">
                {video.link ? (
                  <a href={video.link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                    Video öffnen
                  </a>
                ) : (
                  <button type="button" className="btn btn-secondary" disabled>
                    Kein Link
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </article>
  );
}

