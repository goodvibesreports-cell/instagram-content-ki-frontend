import React, { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import {
  getUploadDataset,
  fetchUnifiedAnalysis,
  exportInsightsPdf,
  exportInsightsCsv,
  generateShareLink
} from "../api";
import SummaryCards from "../components/insights/SummaryCards.jsx";
import BestTimesCharts from "../components/insights/BestTimesCharts.jsx";
import TopVideosGrid from "../components/insights/TopVideosGrid.jsx";
import CreatorDNASection from "../components/insights/CreatorDNASection.jsx";
import AISummary from "../components/insights/AISummary.jsx";
import { INSIGHTS_STORAGE_KEY } from "../constants/storageKeys";
import "../components/insights/TikTokInsights.css";

const numberFormatter = new Intl.NumberFormat("de-DE");

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return numberFormatter.format(Math.round(value));
}

function matchesDateFilters(entry = {}, filters = {}) {
  if (!filters?.fromDate && !filters?.toDate) return true;
  const ts =
    typeof entry.timestamp === "number"
      ? entry.timestamp
      : entry.timestamp
      ? Number(entry.timestamp)
      : entry.date
      ? Date.parse(entry.date)
      : NaN;
  if (!Number.isFinite(ts)) return false;
  if (filters.fromDate) {
    const start = new Date(filters.fromDate);
    start.setHours(0, 0, 0, 0);
    if (ts < start.getTime()) return false;
  }
  if (filters.toDate) {
    const end = new Date(filters.toDate);
    end.setHours(23, 59, 59, 999);
    if (ts > end.getTime()) return false;
  }
  return true;
}

function formatDateRangeLabel(range) {
  if (!range || (!range.from && !range.to)) return "Alle Daten";
  const format = (value, fallback) => {
    if (!value) return fallback;
    try {
      return new Date(value).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch {
      return fallback;
    }
  };
  return `${format(range.from, "Start")} – ${format(range.to, "Heute")}`;
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
    return "—";
  }
}

function resolveFollowerGrowthStats(growth = null) {
  if (!growth) return null;
  return {
    total: growth.totalFollowersGained ?? growth.followersGained ?? 0,
    timeline: growth.timeline || growth.followerTimeline || [],
    topPost: growth.postThatGainedMostFollowers || growth.topPost || null
  };
}

