import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import LoginPage from "../pages/Login.jsx";
import RegisterPage from "../pages/Register.jsx";
import VerifyPage from "../pages/Verify.jsx";
import CreatorDNAPage from "../pages/CreatorDNA.jsx";
import DashboardPage from "../pages/Dashboard.jsx";
import PublicSharePage from "../pages/PublicShare.jsx";
import TikTokAnalyzerPro from "../pages/TikTokAnalyzerPro.jsx";
import InstagramAnalyzerPro from "../pages/InstagramAnalyzerPro.jsx";
import FacebookAnalyzerPro from "../pages/FacebookAnalyzerPro.jsx";

function ProtectedRoute({ loading, fallback = null, isAuthenticated, hasProfile, requireProfile = true, children }) {
  const location = useLocation();

  if (loading) {
    return fallback;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireProfile && !hasProfile) {
    return <Navigate to="/dna" replace />;
  }

  return children;
}

export default function AppRouter({
  loading,
  fallback,
  isAuthenticated,
  hasProfile,
  theme,
  userEmail,
  credits,
  currentPage,
  onNavigate,
  onLogout,
  token,
  onProfileComplete,
  viewVersion,
  onCreditsUpdate,
  creatorProfile
}) {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/share/:token" element={<PublicSharePage />} />

      <Route
        path="/dna"
        element={(
          <ProtectedRoute
            loading={loading}
            fallback={fallback}
            isAuthenticated={isAuthenticated}
            hasProfile={hasProfile}
            requireProfile={false}
          >
            <Layout
              theme={theme}
              onToggleTheme={() => {}}
              onLogout={onLogout}
              userEmail={userEmail}
              credits={credits}
              onNavigate={onNavigate}
              currentPage="dna"
            >
              <CreatorDNAPage token={token} onComplete={onProfileComplete} profile={creatorProfile} />
            </Layout>
          </ProtectedRoute>
        )}
      />

      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute
            loading={loading}
            fallback={fallback}
            isAuthenticated={isAuthenticated}
            hasProfile={hasProfile}
          >
            <Layout
              theme={theme}
              onToggleTheme={() => {}}
              onLogout={onLogout}
              userEmail={userEmail}
              credits={credits}
              onNavigate={onNavigate}
              currentPage={currentPage}
            >
              <DashboardPage
                token={token}
                userEmail={userEmail}
                currentPage={currentPage}
                viewVersion={viewVersion}
                onNavigate={onNavigate}
                onCreditsUpdate={onCreditsUpdate}
              />
            </Layout>
          </ProtectedRoute>
        )}
      />

      <Route
        path="/tiktok/insights/:id"
        element={(
          <ProtectedRoute
            loading={loading}
            fallback={fallback}
            isAuthenticated={isAuthenticated}
            hasProfile={hasProfile}
          >
            <Layout
              theme={theme}
              onLogout={onLogout}
              userEmail={userEmail}
              credits={credits}
              onNavigate={onNavigate}
              currentPage="insights"
            >
              <TikTokAnalyzerPro token={token} onBack={() => onNavigate("dashboard")} />
            </Layout>
          </ProtectedRoute>
        )}
      />

      <Route
        path="/instagram/insights/:id"
        element={(
          <ProtectedRoute
            loading={loading}
            fallback={fallback}
            isAuthenticated={isAuthenticated}
            hasProfile={hasProfile}
          >
            <Layout
              theme={theme}
              onLogout={onLogout}
              userEmail={userEmail}
              credits={credits}
              onNavigate={onNavigate}
              currentPage="insights"
            >
              <InstagramAnalyzerPro token={token} onBack={() => onNavigate("dashboard")} />
            </Layout>
          </ProtectedRoute>
        )}
      />

      <Route
        path="/facebook/insights/:id"
        element={(
          <ProtectedRoute
            loading={loading}
            fallback={fallback}
            isAuthenticated={isAuthenticated}
            hasProfile={hasProfile}
          >
            <Layout
              theme={theme}
              onLogout={onLogout}
              userEmail={userEmail}
              credits={credits}
              onNavigate={onNavigate}
              currentPage="insights"
            >
              <FacebookAnalyzerPro token={token} onBack={() => onNavigate("dashboard")} />
            </Layout>
          </ProtectedRoute>
        )}
      />

      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? (hasProfile ? "/dashboard" : "/dna") : "/login"} replace />}
      />
    </Routes>
  );
}

