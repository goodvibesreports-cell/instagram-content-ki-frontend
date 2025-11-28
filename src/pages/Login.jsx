// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const INITIAL_FORM = {
  email: "",
  password: ""
};

export default function LoginPage() {
  const nav = useNavigate();
  const { login, isAuthenticated, mutating } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: null, message: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      nav("/dashboard");
    }
  }, [isAuthenticated, nav]);

  const validateField = (name, value) => {
    if (name === "email") {
      if (!value) return "E-Mail ist erforderlich";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Ungültige E-Mail-Adresse";
    }
    if (name === "password") {
      if (!value) return "Passwort ist erforderlich";
      if (value.length < 8) return "Mindestens 8 Zeichen";
    }
    return null;
  };

  const validateForm = () => {
    const nextErrors = {
      email: validateField("email", form.email),
      password: validateField("password", form.password)
    };
    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (status.type) {
      setStatus({ type: null, message: "" });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isLoading) return;
    if (!validateForm()) {
      setStatus({ type: "error", message: "Bitte Eingaben überprüfen." });
      return;
    }

    setIsLoading(true);
    setStatus({ type: null, message: "" });

    try {
      await login(form.email, form.password);
      setStatus({ type: "success", message: "Login erfolgreich – weiterleiten…" });
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
            <div className="input-wrapper">
              <input
                id="login-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                onBlur={(e) => setErrors((prev) => ({ ...prev, email: validateField("email", e.target.value) }))}
                placeholder="you@mail.com"
                inputMode="email"
                className={errors.email ? "has-error" : ""}
              />
            </div>
            <span className="helper-text">Wir teilen deine Daten nicht mit Dritten.</span>
            {errors.email && <span className="input-error">{errors.email}</span>}
          </label>

          <label htmlFor="login-password">
            Passwort
            <div className="input-wrapper">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                onBlur={(e) => setErrors((prev) => ({ ...prev, password: validateField("password", e.target.value) }))}
                placeholder="••••••••"
                className={errors.password ? "has-error" : ""}
              />
              <button
                type="button"
                className="input-action"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
              >
                {showPassword ? "Verbergen" : "Anzeigen"}
              </button>
            </div>
            {errors.password && <span className="input-error">{errors.password}</span>}
          </label>

          <div className="auth-meta">
            <span />
            <button
              type="button"
              className="link-button"
              onClick={() => setStatus({ type: "info", message: "Kontaktiere den Support, um dein Passwort zurückzusetzen." })}
            >
              Passwort vergessen?
            </button>
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading || mutating}>
            {isLoading || mutating ? "Wird geprüft…" : "Einloggen"}
          </button>

          {status.message && (
            <p
              className={`status-message ${status.type ? status.type : ""}`}
              role="alert"
            >
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
