import React from "react";

const platforms = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube Shorts" },
  { id: "twitter", label: "Twitter/X" },
  { id: "linkedin", label: "LinkedIn" }
];

export default function PlatformSelector({ current, onSelect, isLoading }) {
  return (
    <div className="platform-selector">
      {platforms.map((p) => (
        <button
          key={p.id}
          className={`btn ${current === p.id ? "btn-primary" : "btn-ghost"}`}
          disabled={isLoading}
          onClick={() => onSelect(p.id)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

