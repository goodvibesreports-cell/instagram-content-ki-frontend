import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
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
import { useAuth } from "./context/AuthContext.jsx";

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p>Starte CreatorOS…</p>
    </div>
  );
}

function ProtectedRoute({ requireProfile = true, children }) {
  const { loading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireProfile && !user?.creatorProfile) {
    return <Navigate to="/dna" replace />;
  }

  return children;
}

export default function App() {
  const {
    session,
    user,
    credits,
    logout,
    updateCreatorProfile,
    updateCredits,
    isAuthenticated,
    loading
  } = useAuth();
  const navigateRouter = useNavigate();
  const location = useLocation();
  const [theme] = useState("dark");
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [viewVersion, setViewVersion] = useState(0);
  const token = session?.accessToken || null;

  useEffect(() => {
    if (location.pathname === "/dna") {
      setCurrentPage("dna");
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout().catch(() => {});
  };

  const handleProfileComplete = (profile) => {
    updateCreatorProfile(profile);
    setCurrentPage("dashboard");
    navigateRouter("/dashboard");
  };

  function handleNavigate(page) {
    if (!page) return;
    setCurrentPage(page);
    setViewVersion((version) => version + 1);
    if (location.pathname !== "/dashboard") {
      navigateRouter("/dashboard");
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/share/:token" element={<PublicSharePage />} />
      <Route
        path="/dna"
        element={(
          <ProtectedRoute requireProfile={false}>
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
          <ProtectedRoute>
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
                viewVersion={viewVersion}
                onNavigate={handleNavigate}
                onCreditsUpdate={updateCredits}
              />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/tiktok/insights/:id"
        element={(
          <ProtectedRoute>
            <Layout
              theme={theme}
              onLogout={handleLogout}
              userEmail={user?.email}
              credits={credits}
              onNavigate={handleNavigate}
              currentPage="insights"
            >
              <TikTokAnalyzerPro token={token} onBack={() => handleNavigate("dashboard")} />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/instagram/insights/:id"
        element={(
          <ProtectedRoute>
            <Layout
              theme={theme}
              onLogout={handleLogout}
              userEmail={user?.email}
              credits={credits}
              onNavigate={handleNavigate}
              currentPage="insights"
            >
              <InstagramAnalyzerPro token={token} onBack={() => handleNavigate("dashboard")} />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/facebook/insights/:id"
        element={(
          <ProtectedRoute>
            <Layout
              theme={theme}
              onLogout={handleLogout}
              userEmail={user?.email}
              credits={credits}
              onNavigate={handleNavigate}
              currentPage="insights"
            >
              <FacebookAnalyzerPro token={token} onBack={() => handleNavigate("dashboard")} />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? (user?.creatorProfile ? "/dashboard" : "/dna") : "/login"} replace />}
      />
    </Routes>
  );
}
