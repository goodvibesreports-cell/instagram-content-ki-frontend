// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import LoginPage from "./pages/Login.jsx";
import RegisterPage from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { fetchMe } from "./api";

function ProtectedRoute({ token, children }) {
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("authToken") || null
  );
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [theme, setTheme] = useState(() => {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  });

  useEffect(() => {
    async function init() {
      if (!token) {
        setCheckingAuth(false);
        return;
      }
      try {
        const me = await fetchMe(token);
        if (me && me.email) {
          setUser(me);
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

  function handleLogin(newToken) {
    setToken(newToken);
    localStorage.setItem("authToken", newToken);
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("authToken");
  }

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  if (checkingAuth) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Starte Dashboard…</p>
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
            >
              <Dashboard token={token} userEmail={user?.email} />
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
