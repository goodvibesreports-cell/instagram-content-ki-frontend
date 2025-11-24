import React, { useState } from "react";
import axios from "axios";

const BACKEND_URL = "https://instagram-content-ki-backend.onrender.com";

export default function App() {
  const [file, setFile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState("");
  const [prompts, setPrompts] = useState([]);
  const [videoIdeas, setVideoIdeas] = useState([]);

  const [message, setMessage] = useState("");
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return alert("Bitte eine JSON-Datei auswählen");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoadingUpload(true);
      setMessage("");

      const res = await axios.post(`${BACKEND_URL}/upload`, formData);
      setMessage(res.data.message);

      const raw = await file.text();
      setPosts(JSON.parse(raw));
    } catch (err) {
      console.error(err);
      setMessage("Upload fehlgeschlagen");
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleGeneratePrompts = async () => {
    if (!posts.length) return alert("Bitte zuerst Posts hochladen");

    try {
      setLoadingPrompts(true);
      const res = await axios.post(`${BACKEND_URL}/generate-prompts`, {
        category,
      });
      setPrompts(res.data.prompts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPrompts(false);
    }
  };

  const handleGenerateVideoIdeas = async () => {
    if (!prompts.length) return alert("Bitte zuerst Prompts generieren");

    try {
      setLoadingVideos(true);
      const res = await axios.post(`${BACKEND_URL}/generate-video-ideas`, {
        prompts,
      });
      setVideoIdeas(res.data.videoIdeas);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVideos(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: "Poppins, sans-serif",
        background: "#F7F7FB",
        padding: "40px",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          marginBottom: "40px",
          fontSize: "40px",
          fontWeight: "700",
          background: "linear-gradient(90deg, #6C5CE7, #A29BFE)",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        Instagram Content KI 🚀
      </h1>

      {/* Upload Card */}
      <div
        style={{
          background: "#FFF",
          padding: "30px",
          borderRadius: "16px",
          boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
          marginBottom: "30px",
        }}
      >
        <h2 style={{ color: "#6C5CE7" }}>📁 JSON Datei hochladen</h2>

        <input
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{
            marginTop: "10px",
            padding: "10px",
            borderRadius: "10px",
            border: "1px solid #dcdcdc",
            width: "100%",
          }}
        />

        <button
          onClick={handleUpload}
          disabled={loadingUpload}
          style={{
            marginTop: "20px",
            padding: "12px 20px",
            background: "#6C5CE7",
            color: "#FFF",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600",
            transition: "0.2s",
          }}
        >
          {loadingUpload ? "Lade hoch…" : "Upload starten"}
        </button>

        {message && <p style={{ marginTop: "10px" }}>{message}</p>}
      </div>

      {/* Posts Liste */}
      {posts.length > 0 && (
        <div
          style={{
            background: "#FFF",
            padding: "30px",
            borderRadius: "16px",
            boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
            marginBottom: "30px",
          }}
        >
          <h2 style={{ color: "#6C5CE7" }}>📊 Posts ({posts.length})</h2>

          <ul>
            {posts.map((p, i) => (
              <li key={i} style={{ marginBottom: "8px" }}>
                <b>{p.caption}</b> — Likes: {p.likes} — Comments: {p.comments} — Views:
                {p.views}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Kategorie + Prompts */}
      <div
        style={{
          background: "#FFF",
          padding: "30px",
          borderRadius: "16px",
          boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
          marginBottom: "30px",
        }}
      >
        <h2 style={{ color: "#6C5CE7" }}>🎨 Kategorie wählen</h2>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            padding: "12px",
            marginTop: "10px",
            borderRadius: "10px",
            width: "100%",
            border: "1px solid #dcdcdc",
          }}
        >
          <option value="">Keine Auswahl</option>
          <option value="Humor">Humor</option>
          <option value="Tutorial">Tutorial</option>
          <option value="Challenge">Challenge / Trend</option>
        </select>

        <button
          onClick={handleGeneratePrompts}
          disabled={loadingPrompts}
          style={{
            marginTop: "20px",
            padding: "12px 20px",
            background: "#6C5CE7",
            color: "#FFF",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600",
          }}
        >
          {loadingPrompts ? "Generiere…" : "Prompts erstellen"}
        </button>
      </div>

      {/* Prompts */}
      {prompts.length > 0 && (
        <div
          style={{
            background: "#FFF",
            padding: "30px",
            borderRadius: "16px",
            boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
            marginBottom: "30px",
          }}
        >
          <h2 style={{ color: "#6C5CE7" }}>✨ Generierte Prompts</h2>

          {prompts.map((p, i) => (
            <div
              key={i}
              style={{
                background: "#F7F7FB",
                padding: "15px",
                borderRadius: "12px",
                marginBottom: "12px",
                borderLeft: "5px solid #6C5CE7",
              }}
            >
              {p}
            </div>
          ))}

          <button
            onClick={handleGenerateVideoIdeas}
            disabled={loadingVideos}
            style={{
              marginTop: "20px",
              padding: "12px 20px",
              background: "#6C5CE7",
              color: "#FFF",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            {loadingVideos ? "Generiere…" : "Videoideen generieren"}
          </button>
        </div>
      )}

      {/* Videoideen */}
      {videoIdeas.length > 0 && (
        <div
          style={{
            background: "#FFF",
            padding: "30px",
            borderRadius: "16px",
            boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
          }}
        >
          <h2 style={{ color: "#6C5CE7" }}>🎬 Videoideen</h2>

          {videoIdeas.map((v, i) => (
            <div
              key={i}
              style={{
                background: "#F7F7FB",
                padding: "18px",
                borderRadius: "12px",
                marginBottom: "14px",
                borderLeft: "5px solid #A29BFE",
              }}
            >
              <b>Prompt:</b> {v.prompt}
              <br />
              <b>Idee:</b> {v.idea}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
