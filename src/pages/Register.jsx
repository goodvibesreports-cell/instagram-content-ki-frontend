import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api";

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister() {
    const data = await registerUser(email, password);

    if (data.success) {
      alert("Registrierung erfolgreich!");
      nav("/login");
    } else {
      alert(data.error || "Fehler");
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 400, margin: "0 auto" }}>
      <h2>Registrieren</h2>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 8 }}
      />

      <input
        placeholder="Passwort"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 8 }}
      />

      <button onClick={handleRegister} style={{ width: "100%", padding: 10 }}>
        Registrieren
      </button>

      <p>
        Bereits ein Konto? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
