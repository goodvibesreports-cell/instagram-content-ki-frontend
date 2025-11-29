import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AppRouter from "./router.jsx";

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p>Starte CreatorOS…</p>
    </div>
  );
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
    <AppRouter
      loading={loading}
      fallback={<LoadingScreen />}
      isAuthenticated={isAuthenticated}
      hasProfile={Boolean(user?.creatorProfile)}
      theme={theme}
      userEmail={user?.email}
      credits={credits}
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      token={token}
      onProfileComplete={handleProfileComplete}
      viewVersion={viewVersion}
      onCreditsUpdate={updateCredits}
      creatorProfile={user?.creatorProfile}
    />
  );
}
