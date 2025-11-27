import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchTikTokAnalysis } from "../api.js";
import PlatformAnalysisView from "../components/insights/PlatformAnalysisView.jsx";

export default function TikTokAnalyzerPro({ token }) {
  const { id: datasetId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [videoCount, setVideoCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const response = await fetchTikTokAnalysis(datasetId, token);
      if (!active) return;
      if (!response?.success) {
        setError(response?.message || response?.error?.message || "Analyse konnte nicht geladen werden.");
        setLoading(false);
        return;
      }
      setAnalysis(response.analysis || null);
      setVideoCount(response.videoCount ?? 0);
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [datasetId, token]);

  return (
    <PlatformAnalysisView
      platform="tiktok"
      datasetId={datasetId}
      loading={loading}
      error={error}
      analysis={analysis}
      videoCount={videoCount}
    />
  );
}

