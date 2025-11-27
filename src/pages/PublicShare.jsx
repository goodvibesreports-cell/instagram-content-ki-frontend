import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchSharedInsights } from "../api";
import TikTokInsights from "./TikTokInsights.jsx";
import "../components/insights/TikTokInsights.css";

export default function PublicSharePage() {
  const { token } = useParams();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      const response = await fetchSharedInsights(token);
      if (!isMounted) return;
      if (!response.success) {
        setError(response.error?.message || "Share-Link ungültig oder abgelaufen.");
        setLoading(false);
        return;
      }
      setPayload(response.data.payload);
      setLoading(false);
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <main className="public-share-page">
      <div className="public-share-card">
        <header className="public-share-header">
          <div>
            <h1>Content Insights (Public Share)</h1>
            <p>Read-only Report · Token: {token}</p>
          </div>
          <Link to="/login" className="btn btn-secondary">
            Zur App
          </Link>
        </header>
        {loading ? (
          <div className="insights-placeholder">Lade öffentliche Analyse…</div>
        ) : error ? (
          <div className="insights-placeholder">{error}</div>
        ) : (
          <TikTokInsights
            datasetContext={payload}
            onUpdateContext={() => {}}
            profileName={payload?.profileName || "Creator"}
            readOnly
          />
        )}
      </div>
    </main>
  );
}

