// src/pages/Register.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api";

export default function RegisterPage({ isAuthenticated, onLogin }) {
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
      const response = await registerUser(email, password);
      const payload = response.data;

      if (onLogin && payload?.token) {
        onLogin(response);
        setStatus({ type: "success", message: response.message || "Account erstellt – weiter zur Creator DNA…" });
        setTimeout(() => nav("/dna"), 500);
      } else {
        setStatus({ type: "success", message: response.message || "Registrierung erfolgreich!" });
        setTimeout(() => nav("/login"), 800);
      }
    } catch (err) {
      const detail = Array.isArray(err.details) && err.details.length ? err.details[0].message : null;
      setStatus({
        type: "error",
        message: detail || err.message || "Registrierung fehlgeschlagen"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Registrieren</h2>
        <p className="muted">
          Erstelle deinen Account, um die Instagram Content KI zu nutzen.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="register-email">
            E-Mail
            <input
              id="register-email"
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
          <label htmlFor="register-password">
            Passwort
            <input
              id="register-password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mind. 6 Zeichen"
            />
          </label>

          <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
            {isLoading ? "Wird erstellt…" : "Registrieren"}
          </button>

          {status.message && (
            <p className={`status-message ${status.type === "error" ? "error" : "success"}`}>
              {status.message}
            </p>
          )}
        </form>

        <p className="auth-switch">
          Bereits ein Konto? <Link to="/login">Zum Login</Link>
        </p>
      </div>
    </div>
  );
}
