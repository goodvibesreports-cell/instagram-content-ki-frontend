// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api";

export default function LoginPage({ onLogin, isAuthenticated }) {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      nav("/dashboard");
    }
  }, [isAuthenticated, nav]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    try {
      const data = await loginUser(email, password);
      if (data.token) {
        onLogin(data.token);
        setMsg("Login erfolgreich, weiterleiten...");
        setTimeout(() => nav("/dashboard"), 500);
      } else {
        setMsg(data.error || "Login fehlgeschlagen");
      }
    } catch (err) {
      console.error(err);
      setMsg("Fehler beim Login");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Login</h2>
        <p className="muted">
          Melde dich an, um dein Instagram Content KI Dashboard zu nutzen.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">
            E-Mail
            <input
              id="login-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@mail.com"
            />
          </label>
          <label htmlFor="login-password">
            Passwort
            <input
              id="login-password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          <button type="submit" className="btn btn-primary auth-submit">
            Einloggen
          </button>

          {msg && <p className="status-message">{msg}</p>}
        </form>

        <p className="auth-switch">
          Noch kein Konto? <Link to="/register">Registrieren</Link>
        </p>
      </div>
    </div>
  );
}
