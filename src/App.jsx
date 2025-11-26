import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import LoginPage from "./pages/Login.jsx";
import RegisterPage from "./pages/Register.jsx";
import VerifyPage from "./pages/Verify.jsx";
import CreatorDNAPage from "./pages/CreatorDNA.jsx";
import DashboardPage from "./pages/Dashboard.jsx";
import { fetchMe } from "./api";

function ProtectedRoute({ token, user, requireProfile = true, children }) {
  if (!token) return <Navigate to="/login" replace />;
  if (requireProfile && !user?.creatorProfile) {
    return <Navigate to="/dna" replace />;
  }
  return children;
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [currentPage, setCurrentPage] = useState("dashboard");

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
      } catch (err) {
        console.warn(err);
        localStorage.removeItem("authToken");
        setToken(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const handleLogin = (authPayload) => {
    const payload = authPayload?.data ?? authPayload;
    const jwt = typeof payload === "string" ? payload : payload?.token;

    if (!jwt) {
      console.warn("Login ohne Token – Antwort prüfen", authPayload);
      return;
    }

    setToken(jwt);
    localStorage.setItem("authToken", jwt);
    setCurrentPage("dashboard");

    if (payload?.user) {
      setUser(payload.user);
      setCredits(payload.user.totalCredits ?? payload.user.credits ?? 0);
    } else {
      // Fallback: Profil laden, falls Backend kein User-Objekt zurückgibt
      fetchMe(jwt)
        .then((res) => {
          setUser(res.data);
          setCredits(res.data.totalCredits ?? res.data.credits ?? 0);
        })
        .catch((err) => console.warn("Fetch after login fehlgeschlagen", err));
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setCredits(0);
    setCurrentPage("dashboard");
    localStorage.removeItem("authToken");
  };

  const handleProfileComplete = (profile) => {
    setUser((prev) => ({ ...prev, creatorProfile: profile }));
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
        <p>Starte Creator OS…</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={handleLogin} isAuthenticated={!!token} />} />
      <Route path="/register" element={<RegisterPage onLogin={handleLogin} isAuthenticated={!!token} />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route
        path="/dna"
        element={(
          <ProtectedRoute token={token} user={user} requireProfile={false}>
            <Layout
              theme={theme}
              onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
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
              onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
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
      <Route path="*" element={<Navigate to={token ? (user?.creatorProfile ? "/dashboard" : "/dna") : "/login"} replace />} />
    </Routes>
  );
}
