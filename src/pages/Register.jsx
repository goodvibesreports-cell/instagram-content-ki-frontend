// src/pages/Register.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api";
import { useAuth } from "../context/AuthContext.jsx";

const INITIAL_FORM = {
  email: "",
  password: "",
  confirmPassword: ""
};

export default function RegisterPage() {
  const nav = useNavigate();
  const { isAuthenticated } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: null, message: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    if (name === "confirmPassword") {
      if (!value) return "Bitte Passwort bestätigen";
      if (value !== form.password) return "Passwörter stimmen nicht überein";
    }
    return null;
  };

  const validateForm = () => {
    const nextErrors = {
      email: validateField("email", form.email),
      password: validateField("password", form.password),
      confirmPassword: validateField("confirmPassword", form.confirmPassword)
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
      const response = await registerUser(form.email, form.password);
      setStatus({ type: "success", message: response.message || "Registrierung erfolgreich!" });
      setTimeout(() => nav("/login"), 800);
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
            <div className="input-wrapper">
              <input
                id="register-email"
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
            {errors.email && <span className="input-error">{errors.email}</span>}
          </label>

          <label htmlFor="register-password">
            Passwort
            <div className="input-wrapper">
              <input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                onBlur={(e) => setErrors((prev) => ({ ...prev, password: validateField("password", e.target.value) }))}
                placeholder="Mindestens 8 Zeichen"
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
            <ul className="helper-list">
              <li>Mindestens 8 Zeichen</li>
              <li>Nutze Buchstaben, Zahlen & Sonderzeichen</li>
            </ul>
            {errors.password && <span className="input-error">{errors.password}</span>}
          </label>

          <label htmlFor="register-confirm">
            Passwort bestätigen
            <div className="input-wrapper">
              <input
                id="register-confirm"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={(e) => setErrors((prev) => ({ ...prev, confirmPassword: validateField("confirmPassword", e.target.value) }))}
                placeholder="Passwort wiederholen"
                className={errors.confirmPassword ? "has-error" : ""}
              />
              <button
                type="button"
                className="input-action"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Passwort verbergen" : "Passwort anzeigen"}
              >
                {showConfirmPassword ? "Verbergen" : "Anzeigen"}
              </button>
            </div>
            {errors.confirmPassword && <span className="input-error">{errors.confirmPassword}</span>}
          </label>

          <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
            {isLoading ? "Wird erstellt…" : "Registrieren"}
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
          Bereits ein Konto? <Link to="/login">Zum Login</Link>
        </p>
      </div>
    </div>
  );
}
