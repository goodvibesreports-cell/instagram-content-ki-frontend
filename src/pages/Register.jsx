// src/pages/Register.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api";

export default function RegisterPage({ isAuthenticated }) {
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
      const data = await registerUser(email, password);
      if (data.error) {
        setMsg(data.error);
      } else {
        setMsg("Registrierung erfolgreich! Du kannst dich jetzt einloggen.");
        setTimeout(() => nav("/login"), 800);
      }
    } catch (err) {
      console.error("Registration error:", err);
      if (err.code === "ERR_NETWORK") {
        setMsg("Server nicht erreichbar. Bitte später erneut versuchen.");
      } else {
        setMsg("Fehler bei der Registrierung: " + (err.message || "Unbekannter Fehler"));
      }
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Registrieren</h2>
        <p className="muted">
          Erstelle deinen Account, um die Instagram Content KI zu nutzen.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            E-Mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@mail.com"
            />
          </label>
          <label>
            Passwort
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mind. 6 Zeichen"
            />
          </label>

          <button type="submit" className="btn btn-primary auth-submit">
            Registrieren
          </button>

          {msg && <p className="status-message">{msg}</p>}
        </form>

        <p className="auth-switch">
          Bereits ein Konto? <Link to="/login">Zum Login</Link>
        </p>
      </div>
    </div>
  );
}
