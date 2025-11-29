import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchUnifiedAnalysis, getUploadDataset, getUploadDatasets } from "../api.js";

const numberFormatter = new Intl.NumberFormat("de-DE");

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return value;
  }
}

function formatFileSize(bytes = 0) {
  if (!bytes || Number.isNaN(bytes)) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function formatRangeLabel(range) {
  if (!range || (!range.from && !range.to)) return "Alle Daten";
  const from = range.from ? formatDate(range.from) : "Start";
  const to = range.to ? formatDate(range.to) : "Heute";
  return `${from} – ${to}`;
}

function formatTimelineDate(value) {
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

function matchesDateFilters(entry, filters = {}) {
  if (!filters?.fromDate && !filters?.toDate) return true;
  const ts =
    typeof entry.timestamp === "number"
      ? entry.timestamp
      : entry.timestamp
      ? Number(entry.timestamp)
      : entry.date
      ? Date.parse(entry.date)
      : NaN;
  if (!Number.isFinite(ts)) {
    return false;
  }
  if (filters.fromDate) {
    const start = new Date(filters.fromDate);
    start.setHours(0, 0, 0, 0);
    if (ts < start.getTime()) {
      return false;
    }
  }
  if (filters.toDate) {
    const end = new Date(filters.toDate);
    end.setHours(23, 59, 59, 999);
    if (ts > end.getTime()) {
      return false;
    }
  }
  return true;
}

function resolveFollowerGrowthStats(growth = null) {
  if (!growth) return null;
  return {
    total: growth.totalFollowersGained ?? growth.followersGained ?? 0,
    matched: growth.matchedFollowers ?? null,
    timeline: growth.timeline || growth.followerTimeline || [],
    topPost: growth.postThatGainedMostFollowers || growth.topPost || null
  };
}

function InsightList({ title, items, valueLabel = "Ø Likes", limit = 5 }) {
  if (!items?.length) return null;
  const rows = items.slice(0, limit);
  return (
    <section style={{ marginBottom: "1rem" }}>
      <h4 style={{ marginBottom: "0.35rem" }}>{title}</h4>
      <ul className="analysis-list">
        {rows.map((entry, idx) => (
          <li key={`${title}-${idx}`}>
            <strong>{entry.hour !== undefined ? `${String(entry.hour).padStart(2, "0")}:00` : entry.weekday || entry.hashtag}</strong>
            <span>
              · {valueLabel} {numberFormatter.format(Math.round(entry.avgLikes ?? entry.avgComments ?? 0))} ({entry.posts ?? entry.uses ?? 0} Posts)
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PlatformSection({ platform, data }) {
  if (!data) return null;
  const title = platform.charAt(0).toUpperCase() + platform.slice(1);
  return (
    <div className="card" style={{ padding: "1rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <span className="badge">{data.itemCount || 0} Posts</span>
      </header>
      <div className="stat-row">
        <div>
          <div className="stat-value">{numberFormatter.format(Math.round(data.avgLikes || 0))}</div>
          <div className="stat-label">Ø Likes</div>
        </div>
        <div>
          <div className="stat-value">{numberFormatter.format(Math.round(data.avgComments || 0))}</div>
          <div className="stat-label">Ø Comments</div>
        </div>
      </div>
      <InsightList title="Beste Stunden" items={data.bestPostingHours} />
      <InsightList title="Beste Wochentage" items={data.bestWeekdays} />
      {data.topHashtags?.length ? (
        <section>
          <h4 style={{ marginBottom: "0.35rem" }}>Top Hashtags</h4>
          <ul className="analysis-list">
            {data.topHashtags.slice(0, 20).map((entry) => (
              <li key={`${platform}-hashtag-${entry.hashtag}`}>
                <strong>#{entry.hashtag}</strong>
                <span>
                  · Ø Likes {numberFormatter.format(Math.round(entry.avgLikes || 0))} ({entry.uses}x verwendet)
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export default function UploadAnalyzerPro({ token, lastUpload, onViewInsights = null, resetSignal = 0 }) {
  const [datasets, setDatasets] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [unifiedAnalysis, setUnifiedAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [analysisInfo, setAnalysisInfo] = useState("");
  const [dateFilters, setDateFilters] = useState({ fromDate: "", toDate: "" });
  const [appliedFilters, setAppliedFilters] = useState({ fromDate: "", toDate: "" });
  const [activeDateRange, setActiveDateRange] = useState(null);
  const [activeItemCount, setActiveItemCount] = useState(0);
  const [filtersError, setFiltersError] = useState("");
  const resetRef = useRef(resetSignal);

  const hasToken = Boolean(token);
  const globalStats = unifiedAnalysis?.global || null;
  const perPlatform = unifiedAnalysis?.perPlatform || {};
  const followerStats = useMemo(() => resolveFollowerGrowthStats(unifiedAnalysis?.followerGrowth), [unifiedAnalysis?.followerGrowth]);

  useEffect(() => {
    if (resetRef.current === resetSignal) return;
    resetRef.current = resetSignal;
    setDatasets([]);
    setSelectedId(null);
    setSelectedDataset(null);
    setUnifiedAnalysis(null);
    setError(null);
    setDetailLoading(false);
    setAnalysisLoading(false);
    setAnalysisInfo("");
    setDateFilters({ fromDate: "", toDate: "" });
    setAppliedFilters({ fromDate: "", toDate: "" });
    setActiveDateRange(null);
    setActiveItemCount(0);
    setFiltersError("");
  }, [resetSignal]);

  const loadDatasets = useCallback(
    async (selectFirst = false) => {
      if (!token) return;
      setListLoading(true);
      setError(null);
      try {
        const res = await getUploadDatasets(token);
        if (res.success) {
          const data = res.datasets || [];
          setDatasets(data);
          if ((selectFirst || !selectedId) && data.length) {
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

  const handleFilterChange = useCallback((field, value) => {
    setDateFilters((prev) => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    if (dateFilters.fromDate && dateFilters.toDate && dateFilters.fromDate > dateFilters.toDate) {
      setFiltersError("Das Von-Datum darf nicht nach dem Bis-Datum liegen.");
      return;
    }
    setFiltersError("");
    setAppliedFilters({
      fromDate: dateFilters.fromDate || "",
      toDate: dateFilters.toDate || ""
    });
  }, [dateFilters]);

  const loadDatasetDetail = useCallback(
    async (datasetId, preset) => {
      if (!token || !datasetId) return;
      setDetailLoading(true);
      setUnifiedAnalysis(preset?.metadata?.analysis || null);
      setError(null);
      try {
        if (preset) {
          setSelectedDataset(preset);
          setDetailLoading(false);
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
    loadDatasetDetail(selectedId);
  }, [selectedId, loadDatasetDetail]);

  useEffect(() => {
    if (!token || !lastUpload?.datasetId) return;
    const placeholder = {
      ...(lastUpload.dataset || {}),
      _id: lastUpload.datasetId,
      platform: lastUpload.platform || lastUpload.dataset?.platform || "mixed",
      status: lastUpload.dataset?.status || "uploaded",
      sourceFilename: lastUpload.fileName || lastUpload.dataset?.sourceFilename || "Upload.json",
      fileSize: lastUpload.fileSize || lastUpload.dataset?.fileSize || 0,
      totals: lastUpload.dataset?.totals || {
        posts: lastUpload.count || 0,
        links: lastUpload.count || 0
      },
      videos: lastUpload.posts || lastUpload.itemsPreview || [],
      createdAt: lastUpload.dataset?.createdAt || new Date().toISOString(),
      metadata: {
        ...(lastUpload.dataset?.metadata || {}),
        analysis: lastUpload.analysis || lastUpload.dataset?.metadata?.analysis,
        summary: lastUpload.summary || lastUpload.dataset?.metadata?.summary
      }
    };
    setDatasets((prev) => {
      const exists = prev.some((ds) => ds._id === placeholder._id);
      if (exists) return prev;
      return [placeholder, ...prev].slice(0, 20);
    });
    setSelectedId(placeholder._id);
    loadDatasetDetail(placeholder._id, placeholder);
  }, [lastUpload, token, loadDatasetDetail]);

  useEffect(() => {
    if (!token || !selectedDataset?._id) {
      setUnifiedAnalysis(null);
      setAnalysisInfo("");
      setActiveDateRange(null);
      setActiveItemCount(0);
      setAnalysisLoading(false);
      return undefined;
    }

    const hasLocalAnalysis = Boolean(selectedDataset.metadata?.analysis) && !appliedFilters.fromDate && !appliedFilters.toDate;
    if (hasLocalAnalysis) {
      const localAnalysis = selectedDataset.metadata.analysis;
      setUnifiedAnalysis(localAnalysis);
      setAnalysisInfo("");
      setActiveDateRange(null);
      setActiveItemCount(localAnalysis.global?.itemCount ?? selectedDataset.videos?.length ?? 0);
      setAnalysisLoading(false);
      return undefined;
    }

    let cancelled = false;
    setAnalysisLoading(true);
    setAnalysisInfo("");
    fetchUnifiedAnalysis(selectedDataset._id, token, appliedFilters)
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          setUnifiedAnalysis(res.analysis || null);
          setAnalysisInfo(res.message || (!res.analysis ? "Keine Analyse verfügbar." : ""));
          setActiveDateRange(res.dateRange || null);
          setActiveItemCount(res.itemCount ?? res.analysis?.global?.itemCount ?? 0);
        } else {
          setUnifiedAnalysis(null);
          setAnalysisInfo("Analyse konnte nicht geladen werden.");
          setActiveDateRange(null);
          setActiveItemCount(0);
          setError(res.error?.message || "Analyse konnte nicht geladen werden");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setUnifiedAnalysis(null);
          setAnalysisInfo("Analyse konnte nicht geladen werden.");
          setActiveDateRange(null);
          setActiveItemCount(0);
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setAnalysisLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDataset, token, appliedFilters]);

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

  const selectedSummary = selectedDataset?.metadata?.summary;
  const filteredPosts = useMemo(() => {
    if (!selectedDataset?.videos?.length) return [];
    return selectedDataset.videos.filter((item) => matchesDateFilters(item, appliedFilters));
  }, [selectedDataset?.videos, appliedFilters]);
  const sampleItems = filteredPosts.slice(0, 10);
  const totalPosts =
    filteredPosts.length ||
    selectedDataset?.totals?.posts ||
    selectedDataset?.metadata?.perPlatform?.tiktok?.count ||
    0;
  const hasPosts = totalPosts > 0;

  return (
    <div className="card" style={{ marginBottom: "2rem" }}>
      <div className="card-header" style={{ alignItems: "center" }}>
        <div>
          <h2 className="card-title">🧠 Upload Analyzer Pro</h2>
          <p className="card-subtitle">Plattformübergreifende Insights aus deinen JSON/ZIP Exporten.</p>
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
          <div className="dataset-list">
            {listLoading && datasets.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>Lade Uploads…</p>
            ) : datasets.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>Noch keine Uploads vorhanden.</p>
            ) : (
              datasets.map((dataset) => {
                const isActive = selectedId === dataset._id;
                return (
                  <button
                    type="button"
                    key={dataset._id}
                    onClick={() => setSelectedId(dataset._id)}
                    className={`dataset-card ${isActive ? "active" : ""}`}
                  >
                    <strong>{dataset.sourceFilename || "Upload.json"}</strong>
                    <span>{formatDate(dataset.createdAt)}</span>
                    <span>
                      📄 {dataset.totals?.posts ?? dataset.videos?.length ?? 0} Items · {formatFileSize(dataset.fileSize)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div>
          {detailLoading ? (
            <p style={{ color: "var(--text-muted)" }}>Lade Dataset Details…</p>
          ) : !selectedDataset ? (
            <p style={{ color: "var(--text-muted)" }}>Bitte wähle ein Dataset aus.</p>
          ) : (
            <>
              <header style={{ marginBottom: "1rem" }}>
                <h3 style={{ margin: 0 }}>{selectedDataset.sourceFilename || "Dataset"}</h3>
                <p className="card-subtitle" style={{ margin: 0 }}>
                  Erstellt am {formatDate(selectedDataset.createdAt)} · Größe {formatFileSize(selectedDataset.fileSize)}
                </p>
                <p className="card-subtitle" style={{ margin: 0 }}>
                  Plattformen: {Object.keys(selectedDataset.metadata?.perPlatform || {}).join(", ") || "—"}
                </p>
              </header>

              {selectedSummary && (
                <div className="status-message info" style={{ marginBottom: "1rem" }}>
                  {selectedSummary.processedFiles ?? 0} Dateien verarbeitet · {selectedSummary.ignoredFiles ?? 0} ignoriert ·{" "}
                  {selectedSummary.totalFiles ?? 0} gesamt
                </div>
              )}
              {!hasPosts && (
                <div className="status-message warning" style={{ marginBottom: "1rem" }}>
                  Keine Posts gefunden – vermutlich enthält der Export nur Watch/History-Daten.
                </div>
              )}

              <div className="analysis-filter-bar" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <label style={{ display: "flex", flexDirection: "column", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Von
                  <input
                    type="date"
                    value={dateFilters.fromDate}
                    onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Bis
                  <input
                    type="date"
                    value={dateFilters.toDate}
                    onChange={(e) => handleFilterChange("toDate", e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApplyFilters}
                  disabled={analysisLoading || !selectedDataset?._id}
                >
                  Analyse aktualisieren
                </button>
              </div>
              {filtersError && (
                <div className="status-message error" style={{ marginTop: "-0.5rem", marginBottom: "1rem" }}>
                  {filtersError}
                </div>
              )}

              <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
                <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0 }}>🌍 Globale Insights</h3>
                  <span className="badge">{activeItemCount || globalStats?.itemCount || sampleItems.length || 0} Posts</span>
                </header>
                {analysisLoading ? (
                  <p style={{ color: "var(--text-muted)" }}>Analysiere Metadaten…</p>
                ) : globalStats ? (
                  <>
                    <div className="stat-row">
                      <div>
                        <div className="stat-value">{numberFormatter.format(Math.round(globalStats.avgLikes || 0))}</div>
                        <div className="stat-label">Ø Likes</div>
                      </div>
                      <div>
                        <div className="stat-value">{numberFormatter.format(Math.round(globalStats.avgComments || 0))}</div>
                        <div className="stat-label">Ø Comments</div>
                      </div>
                    </div>
                    <InsightList title="Beste Stunden" items={globalStats.bestPostingHours} />
                    <InsightList title="Beste Wochentage" items={globalStats.bestWeekdays} />
                    {globalStats.topHashtags?.length ? (
                      <section>
                        <h4 style={{ marginBottom: "0.35rem" }}>Top Hashtags</h4>
                        <ul className="analysis-list">
                          {globalStats.topHashtags.slice(0, 20).map((entry) => (
                            <li key={`global-hashtag-${entry.hashtag}`}>
                              <strong>#{entry.hashtag}</strong>
                              <span>
                                · Ø Likes {numberFormatter.format(Math.round(entry.avgLikes || 0))} ({entry.uses}x verwendet)
                              </span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p style={{ color: "var(--text-muted)" }}>Noch keine Analyse vorhanden.</p>
                    {analysisInfo && <p className="card-subtitle">{analysisInfo}</p>}
                  </>
                )}
                {(analysisInfo || activeDateRange) && globalStats && (
                  <p className="card-subtitle" style={{ marginTop: "0.5rem" }}>
                    {analysisInfo || ""} {activeDateRange ? `· Zeitraum: ${formatRangeLabel(activeDateRange)}` : ""}
                  </p>
                )}
              </div>
              {followerStats && (
                <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
                  <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0 }}>📈 Follower Wachstum</h3>
                    <span className="badge">{followerStats.total} neue Follower</span>
                  </header>
                  <div className="stat-row">
                    <div>
                      <div className="stat-value">{numberFormatter.format(followerStats.total || 0)}</div>
                      <div className="stat-label">Follower im Zeitraum</div>
                    </div>
                    <div>
                      <div className="stat-value">{numberFormatter.format(followerStats.matched || 0)}</div>
                      <div className="stat-label">Follows Posts zugeordnet</div>
                    </div>
                  </div>
                  {followerStats.topPost && (
                    <div className="status-message info" style={{ marginBottom: "0.75rem" }}>
                      Meiste Follower ausgelöst von Post{" "}
                      <strong>{followerStats.topPost.caption || "Unbenannter Post"}</strong>{" "}
                      ({numberFormatter.format(followerStats.topPost.followers || followerStats.topPost.followersGained || 0)} neue Follower)
                      {followerStats.topPost.link ? (
                        <>
                          {" "}
                          ·{" "}
                          <a
                            href={followerStats.topPost.link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Link öffnen
                          </a>
                        </>
                      ) : null}
                    </div>
                  )}
                  {followerStats.timeline.length
                    ? (() => {
                        const maxCount = followerStats.timeline.reduce(
                          (acc, entry) => Math.max(acc, entry.count || entry.gained || 0),
                          1
                        );
                        return (
                          <div className="timeline-list">
                            {followerStats.timeline.map((entry) => (
                              <div
                                key={entry.date}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                  marginBottom: "0.35rem"
                                }}
                              >
                                <div style={{ width: "120px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                  {formatTimelineDate(entry.date)}
                                </div>
                                <div
                                  style={{
                                    flex: 1,
                                    height: "6px",
                                    background: "var(--surface-muted)",
                                    borderRadius: "999px",
                                    position: "relative"
                                  }}
                                >
                                  <span
                                    style={{
                                      position: "absolute",
                                      left: 0,
                                      top: 0,
                                      bottom: 0,
                                      width: `${Math.min(100, (((entry.count ?? entry.gained) || 0) / maxCount) * 100)}%`,
                                      background: "var(--primary)",
                                      borderRadius: "999px"
                                    }}
                                  />
                                </div>
                                <div style={{ width: "40px", textAlign: "right", fontWeight: 600 }}>
                                  {entry.count ?? entry.gained ?? 0}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()
                    : (
                    <p style={{ color: "var(--text-muted)" }}>Keine Follower-Daten vorhanden.</p>
                  )}
                </div>
              )}

              <div className="platform-grid">
                {Object.entries(perPlatform).map(([platform, data]) => (
                  <PlatformSection key={platform} platform={platform} data={data} />
                ))}
              </div>

              {sampleItems.length ? (
                <section style={{ marginTop: "1.5rem" }}>
                  <h3>📋 Post-Beispiele</h3>
                  <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Plattform</th>
                          <th>Datum</th>
                          <th>Caption</th>
                          <th>Likes</th>
                          <th>Kommentare</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sampleItems.map((item, index) => (
                          <tr key={item.link || index}>
                            <td>{item.platform}</td>
                            <td>{formatDate(item.date)}</td>
                            <td style={{ textAlign: "left" }}>{item.caption || item.title || "—"}</td>
                            <td style={{ textAlign: "center" }}>{numberFormatter.format(item.likes || 0)}</td>
                            <td style={{ textAlign: "center" }}>{numberFormatter.format(item.comments || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : null}
              {onViewInsights && unifiedAnalysis && (
                <div className="insights-action-row" style={{ justifyContent: "flex-end", marginTop: "1.5rem" }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={analysisLoading}
                    onClick={() => onViewInsights(selectedDataset, unifiedAnalysis, selectedDataset?.metadata || {})}
                  >
                    🔍 Creator Insights öffnen
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


