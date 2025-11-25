import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { BACKEND_URL, fetchMe } from "./api";
import axios from "axios";

// -------- Protected Route --------
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("authToken");
  return token ? children : <Navigate to="/login" replace />;
}

// -------- Dashboard --------
function Dashboard() {
  const nav = useNavigate();
  const [file, setFile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState("");
  const [prompts, setPrompts] = useState([]);
  const [videoIdeas, setVideoIdeas] = useState([]);

  const token = localStorage.getItem("authToken");

  function logout() {
    localStorage.removeItem("authToken");
    nav("/login");
  }

  async function handleUpload() {
    if (!file) return alert("Bitte Datei auswählen");
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post(`${BACKEND_URL}/upload`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const raw = await file.text();
    setPosts(JSON.parse(raw));
    alert("Upload erfolgreich");
  }

  async function generatePrompts() {
    const res = await axios.post(
      `${BACKEND_URL}/generate-prompts`,
      { category },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setPrompts(res.data.prompts);
  }

  async function generateVideos() {
    const res = await axios.post(
      `${BACKEND_URL}/generate-video-ideas`,
      { prompts },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setVideoIdeas(res.data.videoIdeas);
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Dashboard</h1>
      <button onClick={logout}>Logout</button>

      {/* Upload */}
      <h2>1. JSON Upload</h2>
      <input type="file" accept=".json" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>

      {/* Posts */}
      {posts.length > 0 && (
        <>
          <h3>Posts ({posts.length})</h3>
          <ul>
            {posts.map((p, idx) => (
              <li key={idx}>{p.caption}</li>
            ))}
          </ul>
        </>
      )}

      {/* Prompts */}
      <h2>2. Prompts</h2>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">Alle Kategorien</option>
        <option value="Humor">Humor</option>
        <option value="Tutorial">Tutorial</option>
        <option value="Challenge">Challenge</option>
      </select>
      <button onClick={generatePrompts}>Generieren</button>

      {prompts.length > 0 &&
        prompts.map((p, i) => <p key={i}>{p}</p>)}

      {/* Videoideen */}
      <h2>3. Videoideen</h2>
      <button onClick={generateVideos}>Generieren</button>

      {videoIdeas.length > 0 &&
        videoIdeas.map((v, i) => (
          <div key={i}>
            <b>{v.prompt}</b>
            <p>{v.idea}</p>
          </div>
        ))}
    </div>
  );
}

// -------- App Routing --------
export default function App() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);

  useEffect(() => {
    async function init() {
      const token = localStorage.getItem("authToken");
      if (token) {
        const data = await fetchMe(token);
        if (data.email) setMe(data);
      }
      setLoading(false);
    }
    init();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard me={me} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}
