import React from "react";

function PillList({ title, items = [] }) {
  if (!items.length) return null;
  return (
    <div className="dna-pill-group">
      <span className="dna-pill-label">{title}</span>
      <div className="dna-pill-collection">
        {items.map((item) => (
          <span key={item} className="dna-pill">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function CreatorDNASection({ dna, themes, sounds }) {
  if (!dna) return null;

  const opportunities = [
    ...(themes?.dominantThemes?.map((theme) => theme.keyword).slice(0, 3) || []),
    ...(sounds?.topSounds?.map((sound) => sound.sound).slice(0, 2) || [])
  ];

  return (
    <article className="insights-section">
      <header className="section-header">
        <div>
          <h3>Creator DNA</h3>
          <p>Tonality, Storytelling & strategische Empfehlungen</p>
        </div>
      </header>
      <div className="dna-grid">
        <div className="dna-card accent">
          <span className="dna-icon" aria-hidden="true">
            🔊
          </span>
          <h4>Tone</h4>
          <p>{dna.tone || "—"}</p>
        </div>
        <div className="dna-card accent">
          <span className="dna-icon" aria-hidden="true">
            😊
          </span>
          <h4>Mood</h4>
          <p>{dna.mood || "—"}</p>
        </div>
        <div className="dna-card accent">
          <span className="dna-icon" aria-hidden="true">
            📖
          </span>
          <h4>Narrative Style</h4>
          <p>{dna.narrativeStyle || "—"}</p>
        </div>
        <div className="dna-card">
          <span className="dna-icon" aria-hidden="true">
            🧠
          </span>
          <h4>Posting Behavior</h4>
          <p>{dna.postingBehavior || "Noch keine Empfehlung"}</p>
        </div>
      </div>
      <div className="dna-details-grid">
        <div className="dna-details-card">
          <h4>Content Patterns</h4>
          <PillList title="Wiederkehrende Elemente" items={dna.contentPatterns?.slice(0, 4) || []} />
        </div>
        <div className="dna-details-card">
          <h4>Opportunities</h4>
          <PillList title="Was aktuell performt" items={opportunities} />
        </div>
      </div>
    </article>
  );
}


