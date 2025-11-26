import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyEmail } from "../api";

export default function VerifyPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState({ type: null, message: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus({ type: "error", message: "Kein Token angegeben." });
      return;
    }
    verifyEmail(token)
      .then((res) => {
        setStatus({ type: "success", message: res.message || "Verifiziert! Du kannst dich jetzt einloggen." });
        setTimeout(() => navigate("/login"), 1500);
      })
      .catch((err) => setStatus({ type: "error", message: err.message }));
  }, [params, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>E-Mail verifizieren</h2>
        <p className={`status-message ${status.type === "error" ? "error" : "success"}`}>
          {status.message || "Überprüfe deinen Token..."}
        </p>
      </div>
    </div>
  );
}

