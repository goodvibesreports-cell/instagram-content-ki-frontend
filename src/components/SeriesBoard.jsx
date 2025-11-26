import React from "react";
import SeriesEpisodeCard from "./SeriesEpisodeCard.jsx";

const columns = [
  { id: "planned", label: "Geplant" },
  { id: "in_progress", label: "In Produktion" },
  { id: "published", label: "Live" },
  { id: "analyzing", label: "Momentum" }
];

export default function SeriesBoard({ series, onUpdateEpisode }) {
  if (!series) return null;
  return (
    <div className="series-board">
      {columns.map((column) => (
        <div key={column.id} className="series-column">
          <h4>{column.label}</h4>
          {series.episodes
            .filter((episode) => episode.status === column.id)
            .map((episode) => (
              <SeriesEpisodeCard
                key={episode._id}
                episode={episode}
                onStatusChange={(status) => onUpdateEpisode(series._id, episode._id, status)}
              />
            ))}
        </div>
      ))}
    </div>
  );
}

