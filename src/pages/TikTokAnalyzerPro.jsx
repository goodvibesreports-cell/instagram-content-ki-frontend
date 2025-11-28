import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchTikTokAnalysis } from "../api.js";
import PlatformAnalysisView from "../components/insights/PlatformAnalysisView.jsx";

export default function TikTokAnalyzerPro({ token, onBack }) {
  const { id: datasetId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [videoCount, setVideoCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilters, setDateFilters] = useState({ fromDate: "", toDate: "" });
  const [appliedFilters, setAppliedFilters] = useState({ fromDate: "", toDate: "" });
  const [filtersError, setFiltersError] = useState("");
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    if (!datasetId) {
      setError("Dataset ID fehlt");
      setLoading(false);
      return;
    }
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      const response = await fetchTikTokAnalysis(datasetId, token, appliedFilters);
      if (!active) return;
      if (!response?.success) {
        setError(response?.message || response?.error?.message || "Analyse konnte nicht geladen werden.");
        setLoading(false);
        return;
      }
      setAnalysis(response.analysis || null);
      setVideoCount(response.itemCount ?? response.videoCount ?? 0);
      setDateRange(response.dateRange || null);
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [datasetId, token, appliedFilters]);

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

  return (
    <>
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="analysis-filter-bar" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Von
            <input
              type="date"
              value={dateFilters.fromDate}
              onChange={(e) => setDateFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Bis
            <input
              type="date"
              value={dateFilters.toDate}
              onChange={(e) => setDateFilters((prev) => ({ ...prev, toDate: e.target.value }))}
            />
          </label>
          <button type="button" className="btn btn-primary" onClick={handleApplyFilters} disabled={loading}>
            Analyse aktualisieren
          </button>
        </div>
        {filtersError && (
          <div className="status-message error" style={{ marginTop: "0.75rem" }}>
            {filtersError}
          </div>
        )}
      </div>
      <PlatformAnalysisView
        platform="tiktok"
        datasetId={datasetId}
        loading={loading}
        error={error}
        analysis={analysis}
        videoCount={videoCount}
        onBack={onBack}
        dateRange={dateRange}
      />
    </>
  );
}

