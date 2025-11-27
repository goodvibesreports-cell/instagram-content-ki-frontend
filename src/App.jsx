import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import LoginPage from "./pages/Login.jsx";
import RegisterPage from "./pages/Register.jsx";
import VerifyPage from "./pages/Verify.jsx";
import CreatorDNAPage from "./pages/CreatorDNA.jsx";
import DashboardPage from "./pages/Dashboard.jsx";
import PublicSharePage from "./pages/PublicShare.jsx";
import TikTokAnalyzerPro from "./pages/TikTokAnalyzerPro.jsx";
import InstagramAnalyzerPro from "./pages/InstagramAnalyzerPro.jsx";
import FacebookAnalyzerPro from "./pages/FacebookAnalyzerPro.jsx";
import {
  fetchMe,
  logoutSession,
  persistAuthSession,
  getStoredSession,
  updateStoredSession,
  clearStoredSession
} from "./api";

function ProtectedRoute({ token, user, requireProfile = true, children }) {
  if (!token) return <Navigate to="/login" replace />;
  if (requireProfile && !user?.creatorProfile) {
    return <Navigate to="/dna" replace />;
  }
  return children;
}

export default function App() {
  const [session, setSession] = useState(() => getStoredSession());
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [theme] = useState("dark");
  const [currentPage, setCurrentPage] = useState("dashboard");
  const token = session?.accessToken || null;

  useEffect(() => {
    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetchMe(token);
        setUser(res.data);
        setCredits(res.data.totalCredits ?? res.data.credits ?? 0);
        const updated = updateStoredSession({ user: res.data });
        if (updated) {
          setSession(updated);
        }
      } catch (err) {
        console.warn(err);
        clearStoredSession();
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const handleLogin = (authPayload) => {
    const payload = authPayload?.data ?? authPayload;
    const normalized = persistAuthSession(payload);
    if (!normalized?.accessToken) {
      console.warn("Login ohne gültige Tokens – Antwort prüfen", authPayload);
      return;
    }

    setSession(normalized);
    setCurrentPage("dashboard");

    if (normalized.user) {
      setUser(normalized.user);
      setCredits(normalized.user.totalCredits ?? normalized.user.credits ?? 0);
    } else {
      fetchMe(normalized.accessToken)
        .then((res) => {
          setUser(res.data);
          setCredits(res.data.totalCredits ?? res.data.credits ?? 0);
          const updated = updateStoredSession({ user: res.data });
          if (updated) {
            setSession(updated);
          }
        })
        .catch((err) => console.warn("Fetch after login fehlgeschlagen", err));
    }
  };

  const handleLogout = () => {
    const refreshToken = session?.refreshToken || null;
    logoutSession(refreshToken).catch(() => {});
    clearStoredSession();
    setSession(null);
    setUser(null);
    setCredits(0);
    setCurrentPage("dashboard");
  };

  const handleProfileComplete = (profile) => {
    setUser((prev) => ({ ...prev, creatorProfile: profile }));
    const updated = updateStoredSession({
      user: { creatorProfile: profile }
    });
    if (updated) {
      setSession(updated);
    }
    setCurrentPage("dashboard");
  };

  function handleNavigate(page) {
    if (!page) return;
    setCurrentPage(page);
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Starte CreatorOS…</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={handleLogin} isAuthenticated={!!token} />} />
      <Route path="/register" element={<RegisterPage onLogin={handleLogin} isAuthenticated={!!token} />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/share/:token" element={<PublicSharePage />} />
      <Route
        path="/dna"
        element={(
          <ProtectedRoute token={token} user={user} requireProfile={false}>
            <Layout
              theme={theme}
              onToggleTheme={() => {}}
              onLogout={handleLogout}
              userEmail={user?.email}
              credits={credits}
              onNavigate={handleNavigate}
              currentPage="dna"
            >
              <CreatorDNAPage
                token={token}
                onComplete={handleProfileComplete}
                profile={user?.creatorProfile}
              />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute token={token} user={user}>
            <Layout
              theme={theme}
              onToggleTheme={() => {}}
              onLogout={handleLogout}
              userEmail={user?.email}
              credits={credits}
              onNavigate={handleNavigate}
              currentPage={currentPage}
            >
              <DashboardPage
                token={token}
                userEmail={user?.email}
                currentPage={currentPage}
                onNavigate={handleNavigate}
                onCreditsUpdate={setCredits}
              />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/tiktok/insights/:id"
        element={(
          <ProtectedRoute token={token} user={user}>
            <Layout
              theme={theme}
              onLogout={handleLogout}
              userEmail={user?.email}
              credits={credits}
              onNavigate={handleNavigate}
              currentPage="insights"
            >
              <TikTokAnalyzerPro token={token} />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/instagram/insights/:id"
        element={(
          <ProtectedRoute token={token} user={user}>
            <Layout
              theme={theme}
              onLogout={handleLogout}
              userEmail={user?.email}
              credits={credits}
              onNavigate={handleNavigate}
              currentPage="insights"
            >
              <InstagramAnalyzerPro token={token} />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/facebook/insights/:id"
        element={(
          <ProtectedRoute token={token} user={user}>
            <Layout
              theme={theme}
              onLogout={handleLogout}
              userEmail={user?.email}
              credits={credits}
              onNavigate={handleNavigate}
              currentPage="insights"
            >
              <FacebookAnalyzerPro token={token} />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route path="*" element={<Navigate to={token ? (user?.creatorProfile ? "/dashboard" : "/dna") : "/login"} replace />} />
    </Routes>
  );
}
