import React, { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import {
  getUploadDataset,
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
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiSummary, setAiSummary] = useState(datasetContext?.aiSummary || null);
  const [notification, setNotification] = useState(null);
  const [actionLoading, setActionLoading] = useState({ pdf: false, csv: false, share: false });
  const contextSignatureRef = useRef(null);

  const activeContext = useMemo(() => {
    if (datasetContext) return datasetContext;
    try {
      const cached = sessionStorage.getItem(INSIGHTS_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }, [datasetContext]);

  const datasetId = activeContext?.datasetId;

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      if (readOnly || !datasetId || !token) {
        if (activeContext?.analysis) {
          setDataset(activeContext);
          setAiSummary(activeContext.aiSummary || null);
        } else if (!token && !readOnly) {
          setError("Bitte über den Upload-Analyzer ein Dataset auswählen.");
        }
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await getUploadDataset(token, datasetId);
        if (!isMounted) return;
        if (!res.success) {
          setError(res.error?.message || "Dataset konnte nicht geladen werden.");
          setLoading(false);
          return;
        }
        const enriched = {
          ...res.dataset,
          analysis: res.dataset.metadata?.analysis || activeContext?.analysis,
          meta: res.dataset.metadata?.meta || activeContext?.meta,
          profileName
        };
        setDataset(enriched);
        setAiSummary(activeContext?.aiSummary || null);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || "Dataset konnte nicht geladen werden.");
        setLoading(false);
      }
    }

    initialize();
    return () => {
      isMounted = false;
    };
  }, [token, datasetId, readOnly, activeContext, profileName]);

  const analysis = dataset?.analysis || activeContext?.analysis;
  const meta = dataset?.meta || activeContext?.meta || analysis?.meta || {};
  const datasetName = dataset?.sourceFilename || activeContext?.datasetName || "TikTok Export";
  const basicStats = analysis?.basicStats || analysis?.stats || {};
  const platformName = (analysis?.platform || dataset?.platform || dataset?.rawPlatform || "tiktok").toLowerCase();
  const platformLabel = platformName.charAt(0).toUpperCase() + platformName.slice(1);
  const processedLinks = meta?.processed_links_count ?? dataset?.totals?.links ?? basicStats.totalPosts ?? 0;
  const displayProfileName = activeContext?.profileName || profileName;
  const tiktokInsights = analysis?.platformInsights?.tiktok || (analysis?.bestTimes ? analysis : null);

  useEffect(() => {
    if (readOnly || !analysis) return;
    const derivedDatasetId = datasetId || dataset?._id || null;
    if (!derivedDatasetId) return;
    const signaturePayload = {
      datasetId: derivedDatasetId,
      updatedAt: dataset?.updatedAt || activeContext?.updatedAt || null,
      items: analysis?.global?.itemCount ?? 0,
      followers: analysis?.followerGrowth?.followersGained ?? 0
    };
    const signature = JSON.stringify(signaturePayload);
    if (contextSignatureRef.current === signature) {
      return;
    }
    contextSignatureRef.current = signature;
    const contextPayload = {
      datasetId: derivedDatasetId,
      datasetName,
      updatedAt: signaturePayload.updatedAt || new Date().toISOString(),
      analysis,
      meta,
      profileName: displayProfileName,
      aiSummary,
      platform: platformName
    };
    sessionStorage.setItem(INSIGHTS_STORAGE_KEY, JSON.stringify(contextPayload));
    onUpdateContext?.(contextPayload);
  }, [analysis, meta, datasetId, dataset?.updatedAt, aiSummary, datasetName, displayProfileName, activeContext, onUpdateContext, readOnly, platformName]);

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
    if (!analysis) {
      showToast("Keine Analyse-Daten verfügbar.", "error");
      return;
    }
    setActionLoading((prev) => ({ ...prev, pdf: true }));
    try {
      const charts = await captureCharts();
      const exportAnalysis = tiktokInsights || analysis;
      const response = await exportInsightsPdf(
        {
          analysis: exportAnalysis,
          videos: tiktokInsights?.virality?.viralVideos || analysis.topPostsByLikes || [],
          creatorDNA: exportAnalysis.creator_dna || exportAnalysis.creatorDNA,
          aiSummary,
          meta,
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
    if (!dataset?.posts?.length) {
      showToast("Keine Post-Daten für CSV vorhanden.", "error");
      return;
    }
    setActionLoading((prev) => ({ ...prev, csv: true }));
    try {
      const response = await exportInsightsCsv(dataset.posts, token);
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
    if (!analysis) {
      showToast("Keine Analyse-Daten verfügbar.", "error");
      return;
    }
    setActionLoading((prev) => ({ ...prev, share: true }));
    try {
      const response = await generateShareLink(
        {
          datasetName,
          profileName: displayProfileName,
          analysis,
          meta,
          aiSummary,
          platform: platformName
        },
        token
      );
      if (!response.success) {
        showToast(response.error?.message || "Share-Link konnte nicht erstellt werden.", "error");
        return;
      }
      const shareUrl =
        response.data?.shareUrl ||
        `${window.location.origin}/share/${response.data?.token}`;
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

  const summaryCards = useMemo(() => {
    if (!analysis) return [];
    const bestHour =
      (analysis.bestTimes?.bestHour !== undefined && analysis.bestTimes?.bestHour !== null
        ? analysis.bestTimes.bestHour
        : analysis.bestPostingHours?.[0]?.hour) ?? null;
    const bestDay =
      analysis.bestDays?.bestDay ||
      analysis.bestDaysOfWeek?.[0]?.day ||
      null;
    return [
      {
        label: "Total Posts",
        value: basicStats.totalPosts ?? meta?.total_posts ?? "—",
        icon: "🎬"
      },
      {
        label: "Avg Likes",
        value: basicStats.avgLikes ?? (analysis.stats?.avgLikes ? Math.round(analysis.stats.avgLikes) : "—"),
        icon: "👍"
      },
      {
        label: "Median Likes",
        value: analysis.stats?.medianLikes ? Math.round(analysis.stats.medianLikes) : "—",
        icon: "📐"
      },
      {
        label: "Best Upload Time",
        value: bestHour !== null ? `${String(bestHour).padStart(2, "0")}:00` : "—",
        icon: "⏰"
      },
      {
        label: "Best Upload Day",
        value: bestDay || "—",
        icon: "📅"
      }
    ];
  }, [analysis, meta, basicStats]);

  if (loading) {
    return (
      <div className="tiktok-insights-page">
        <div className="insights-section">Analysiere Dataset…</div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="insights-placeholder">
        {error || "Keine Insights verfügbar. Bitte wähle im Upload Analyzer ein Dataset aus."}
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
          <span>
            📅 {dataset?.updatedAt ? new Date(dataset.updatedAt).toLocaleString("de-DE") : "—"}
          </span>
          <span>
            🔄 zuletzt aktualisiert:{" "}
            {processedLinks} Links verarbeitet
          </span>
        </div>
      </div>

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
                disabled={actionLoading.pdf}
                title="Download as PDF"
              >
                {actionLoading.pdf ? "Exportiere…" : "📄 Export PDF"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleExportCsv}
                disabled={actionLoading.csv}
                title="Download CSV"
              >
                {actionLoading.csv ? "Erstelle CSV…" : "📊 Export CSV"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleShareLink}
                disabled={actionLoading.share}
                title="Create shareable link"
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
      <BestTimesCharts analysis={tiktokInsights || analysis} chartRefs={{ hoursRef: hourChartRef, daysRef: dayChartRef }} />
      <TopVideosGrid videos={(tiktokInsights?.virality?.viralVideos || analysis.topPostsByLikes || [])} />
      <CreatorDNASection dna={tiktokInsights?.creator_dna || analysis.creatorDNA} themes={analysis.themes} sounds={analysis.sounds} />
      <AISummary
        token={token}
        analysis={tiktokInsights || analysis}
        datasetId={datasetId}
        summary={aiSummary}
        onSummaryChange={setAiSummary}
        readOnly={readOnly}
      />
    </div>
  );
}

