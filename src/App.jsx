// src/App.jsx - Instagram Content KI v2.0
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import LoginPage from "./pages/Login.jsx";
import RegisterPage from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { fetchMe, getProfile } from "./api";

function ProtectedRoute({ token, children }) {
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("authToken") || null);
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(0);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });

  // Auth Check
  useEffect(() => {
    async function init() {
      if (!token) {
        setCheckingAuth(false);
        return;
      }
      try {
        const me = await fetchMe(token);
        if (me.success && me.data) {
          setUser(me.data);
          
          // Get full profile with credits
          const profile = await getProfile(token);
          if (profile.success) {
            setCredits(profile.data.user.credits + profile.data.user.bonusCredits);
          }
        } else {
          localStorage.removeItem("authToken");
          setToken(null);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        localStorage.removeItem("authToken");
        setToken(null);
      } finally {
        setCheckingAuth(false);
      }
    }
    init();
  }, [token]);

  // Listen for navigation events
  useEffect(() => {
    function handleNavigate(e) {
      setCurrentPage(e.detail);
    }
    window.addEventListener("navigate", handleNavigate);
    return () => window.removeEventListener("navigate", handleNavigate);
  }, []);

  function handleLogin(newToken) {
    setToken(newToken);
    localStorage.setItem("authToken", newToken);
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setCredits(0);
    localStorage.removeItem("authToken");
  }

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  function handleNavigate(page) {
    setCurrentPage(page);
  }

  function handleCreditsUpdate(newCredits) {
    setCredits(newCredits);
  }

  if (checkingAuth) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>
          Starte Dashboard…
        </p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginPage onLogin={handleLogin} isAuthenticated={!!token} />
        }
      />
      <Route
        path="/register"
        element={<RegisterPage isAuthenticated={!!token} />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute token={token}>
            <Layout
              theme={theme}
              onToggleTheme={toggleTheme}
              onLogout={handleLogout}
              userEmail={user?.email}
              credits={credits}
              onNavigate={handleNavigate}
              currentPage={currentPage}
            >
              <Dashboard 
                token={token} 
                userEmail={user?.email}
                currentPage={currentPage}
                onCreditsUpdate={handleCreditsUpdate}
              />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
}