export default function TikTokInsights({
  token,
  datasetContext,
  onUpdateContext,
  profileName = "Creator",
  readOnly = false,
  onBack
}) {
  const hourChartRef = useRef(null);
  const dayChartRef = useRef(null);

  const activeContext = useMemo(() => {
    if (datasetContext) return datasetContext;
    try {
      const cached = sessionStorage.getItem(INSIGHTS_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }, [datasetContext]);

  const [dataset, setDataset] = useState(() => datasetContext?.dataset || datasetContext || activeContext?.dataset || activeContext || null);
  const [loading, setLoading] = useState(!dataset);
  const [error, setError] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [unifiedAnalysis, setUnifiedAnalysis] = useState(() => datasetContext?.analysis || activeContext?.analysis || null);
  const [dateFilters, setDateFilters] = useState({ fromDate: "", toDate: "" });
  const [appliedFilters, setAppliedFilters] = useState({ fromDate: "", toDate: "" });
  const [filtersError, setFiltersError] = useState("");
  const [activeDateRange, setActiveDateRange] = useState(() => datasetContext?.dateRange || activeContext?.dateRange || null);
  const [itemCount, setItemCount] = useState(() => datasetContext?.itemCount || activeContext?.itemCount || datasetContext?.analysis?.global?.itemCount || 0);
  const [aiSummary, setAiSummary] = useState(datasetContext?.aiSummary || activeContext?.aiSummary || null);
  const [notification, setNotification] = useState(null);
  const [actionLoading, setActionLoading] = useState({ pdf: false, csv: false, share: false });
  const contextSignatureRef = useRef(null);
  const datasetId = datasetContext?.datasetId || datasetContext?._id || activeContext?.datasetId || dataset?._id || null;

  useEffect(() => {
    if (!datasetContext) return;
    const nextDataset = datasetContext.dataset || datasetContext;
    setDataset(nextDataset);
    if (datasetContext.analysis) {
      setUnifiedAnalysis(datasetContext.analysis);
      setItemCount(datasetContext.itemCount ?? datasetContext.analysis?.global?.itemCount ?? nextDataset?.videos?.length ?? 0);
      setActiveDateRange(datasetContext.dateRange || null);
    }
  }, [datasetContext]);

  useEffect(() => {
    if (datasetContext || !activeContext) return;
    if (!dataset) {
      setDataset(activeContext.dataset || activeContext);
    }
    if (activeContext.analysis && !unifiedAnalysis) {
      setUnifiedAnalysis(activeContext.analysis);
      setItemCount(activeContext.itemCount ?? activeContext.analysis?.global?.itemCount ?? 0);
      setActiveDateRange(activeContext.dateRange || null);
    }
  }, [datasetContext, activeContext, dataset, unifiedAnalysis]);

  useEffect(() => {
    if (!datasetId || readOnly || !token) {
      setLoading(false);
      if (!dataset && activeContext) {
        setDataset(activeContext.dataset || activeContext);
      }
      return;
    }

    if (dataset && (dataset._id === datasetId || dataset.datasetId === datasetId) && dataset.videos?.length) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    getUploadDataset(token, datasetId)
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          setDataset(res.dataset);
        } else {
          setError(res.error?.message || "Dataset konnte nicht geladen werden.");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Dataset konnte nicht geladen werden.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, datasetId, readOnly, dataset, activeContext]);

  useEffect(() => {
    if (!datasetId) {
      if (activeContext?.analysis) {
        setUnifiedAnalysis(activeContext.analysis);
        setActiveDateRange(activeContext.dateRange || null);
        setItemCount(activeContext.itemCount ?? activeContext.analysis?.global?.itemCount ?? 0);
      }
      setAnalysisLoading(false);
      return;
    }

    if (!token || readOnly) {
      setAnalysisLoading(false);
      return;
    }

    const noFilters = !appliedFilters.fromDate && !appliedFilters.toDate;
    const localAnalysis = noFilters
      ? datasetContext?.analysis || dataset?.metadata?.analysis || activeContext?.analysis || null
      : null;

    if (localAnalysis) {
      setUnifiedAnalysis(localAnalysis);
      setActiveDateRange(datasetContext?.dateRange || null);
      setItemCount(
        datasetContext?.itemCount ??
          dataset?.metadata?.analysis?.global?.itemCount ??
          localAnalysis?.global?.itemCount ??
          dataset?.videos?.length ??
          0
      );
      setAnalysisLoading(false);
      setAnalysisError(null);
      return;
    }

    let cancelled = false;
    setAnalysisLoading(true);
    setAnalysisError(null);
    fetchUnifiedAnalysis(datasetId, token, appliedFilters)
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          setUnifiedAnalysis(res.analysis || null);
          setItemCount(res.itemCount ?? res.analysis?.global?.itemCount ?? 0);
          setActiveDateRange(res.dateRange || null);
        } else {
          setUnifiedAnalysis(null);
          setItemCount(0);
          setActiveDateRange(null);
          setAnalysisError(res.error?.message || "Analyse konnte nicht geladen werden.");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setUnifiedAnalysis(null);
          setItemCount(0);
          setActiveDateRange(null);
          setAnalysisError(err.message || "Analyse konnte nicht geladen werden.");
        }
      })
      .finally(() => {
        if (!cancelled) setAnalysisLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [datasetId, token, appliedFilters, readOnly, datasetContext, dataset, activeContext]);

  const availablePosts = useMemo(() => {
    if (dataset?.videos?.length) return dataset.videos;
    if (activeContext?.videos?.length) return activeContext.videos;
    return [];
  }, [dataset?.videos, activeContext?.videos]);

  const filteredPosts = useMemo(() => {
    if (!availablePosts.length) return [];
    return availablePosts.filter((item) => matchesDateFilters(item, appliedFilters));
  }, [availablePosts, appliedFilters]);

  const topVideos = useMemo(() => {
    if (!filteredPosts.length) return [];
    return filteredPosts
      .slice()
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 6);
  }, [filteredPosts]);

  const postsPreview = useMemo(() => filteredPosts.slice(0, 10), [filteredPosts]);

  const resolvedAnalysis = unifiedAnalysis || datasetContext?.analysis || activeContext?.analysis || null;
  const perPlatform = resolvedAnalysis?.perPlatform || {};
  const globalAnalysis = resolvedAnalysis?.global || null;
  const tiktokAnalysis = perPlatform.tiktok || null;
  const insightSource = tiktokAnalysis || globalAnalysis || null;
  const followerStats = resolveFollowerGrowthStats(resolvedAnalysis?.followerGrowth || null);

  const datasetName = dataset?.sourceFilename || activeContext?.datasetName || "TikTok Export";
  const displayProfileName = activeContext?.profileName || profileName;
  const platformName = "tiktok";
  const platformLabel = "TikTok";

  const summaryCards = useMemo(() => {
    if (!insightSource) return [];
    const bestHour = insightSource.bestPostingHours?.[0]?.hour ?? null;
    const bestDay = insightSource.bestWeekdays?.[0]?.weekday ?? insightSource.bestWeekdays?.[0]?.day ?? null;
    return [
      { label: "Total Posts", value: formatNumber(insightSource.itemCount ?? filteredPosts.length ?? 0), icon: "🎬" },
      { label: "Ø Likes", value: formatNumber(insightSource.avgLikes ?? 0), icon: "👍" },
      { label: "Ø Comments", value: formatNumber(insightSource.avgComments ?? 0), icon: "💬" },
      {
        label: "Best Upload Time",
        value: bestHour !== null ? `${String(bestHour).padStart(2, "0")}:00` : "—",
        icon: "⏰"
      },
      { label: "Best Upload Day", value: bestDay || "—", icon: "📅" }
    ];
  }, [insightSource, filteredPosts.length]);

  useEffect(() => {
    if (readOnly || !insightSource) return;
    const derivedDatasetId = datasetId || dataset?._id || null;
    if (!derivedDatasetId) return;
    const signaturePayload = {
      datasetId: derivedDatasetId,
      updatedAt: dataset?.updatedAt || activeContext?.updatedAt || null,
      items: insightSource.itemCount || 0,
      followers: followerStats?.total || 0,
      filters: appliedFilters
    };
    const signature = JSON.stringify(signaturePayload);
    if (contextSignatureRef.current === signature) {
      return;
    }
    contextSignatureRef.current = signature;
    const contextPayload = {
      datasetId: derivedDatasetId,
      datasetName,
      updatedAt: dataset?.updatedAt || new Date().toISOString(),
      analysis: resolvedAnalysis,
      meta: dataset?.metadata?.summary || activeContext?.meta || {},
      profileName: displayProfileName,
      aiSummary,
      platform: platformName,
      dateRange: activeDateRange,
      itemCount: insightSource.itemCount
    };
    sessionStorage.setItem(INSIGHTS_STORAGE_KEY, JSON.stringify(contextPayload));
    onUpdateContext?.(contextPayload);
  }, [
    insightSource,
    resolvedAnalysis,
    datasetId,
    dataset?._id,
    dataset?.updatedAt,
    displayProfileName,
    unifiedAnalysis,
    activeContext,
    aiSummary,
    platformName,
    readOnly,
    onUpdateContext,
    datasetName,
    activeDateRange,
    appliedFilters,
    followerStats
  ]);

  const metaSummary = dataset?.metadata?.summary || activeContext?.meta || {};
  const processedLinks = formatNumber(itemCount || insightSource?.itemCount || filteredPosts.length);

  function showToast(message, type = "info") {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }

  async function captureCharts() {
    const charts = [];
    async function capture(ref, title) {
      if (!ref.current) return;
      const canvas = await html2canvas(ref.current, { backgroundColor: "#ffffff", scale: 2 });
      charts.push({ title, dataUrl: canvas.toDataURL("image/png") });
    }
    await capture(hourChartRef, "Beste Upload-Stunden");
    await capture(dayChartRef, "Beste Upload-Tage");
    return charts;
  }

  function downloadBlob(data, filename, type) {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportPdf() {
    if (readOnly) return;
    if (!insightSource) {
      showToast("Keine Analyse-Daten verfügbar.", "error");
      return;
    }
    setActionLoading((prev) => ({ ...prev, pdf: true }));
    try {
      const charts = await captureCharts();
      const response = await exportInsightsPdf(
        {
          analysis: insightSource,
          videos: topVideos,
          creatorDNA: insightSource.creatorDNA,
          aiSummary,
          meta: metaSummary,
          datasetName,
          profileName: displayProfileName,
          charts
        },
        token
      );
      if (response?.success === false) {
        showToast(response.error?.message || "PDF export failed", "error");
        return;
      }
      downloadBlob(response, `tiktok_insights_${Date.now()}.pdf`, "application/pdf");
      showToast("PDF erfolgreich erstellt", "success");
    } catch (err) {
      showToast(err.message || "PDF export fehlgeschlagen", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, pdf: false }));
    }
  }

  async function handleExportCsv() {
    if (readOnly) return;
    if (!filteredPosts.length) {
      showToast("Keine Post-Daten für CSV vorhanden.", "error");
      return;
    }
    setActionLoading((prev) => ({ ...prev, csv: true }));
    try {
      const response = await exportInsightsCsv(filteredPosts, token);
      if (response?.success === false) {
        showToast(response.error?.message || "CSV export failed", "error");
        return;
      }
      downloadBlob(response, "tiktok_analysis.csv", "text/csv");
      showToast("CSV erfolgreich exportiert", "success");
    } catch (err) {
      showToast(err.message || "CSV export fehlgeschlagen", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, csv: false }));
    }
  }

  async function handleShareLink() {
    if (readOnly) return;
    if (!unifiedAnalysis) {
      showToast("Keine Analyse-Daten verfügbar.", "error");
      return;
    }
    setActionLoading((prev) => ({ ...prev, share: true }));
    try {
      const response = await generateShareLink(
        {
          datasetName,
          profileName: displayProfileName,
          analysis: unifiedAnalysis,
          meta: metaSummary,
          aiSummary,
          platform: platformName
        },
        token
      );
      if (!response.success) {
        showToast(response.error?.message || "Share-Link konnte nicht erstellt werden.", "error");
        return;
      }
      const shareUrl = response.data?.shareUrl || `${window.location.origin}/share/${response.data?.token}`;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
      showToast("Share-Link kopiert!", "success");
    } catch (err) {
      showToast(err.message || "Share-Link fehlgeschlagen", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, share: false }));
    }
  }

  const handleFilterChange = (field, value) => {
    setDateFilters((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilters = () => {
    if (dateFilters.fromDate && dateFilters.toDate && dateFilters.fromDate > dateFilters.toDate) {
      setFiltersError("Das Von-Datum darf nicht nach dem Bis-Datum liegen.");
      return;
    }
    setFiltersError("");
    setAppliedFilters({
      fromDate: dateFilters.fromDate || "",
      toDate: dateFilters.toDate || ""
    });
  };

  if (loading || (analysisLoading && !insightSource)) {
    return (
      <div className="tiktok-insights-page">
        <div className="insights-section">Analysiere Dataset…</div>
      </div>
    );
  }

  if (!insightSource) {
    return (
      <div className="insights-placeholder">
        {analysisError || error || "Keine Insights verfügbar. Bitte wähle im Upload Analyzer ein Dataset aus."}
      </div>
    );
  }

  return (
    <div className="tiktok-insights-page">
      <div className="insights-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <h2>Content Insights ({platformLabel})</h2>
          <span className={`platform-badge platform-${platformName}`}>{platformLabel}</span>
        </div>
        <div className="insights-meta">
          <span>📁 {datasetName}</span>
          <span>📅 {dataset?.updatedAt ? new Date(dataset.updatedAt).toLocaleString("de-DE") : "—"}</span>
          <span>🔄 analysierte Posts: {processedLinks}</span>
        </div>
      </div>

      <div className="analysis-filter-bar" style={{ marginBottom: "1rem" }}>
        <label>
          Von
          <input
            type="date"
            value={dateFilters.fromDate}
            onChange={(e) => handleFilterChange("fromDate", e.target.value)}
            disabled={readOnly || !token}
          />
        </label>
        <label>
          Bis
          <input
            type="date"
            value={dateFilters.toDate}
            onChange={(e) => handleFilterChange("toDate", e.target.value)}
            disabled={readOnly || !token}
          />
        </label>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleApplyFilters}
          disabled={readOnly || !token || analysisLoading}
        >
          Analyse aktualisieren
        </button>
        {activeDateRange && (
          <span className="analysis-range-label">Zeitraum: {formatDateRangeLabel(activeDateRange)}</span>
        )}
      </div>
      {filtersError && (
        <div className="status-message error" style={{ marginBottom: "1rem" }}>
          {filtersError}
        </div>
      )}
      {analysisError && (
        <div className="status-message error" style={{ marginBottom: "1rem" }}>
          {analysisError}
        </div>
      )}

      {(onBack || !readOnly) && (
        <div className="insights-action-bar">
          {onBack && (
            <button type="button" className="btn btn-ghost" onClick={onBack}>
              ← Zurück zum Dashboard
            </button>
          )}
          {!readOnly && (
            <div className="insights-action-buttons">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleExportPdf}
                disabled={actionLoading.pdf || analysisLoading}
              >
                {actionLoading.pdf ? "Exportiere…" : "📄 Export PDF"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleExportCsv}
                disabled={actionLoading.csv || analysisLoading}
              >
                {actionLoading.csv ? "Erstelle CSV…" : "📊 Export CSV"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleShareLink}
                disabled={actionLoading.share || analysisLoading}
              >
                {actionLoading.share ? "Erstelle Link…" : "🔗 Share Public Link"}
              </button>
            </div>
          )}
        </div>
      )}
      {notification && (
        <div className={`status-message ${notification.type || "info"} insights-toast`}>
          {notification.message}
        </div>
      )}

      <SummaryCards cards={summaryCards} />
      <BestTimesCharts analysis={globalAnalysis || insightSource} chartRefs={{ hoursRef: hourChartRef, daysRef: dayChartRef }} />
      <TopVideosGrid videos={topVideos} />

      {followerStats && (
        <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>📈 Follower Wachstum</h3>
            <span className="badge">{followerStats.total} neue Follower</span>
          </header>
          <div className="stat-row">
            <div>
              <div className="stat-value">{formatNumber(followerStats.total)}</div>
              <div className="stat-label">Follower im Zeitraum</div>
            </div>
          </div>
          {followerStats.topPost && (
            <div className="status-message info" style={{ marginBottom: "0.75rem" }}>
              Meiste Follower ausgelöst von Post{" "}
              <strong>{followerStats.topPost.caption || "Unbenannter Post"}</strong>{" "}
              ({formatNumber(followerStats.topPost.followers || followerStats.topPost.followersGained || 0)} neue Follower)
              {followerStats.topPost.link ? (
                <>
                  {" "}
                  ·{" "}
                  <a href={followerStats.topPost.link} target="_blank" rel="noreferrer">
                    Link öffnen
                  </a>
                </>
              ) : null}
            </div>
          )}
          {followerStats.timeline.length ? (
            (() => {
              const maxCount = followerStats.timeline.reduce(
                (acc, entry) => Math.max(acc, entry.count || entry.gained || 0),
                1
              );
              return (
                <div className="timeline-list">
                  {followerStats.timeline.map((entry) => (
                    <div
                      key={entry.date}
                      style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}
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
          ) : (
            <p style={{ color: "var(--text-muted)" }}>Keine Follower-Daten vorhanden.</p>
          )}
        </div>
      )}

      {postsPreview.length ? (
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
                {postsPreview.map((item, index) => (
                  <tr key={item.link || index}>
                    <td>{item.platform}</td>
                    <td>{item.date ? new Date(item.date).toLocaleString("de-DE") : "—"}</td>
                    <td style={{ textAlign: "left" }}>{item.caption || item.title || "—"}</td>
                    <td style={{ textAlign: "center" }}>{formatNumber(item.likes || 0)}</td>
                    <td style={{ textAlign: "center" }}>{formatNumber(item.comments || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="status-message warning" style={{ marginTop: "1rem" }}>
          Keine Posts im ausgewählten Zeitraum gefunden.
        </div>
      )}

      <CreatorDNASection
        dna={insightSource?.creatorDNA}
        themes={insightSource?.themes}
        sounds={insightSource?.sounds}
      />
      <AISummary
        token={token}
        analysis={insightSource}
        datasetId={datasetId}
        summary={aiSummary}
        onSummaryChange={setAiSummary}
        readOnly={readOnly}
      />
    </div>
  );
}

