// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api";

export default function LoginPage({ onLogin, isAuthenticated }) {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ type: null, message: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      nav("/dashboard");
    }
  }, [isAuthenticated, nav]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (isLoading) return;
    setStatus({ type: null, message: "" });
    setIsLoading(true);

    try {
      const response = await loginUser(email, password);
      onLogin?.(response);
      setStatus({ type: "success", message: response.message || "Login erfolgreich, weiterleiten…" });
      setTimeout(() => nav("/dashboard"), 400);
    } catch (err) {
      const detail = Array.isArray(err.details) && err.details.length ? err.details[0].message : null;
      setStatus({
        type: "error",
        message: detail || err.message || "Login fehlgeschlagen"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Login</h2>
        <p className="muted">
          Melde dich an, um dein Instagram Content KI Dashboard zu nutzen.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="login-email">
            E-Mail
            <input
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@mail.com"
              inputMode="email"
            />
          </label>
          <label htmlFor="login-password">
            Passwort
            <input
              id="login-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
            {isLoading ? "Wird geprüft…" : "Einloggen"}
          </button>

          {status.message && (
            <p className={`status-message ${status.type === "error" ? "error" : "success"}`}>
              {status.message}
            </p>
          )}
        </form>

        <p className="auth-switch">
          Noch kein Konto? <Link to="/register">Registrieren</Link>
        </p>
      </div>
    </div>
  );
}
