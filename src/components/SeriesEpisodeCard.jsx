import React from "react";

export default function SeriesEpisodeCard({ episode, onStatusChange }) {
  return (
    <div className="series-episode-card">
      <h5>{episode.title}</h5>
      <p>{episode.hook}</p>
      <div className="episode-actions">
        {["planned", "in_progress", "published", "analyzing"].map((status) => (
          <button
            key={status}
            className={`chip ${episode.status === status ? "active" : ""}`}
            onClick={() => onStatusChange(status)}
          >
            {status.replace("_", " ")}
          </button>
        ))}
      </div>
    </div>
  );
}

