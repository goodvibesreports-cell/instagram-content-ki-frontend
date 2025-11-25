import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    const data = await loginUser(email, password);

    if (data.token) {
      localStorage.setItem("authToken", data.token);
      nav("/dashboard");
    } else {
      alert(data.error || "Login fehlgeschlagen");
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 400, margin: "0 auto" }}>
      <h2>Login</h2>

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

      <button onClick={handleLogin} style={{ width: "100%", padding: 10 }}>
        Login
      </button>

      <p>
        Noch kein Account? <Link to="/register">Registrieren</Link>
      </p>
    </div>
  );
}
