import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getUploadDataset, getUploadDatasets } from "../api.js";

const numberFormatter = new Intl.NumberFormat("de-DE");

function formatDate(value) {
  try {
    return new Date(value).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "-";
  }
}

function formatFileSize(bytes = 0) {
  if (!bytes || Number.isNaN(bytes)) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export default function UploadAnalyzerPro({ token, lastUpload }) {
  const [datasets, setDatasets] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasToken = Boolean(token);

  const loadDatasets = useCallback(
    async (shouldSelectFirst = false) => {
      if (!token) return;
      setListLoading(true);
      setError(null);
      try {
        const res = await getUploadDatasets(token);
        if (res.success) {
          const data = res.datasets || [];
          setDatasets(data);
          if ((shouldSelectFirst || !selectedId) && data.length) {
            setSelectedId(data[0]._id);
          }
        } else {
          setError(res.error?.message || "Uploads konnten nicht geladen werden");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setListLoading(false);
      }
    },
    [token, selectedId]
  );

  const fetchDatasetDetail = useCallback(
    async (datasetId, initialDataset) => {
      if (!token || !datasetId) return;
      setDetailLoading(true);
      setError(null);
      try {
        if (initialDataset) {
          setSelectedDataset(initialDataset);
          return;
        }
        const res = await getUploadDataset(token, datasetId);
        if (res.success) {
          setSelectedDataset(res.dataset);
        } else {
          setError(res.error?.message || "Dataset konnte nicht geladen werden");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setDetailLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!hasToken) return;
    loadDatasets(true);
  }, [hasToken, loadDatasets]);

  useEffect(() => {
    if (!selectedId) return;
    fetchDatasetDetail(selectedId);
  }, [selectedId, fetchDatasetDetail]);

  useEffect(() => {
    if (!token || !lastUpload?.datasetId) return;
    const placeholder = {
      ...(lastUpload.dataset || {}),
      _id: lastUpload.datasetId,
      platform: lastUpload.dataset?.platform || "tiktok",
      status: lastUpload.dataset?.status || "uploaded",
      sourceFilename: lastUpload.fileName || lastUpload.dataset?.sourceFilename || "Upload.json",
      fileSize: lastUpload.fileSize || lastUpload.dataset?.fileSize || 0,
      totals: lastUpload.dataset?.totals || {
        posts: lastUpload.posts?.length || lastUpload.count || 0,
        links: lastUpload.links?.length || 0
      },
      posts: lastUpload.posts || [],
      links: lastUpload.links || [],
      createdAt: lastUpload.dataset?.createdAt || new Date().toISOString()
    };
    setDatasets(prev => {
      const exists = prev.some(ds => ds._id === placeholder._id);
      if (exists) return prev;
      return [placeholder, ...prev].slice(0, 20);
    });
    setSelectedId(placeholder._id);
    fetchDatasetDetail(placeholder._id, placeholder);
  }, [lastUpload, token, fetchDatasetDetail]);

  const analytics = useMemo(() => computeAnalytics(selectedDataset), [selectedDataset]);

  if (!hasToken) {
    return (
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">🧠 Upload Analyzer Pro</h2>
            <p className="card-subtitle">Bitte einloggen, um Uploads zu analysieren.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: "2rem" }}>
      <div className="card-header" style={{ alignItems: "center" }}>
        <div>
          <h2 className="card-title">🧠 Upload Analyzer Pro</h2>
          <p className="card-subtitle">Deine letzten Uploads inklusive TikTok-Performance-Daten</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => loadDatasets()} disabled={listLoading}>
          {listLoading ? "Aktualisiere…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="status-message error" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "minmax(240px, 1fr) 2fr" }}>
        <div>
          <h3 style={{ marginBottom: "0.75rem", fontSize: "0.95rem", fontWeight: 600 }}>Letzte Uploads</h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              maxHeight: "360px",
              overflowY: "auto",
              paddingRight: "0.25rem"
            }}
          >
            {listLoading && datasets.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>Lade Uploads…</p>
            ) : datasets.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>Noch keine Uploads vorhanden.</p>
            ) : (
              datasets.map(dataset => {
                const isActive = selectedId === dataset._id;
                return (
                  <button
                    type="button"
                    key={dataset._id}
                    onClick={() => setSelectedId(dataset._id)}
                    className="card"
                    style={{
                      border: isActive ? "1px solid var(--accent)" : "1px solid var(--border)",
                      margin: 0,
                      boxShadow: isActive ? "0 0 0 1px var(--accent)" : "var(--card-shadow)",
                      textAlign: "left",
                      padding: "0.85rem"
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{dataset.sourceFilename || "Upload.json"}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{formatDate(dataset.createdAt)}</div>
                    <div style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
                      📄 {dataset.totals?.posts ?? dataset.posts?.length ?? 0} Posts · 🔗 {dataset.totals?.links ?? 0} Links
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1rem" }}>
                {selectedDataset?.sourceFilename || "Kein Dataset ausgewählt"}
              </h3>
              {selectedDataset && (
                <p className="card-subtitle" style={{ margin: 0 }}>
                  {formatDate(selectedDataset.createdAt)} · {formatFileSize(selectedDataset.fileSize)}
                </p>
              )}
            </div>
            {selectedDataset && (
              <span
                style={{
                  fontSize: "0.8rem",
                  padding: "0.25rem 0.6rem",
                  borderRadius: "999px",
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border)"
                }}
              >
                {selectedDataset.status}
              </span>
            )}
          </div>

          {detailLoading && (
            <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>Lade Details…</p>
          )}

          {!detailLoading && !selectedDataset && (
            <p style={{ color: "var(--text-muted)" }}>Bitte wähle ein Upload aus der Liste.</p>
          )}

          {!detailLoading && selectedDataset && (
            <>
              <div
                style={{
                  display: "grid",
                  gap: "0.75rem",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  marginBottom: "1.25rem",
                  marginTop: "0.5rem"
                }}
              >
                {[
                  { label: "Posts erkannt", value: analytics?.counts.posts ?? "—" },
                  { label: "Gefundene Links", value: analytics?.counts.links ?? "—" },
                  { label: "Summe Likes", value: analytics?.totals.likes ?? "—" },
                  { label: "Summe Views", value: analytics?.totals.views ?? "—" },
                  { label: "Durchschn. Likes", value: analytics?.averages.likes ?? "—" },
                  { label: "Engagement Rate", value: analytics?.engagementRate ?? "—" }
                ].map(stat => (
                  <div
                    key={stat.label}
                    style={{
                      padding: "0.85rem",
                      borderRadius: "var(--border-radius-sm)",
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border)"
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{stat.label}</div>
                    <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              <section style={{ marginTop: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <h4 style={{ margin: 0 }}>🔥 Top Posts</h4>
                  {analytics?.counts.posts > 5 && (
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Top 5 nach Likes</span>
                  )}
                </div>
                {analytics?.topPosts.likes.length ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {analytics.topPosts.likes.map((post, index) => (
                      <PostHighlight key={`${post.link || index}-${index}`} post={post} index={index} />
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-muted)" }}>Keine Posts erkannt.</p>
                )}
              </section>

              {analytics?.topPosts.views.length ? (
                <section style={{ marginTop: "1.5rem" }}>
                  <h4 style={{ marginBottom: "0.5rem" }}>👁️‍🗨️ Views Ranking</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {analytics.topPosts.views.map((post, index) => (
                      <CompactRow
                        key={`views-${post.link || index}`}
                        index={index}
                        primary={post.caption || "Ohne Caption"}
                        secondary={`👀 ${numberFormatter.format(post.views)} · 👍 ${numberFormatter.format(post.likes)} · 💬 ${numberFormatter.format(post.comments)}`}
                        link={post.link}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {analytics?.timeInsights?.buckets.length ? (
                <section style={{ marginTop: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <h4 style={{ margin: 0 }}>🕒 Viralste Uhrzeiten</h4>
                    {analytics.timeInsights.bestHour && (
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        Beste Stunde: {analytics.timeInsights.bestHour.label} (Ø Likes {analytics.timeInsights.bestHour.avgLikes})
                      </span>
                    )}
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left" }}>Slot</th>
                          <th>Posts</th>
                          <th>Ø Likes</th>
                          <th>Ø Views</th>
                          <th>Viral Hits</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.timeInsights.buckets.slice(0, 8).map(bucket => (
                          <tr key={bucket.hour}>
                            <td>{bucket.label}</td>
                            <td style={{ textAlign: "center" }}>{bucket.count}</td>
                            <td style={{ textAlign: "center" }}>{numberFormatter.format(bucket.avgLikes)}</td>
                            <td style={{ textAlign: "center" }}>{numberFormatter.format(bucket.avgViews)}</td>
                            <td style={{ textAlign: "center" }}>{bucket.viralCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {analytics.timeInsights.buckets.length > 8 && (
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                        +{analytics.timeInsights.buckets.length - 8} weitere Slots analysiert
                      </p>
                    )}
                  </div>
                </section>
              ) : null}

              {analytics?.toneInsights?.tones.length ? (
                <section style={{ marginTop: "1.5rem" }}>
                  <h4 style={{ marginBottom: "0.5rem" }}>🗣️ Content-Tonalitäten</h4>
                  <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                    {analytics.toneInsights.tones.map(tone => (
                      <div
                        key={tone.tone}
                        style={{
                          padding: "0.85rem",
                          borderRadius: "var(--border-radius-sm)",
                          border: "1px solid var(--border)",
                          background: "var(--bg-tertiary)"
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: "0.35rem", textTransform: "capitalize" }}>{tone.tone}</div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          {tone.count} Posts · Ø Likes {numberFormatter.format(tone.avgLikes)}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Engagement {tone.avgEngagement.toFixed(2)}%</div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {analytics?.hashtags.length ? (
                <section style={{ marginTop: "1.5rem" }}>
                  <h4 style={{ marginBottom: "0.5rem" }}>#️⃣ Hashtag Insights</h4>
                  <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left" }}>Hashtag</th>
                          <th>Posts</th>
                          <th>Ø Likes</th>
                          <th>Ø Views</th>
                          <th>Ø Engagement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.hashtags.slice(0, 8).map(tag => (
                          <tr key={tag.tag}>
                            <td style={{ textTransform: "lowercase" }}>#{tag.tag}</td>
                            <td style={{ textAlign: "center" }}>{tag.count}</td>
                            <td style={{ textAlign: "center" }}>{numberFormatter.format(tag.avgLikes)}</td>
                            <td style={{ textAlign: "center" }}>{numberFormatter.format(tag.avgViews)}</td>
                            <td style={{ textAlign: "center" }}>{tag.avgEngagement.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {analytics.hashtags.length > 8 && (
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                        +{analytics.hashtags.length - 8} weitere Hashtags analysiert
                      </p>
                    )}
                  </div>
                </section>
              ) : null}

              {selectedDataset.links?.length ? (
                <section style={{ marginTop: "1.5rem" }}>
                  <h4 style={{ marginBottom: "0.5rem" }}>🔗 Link Explorer</h4>
                  <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                    {selectedDataset.links.slice(0, 6).map((link, index) => (
                      <a
                        key={link + index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="card"
                        style={{
                          padding: "0.75rem",
                          margin: 0,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>TikTok #{index + 1}</span>
                        <span style={{ color: "var(--accent)", fontSize: "0.85rem" }}>Öffnen ↗</span>
                      </a>
                    ))}
                  </div>
                  {selectedDataset.links.length > 6 && (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                      +{selectedDataset.links.length - 6} weitere Links
                    </p>
                  )}
                </section>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PostHighlight({ post, index }) {
  return (
    <div
      style={{
        padding: "0.85rem",
        borderRadius: "var(--border-radius-sm)",
        border: "1px solid var(--border)",
        background: "var(--bg-tertiary)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 600 }}>{post.caption || `Post #${index + 1}`}</div>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>#{index + 1}</span>
      </div>
      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
        👍 {numberFormatter.format(post.likes)} · 👀 {numberFormatter.format(post.views)} · 💬 {numberFormatter.format(post.comments)} ·
        ER {(post.engagementRate || 0).toFixed(2)}%
      </div>
      {post.hashtags?.length ? (
        <div style={{ marginTop: "0.35rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {post.hashtags.slice(0, 4).map(tag => `#${tag}`).join("  ")}
          {post.hashtags.length > 4 ? " ..." : ""}
        </div>
      ) : null}
      {post.link && (
        <a
          href={post.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: "0.75rem", color: "var(--accent)", marginTop: "0.4rem", display: "inline-block" }}
        >
          Link öffnen ↗
        </a>
      )}
    </div>
  );
}

function CompactRow({ primary, secondary, index, link }) {
  return (
    <div
      style={{
        padding: "0.65rem 0.75rem",
        borderRadius: "var(--border-radius-sm)",
        border: "1px solid var(--border)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ fontSize: "0.9rem" }}>{primary}</strong>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>#{index + 1}</span>
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>{secondary}</div>
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", color: "var(--accent)" }}>
          Öffnen ↗
        </a>
      )}
    </div>
  );
}

function computeAnalytics(dataset) {
  if (!dataset?.posts?.length) return null;
  const posts = dataset.posts.map(post => {
    const likes = Number(post.likes) || 0;
    const views = Number(post.views) || 0;
    const comments = Number(post.comments) || 0;
    const hashtags = extractHashtagsFromPost(post);
    const timestamp = parseTimestamp(post);
    const tone = detectTone(post.caption || "");
    const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : likes + comments > 0 ? 100 : 0;
    return { ...post, likes, views, comments, hashtags, engagementRate, timestamp, tone };
  });

  const totals = posts.reduce(
    (acc, post) => {
      acc.likes += post.likes;
      acc.views += post.views;
      acc.comments += post.comments;
      return acc;
    },
    { likes: 0, views: 0, comments: 0 }
  );

  const averages = {
    likes: numberFormatter.format(Math.round(totals.likes / posts.length || 0)),
    views: numberFormatter.format(Math.round(totals.views / posts.length || 0)),
    comments: numberFormatter.format(Math.round(totals.comments / posts.length || 0))
  };

  const topPosts = {
    likes: [...posts].sort((a, b) => b.likes - a.likes).slice(0, 5),
    views: [...posts].sort((a, b) => b.views - a.views).slice(0, 5),
    comments: [...posts].sort((a, b) => b.comments - a.comments).slice(0, 5)
  };

  const hashtagMap = new Map();
  posts.forEach(post => {
    post.hashtags.forEach(tag => {
      const entry = hashtagMap.get(tag) || { tag, count: 0, likes: 0, views: 0, comments: 0 };
      entry.count += 1;
      entry.likes += post.likes;
      entry.views += post.views;
      entry.comments += post.comments;
      hashtagMap.set(tag, entry);
    });
  });

  const hashtags = Array.from(hashtagMap.values())
    .map(stat => ({
      ...stat,
      avgLikes: Math.round(stat.likes / stat.count || 0),
      avgViews: Math.round(stat.views / stat.count || 0),
      avgEngagement: stat.views > 0 ? ((stat.likes + stat.comments) / stat.views) * 100 : 0
    }))
    .sort((a, b) => b.avgLikes - a.avgLikes);

  const viralThreshold = calculateQuantile(posts.map(post => post.likes), 0.8);
  const timeBuckets = buildTimeBuckets(posts, viralThreshold);
  const toneInsights = buildToneInsights(posts);

  const engagementRate =
    totals.views > 0 ? `${(((totals.likes + totals.comments) / totals.views) * 100).toFixed(2)}%` : totals.likes + totals.comments > 0 ? "100%" : "—";

  return {
    counts: {
      posts: dataset.totals?.posts ?? posts.length,
      links: dataset.totals?.links ?? dataset.links?.length ?? 0
    },
    totals: {
      likes: numberFormatter.format(totals.likes),
      views: numberFormatter.format(totals.views),
      comments: numberFormatter.format(totals.comments)
    },
    averages,
    engagementRate,
    topPosts,
    hashtags,
    timeInsights: timeBuckets,
    toneInsights
  };
}

function extractHashtagsFromPost(post) {
  if (Array.isArray(post.hashtags) && post.hashtags.length) {
    return post.hashtags
      .map(tag => tag.replace("#", "").toLowerCase())
      .filter(Boolean);
  }
  const matches = (post.caption || "").match(/#([A-Za-z0-9_]+)/g);
  if (!matches) return [];
  return matches.map(tag => tag.replace("#", "").toLowerCase());
}

function calculateQuantile(values, quantile) {
  const filtered = values.filter(v => typeof v === "number" && !Number.isNaN(v)).sort((a, b) => a - b);
  if (!filtered.length) return 0;
  const index = Math.floor((filtered.length - 1) * quantile);
  return filtered[index] || 0;
}

function buildTimeBuckets(posts, viralThreshold) {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${String(hour).padStart(2, "0")}:00 - ${String((hour + 1) % 24).padStart(2, "0")}:00`,
    count: 0,
    likes: 0,
    views: 0,
    viralCount: 0
  }));

  posts.forEach(post => {
    if (!post.timestamp || Number.isNaN(post.timestamp.getTime())) return;
    const hour = post.timestamp.getHours();
    const bucket = buckets[hour];
    bucket.count += 1;
    bucket.likes += post.likes;
    bucket.views += post.views;
    if (post.likes >= viralThreshold && post.likes > 0) {
      bucket.viralCount += 1;
    }
  });

  const enriched = buckets
    .filter(bucket => bucket.count > 0)
    .map(bucket => ({
      ...bucket,
      avgLikes: bucket.likes / bucket.count || 0,
      avgViews: bucket.views / bucket.count || 0
    }))
    .sort((a, b) => b.avgLikes - a.avgLikes);

  return {
    bestHour: enriched[0] ? { label: enriched[0].label, avgLikes: numberFormatter.format(Math.round(enriched[0].avgLikes)) } : null,
    buckets: enriched
  };
}

function detectTone(caption) {
  const text = caption.toLowerCase();
  const toneRules = [
    { tone: "humor", keywords: ["😂", "🤣", "lol", "witz", "witzig", "haha", "lustig"] },
    { tone: "motivational", keywords: ["motivation", "du schaffst", "glaub an dich", "mindset", "goals", "ziele", "hustle"] },
    { tone: "educational", keywords: ["tipps", "how to", "so geht", "guide", "lerne", "tutorial", "facts"] },
    { tone: "storytelling", keywords: ["story", "geschichte", "once", "damals", "reise", "journey"] },
    { tone: "urgent", keywords: ["jetzt", "sofort", "limit", "nur heute", "breaking"] },
    { tone: "serious", keywords: ["wichtig", "ernst", "problem", "achtung"] }
  ];

  for (const rule of toneRules) {
    if (rule.keywords.some(keyword => text.includes(keyword))) {
      return rule.tone;
    }
  }

  if (/[!?]{2,}/.test(caption)) return "energetic";
  if (/❤️|💖|love|liebe/.test(caption.toLowerCase())) return "emotional";
  if (caption.length > 280) return "detailed";

  return "neutral";
}

function buildToneInsights(posts) {
  const toneMap = new Map();

  posts.forEach(post => {
    const tone = post.tone || "neutral";
    const entry = toneMap.get(tone) || { tone, count: 0, likes: 0, views: 0, comments: 0 };
    entry.count += 1;
    entry.likes += post.likes;
    entry.views += post.views;
    entry.comments += post.comments;
    toneMap.set(tone, entry);
  });

  const tones = Array.from(toneMap.values())
    .map(stat => ({
      ...stat,
      avgLikes: Math.round(stat.likes / stat.count || 0),
      avgViews: Math.round(stat.views / stat.count || 0),
      avgEngagement: stat.views > 0 ? ((stat.likes + stat.comments) / stat.views) * 100 : 0
    }))
    .sort((a, b) => b.avgLikes - a.avgLikes);

  return { tones };
}

function parseTimestamp(post) {
  if (!post.timestamp) return null;
  const value = new Date(post.timestamp);
  return Number.isNaN(value.getTime()) ? null : value;
}



