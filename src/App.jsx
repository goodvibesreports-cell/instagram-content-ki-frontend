// src/App.jsx
import React, { useState, useMemo } from "react";
import axios from "axios";

const BACKEND_URL = "https://instagram-content-ki-backend.onrender.com";

function App() {
  // THEME
  const [theme, setTheme] = useState("light");

  // Upload & Data
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState("");
  const [variantsPerPost, setVariantsPerPost] = useState(3);

  // KI Outputs
  const [prompts, setPrompts] = useState([]);
  const [videoIdeas, setVideoIdeas] = useState([]);

  // UI States
  const [message, setMessage] = useState("");
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [copyIndex, setCopyIndex] = useState(null);

  // Theme toggle
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // -----------------------------
  // Drag & Drop
  // -----------------------------
  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) setMessage(`Datei ausgewählt: ${f.name}`);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0] || null;
    if (f) {
      setFile(f);
      setMessage(`Datei ausgewählt: ${f.name}`);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // -----------------------------
  // Upload JSON
  // -----------------------------
  const handleUpload = async () => {
    if (!file) return alert("Bitte eine JSON-Datei auswählen.");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoadingUpload(true);
      setMessage("Upload läuft…");
      setPosts([]);
      setPrompts([]);
      setVideoIdeas([]);

      const res = await axios.post(`${BACKEND_URL}/upload`, formData);
      setMessage(res.data?.message || "Upload erfolgreich");

      // Lokal JSON lesen, damit Frontend die Posts kennt
      const raw = await file.text();
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setPosts(parsed);
        } else {
          setMessage("JSON muss ein Array (Liste) sein.");
        }
      } catch (err) {
        console.warn("JSON konnte lokal nicht geparsed werden:", err);
        setMessage("Upload erfolgreich, aber JSON konnte lokal nicht gelesen werden.");
      }
    } catch (err) {
      console.error("Upload Error:", err);
      setMessage("Upload fehlgeschlagen");
    } finally {
      setLoadingUpload(false);
    }
  };

  // -----------------------------
  // Virality Score berechnen
  // -----------------------------
  const postsWithVirality = useMemo(() => {
    return posts.map((p) => {
      const likes = Number(p.likes || 0);
      const comments = Number(p.comments || 0);
      const views = Number(p.views || 0);

      const engagement = views > 0 ? (likes + comments * 2) / views : 0;

      let level = "niedrig";
      let colorClass = "virality-low";

      if (engagement > 0.08) {
        level = "hoch";
        colorClass = "virality-high";
      } else if (engagement > 0.03) {
        level = "mittel";
        colorClass = "virality-mid";
      }

      return {
        ...p,
        viralityScore: engagement,
        viralityLabel: level,
        viralityClass: colorClass,
      };
    });
  }, [posts]);

  // -----------------------------
  // Prompts generieren
  // -----------------------------
  const handleGeneratePrompts = async () => {
    if (!posts.length) return alert("Bitte zuerst Posts hochladen.");

    try {
      setLoadingPrompts(true);
      setPrompts([]);
      setVideoIdeas([]);
      setCopyIndex(null);

      const res = await axios.post(`${BACKEND_URL}/generate-prompts`, {
        category,
        variantsPerPost,
      });

      const arr = res.data?.prompts;
      if (Array.isArray(arr)) {
        setPrompts(arr);
      } else {
        setMessage("Prompts konnten nicht generiert werden.");
      }
    } catch (err) {
      console.error("Prompt generation error:", err);
      setMessage("Fehler beim Generieren der Prompts.");
    } finally {
      setLoadingPrompts(false);
    }
  };

  // -----------------------------
  // Videoideen / Skripte generieren
  // -----------------------------
  const handleGenerateVideoIdeas = async () => {
    if (!prompts.length) return alert("Bitte zuerst Prompts generieren.");

    try {
      setLoadingVideos(true);
      setVideoIdeas([]);

      const res = await axios.post(`${BACKEND_URL}/generate-video-ideas`, {
        prompts,
      });

      const ideas = res.data?.videoIdeas;
      if (Array.isArray(ideas)) {
        setVideoIdeas(ideas);
      } else {
        setMessage("Videoideen konnten nicht generiert werden.");
      }
    } catch (err) {
      console.error("Video idea generation error:", err);
      setMessage("Fehler beim Generieren der Videoideen.");
    } finally {
      setLoadingVideos(false);
    }
  };

  // -----------------------------
  // Copy Prompt
  // -----------------------------
  const handleCopyPrompt = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyIndex(index);
      setTimeout(() => setCopyIndex(null), 1500);
    } catch (err) {
      console.error("Clipboard error:", err);
      alert("Konnte den Prompt nicht kopieren.");
    }
  };

  // -----------------------------
  // Download Helper
  // -----------------------------
  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxt = () => {
    if (!prompts.length) return alert("Keine Prompts vorhanden.");

    let out = prompts.map((p, i) => `Prompt ${i + 1}:\n${p}`).join("\n\n");

    if (videoIdeas.length) {
      out += "\n\n--- Videoideen ---\n\n";
      videoIdeas.forEach((v, i) => {
        out += `Prompt ${i + 1}:\n${v.idea}\n\n`;
      });
    }

    downloadFile(out, "instagram-prompts.txt", "text/plain");
  };

  const handleDownloadCsv = () => {
    if (!prompts.length) return alert("Keine Prompts vorhanden.");

    const rows = [["index", "prompt"]];
    prompts.forEach((p, i) => {
      const safe = p.replace(/"/g, '""');
      rows.push([i + 1, `"${safe}"`]);
    });

    const csv = rows.map((r) => r.join(",")).join("\n");
    downloadFile(csv, "instagram-prompts.csv", "text/csv");
  };

  const handleDownloadDocx = () => {
    if (!prompts.length) return alert("Keine Prompts vorhanden.");

    let out = "Instagram Prompts & Videoideen\n\n";
    prompts.forEach((p, i) => {
      out += `Prompt ${i + 1}:\n${p}\n\n`;
    });
    if (videoIdeas.length) {
      out += "\nVideoideen:\n\n";
      videoIdeas.forEach((v, i) => {
        out += `Prompt ${i + 1}:\n${v.idea}\n\n`;
      });
    }

    downloadFile(
      out,
      "instagram-prompts.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  };

  // Scroll helper
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className={`app app--${theme}`}>
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-dot" />
          <span className="logo-text">IG Content KI</span>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-btn" onClick={() => scrollToSection("section-upload")}>
            Upload
          </button>
          <button className="nav-btn" onClick={() => scrollToSection("section-posts")}>
            Posts
          </button>
          <button className="nav-btn" onClick={() => scrollToSection("section-prompts")}>
            Prompts
          </button>
          <button className="nav-btn" onClick={() => scrollToSection("section-scripts")}>
            Skripte
          </button>
          <button className="nav-btn" onClick={() => scrollToSection("section-downloads")}>
            Downloads
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <header className="main-header">
          <h1>Instagram Content KI Dashboard</h1>
          <p>Upload → Analyse → Prompts → Skripte → Export</p>
        </header>

        {/* Upload Section */}
        <section className="card" id="section-upload">
          <h2>1. JSON Upload</h2>
          <p className="muted">
            Lade dein Instagram Export (JSON) hoch, wir analysieren Likes, Views und Comments.
          </p>

          <div
            className={`dropzone ${isDragging ? "dropzone--active" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".json"
              className="dropzone-input"
              onChange={handleFileChange}
            />
            <div className="dropzone-inner">
              <div className="dropzone-icon">📁</div>
              <div className="dropzone-text-main">
                Datei hierher ziehen oder klicken
              </div>
              <div className="dropzone-text-sub">
                Unterstützt: <code>.json</code>
              </div>
            </div>
          </div>

          <div className="upload-actions">
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={!file || loadingUpload}
            >
              {loadingUpload ? "Lade hoch…" : "Upload starten"}
            </button>
            {file && <span className="file-name">Ausgewählt: {file.name}</span>}
          </div>

          {message && <p className="status-message">{message}</p>}
        </section>

        {/* Posts & Virality */}
        {postsWithVirality.length > 0 && (
          <section className="card" id="section-posts">
            <h2>2. Posts & Virality Score</h2>
            <p className="muted">
              Wir berechnen eine grobe Engagement-Rate (Likes + 2×Kommentare / Views) und
              zeigen dabei die Virality an.
            </p>
            <div className="posts-grid">
              {postsWithVirality.map((p, idx) => (
                <div className="post-card" key={idx}>
                  <div className="post-header">
                    <span className="post-index">Post #{idx + 1}</span>
                    <span className={`virality-badge ${p.viralityClass}`}>
                      {p.viralityLabel} · {(p.viralityScore * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="post-caption">{p.caption}</p>
                  <p className="post-meta">
                    👍 {p.likes} · 💬 {p.comments} · 👀 {p.views}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Kategorie + Varianten */}
        <section className="card" id="section-prompts">
          <h2>3. Kategorie & Prompt-Varianten</h2>
          <p className="muted">
            Wähle optional eine Content-Kategorie und wie viele Prompt-Varianten du möchtest.
          </p>

          <div className="form-row">
            <div className="form-group">
              <label>Kategorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Automatisch (aus Daten)</option>
                <option value="Humor">Humor</option>
                <option value="Tutorial">Tutorial</option>
                <option value="Challenge">Challenge / Trends</option>
              </select>
            </div>

            <div className="form-group">
              <label>Varianten</label>
              <select
                value={variantsPerPost}
                onChange={(e) => setVariantsPerPost(Number(e.target.value))}
              >
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
            </div>

            <div className="form-group form-group-button">
              <button
                className="btn btn-secondary"
                onClick={handleGeneratePrompts}
                disabled={loadingPrompts}
              >
                {loadingPrompts ? "Generiere…" : "Prompts generieren"}
              </button>
            </div>
          </div>
        </section>

        {/* Prompts */}
        {prompts.length > 0 && (
          <section className="card">
            <h2>4. Generierte Prompts</h2>
            <p className="muted">
              Klicke auf „Copy“, um den Prompt in die Zwischenablage zu übernehmen.
            </p>

            <div className="prompt-grid">
              {prompts.map((p, idx) => (
                <div className="prompt-card" key={idx}>
                  <div className="prompt-header">
                    <span className="prompt-index">Prompt #{idx + 1}</span>
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleCopyPrompt(p, idx)}
                    >
                      {copyIndex === idx ? "Kopiert ✅" : "Copy"}
                    </button>
                  </div>
                  <p className="prompt-text">{p}</p>
                </div>
              ))}
            </div>

            <div className="prompt-actions">
              <button
                className="btn btn-primary"
                onClick={handleGenerateVideoIdeas}
                disabled={loadingVideos}
              >
                {loadingVideos ? "Generiere…" : "Skripte generieren"}
              </button>
            </div>
          </section>
        )}

        {/* Videoideen / Skripte */}
        {videoIdeas.length > 0 && (
          <section className="card" id="section-scripts">
            <h2>5. Videoideen & Skripte</h2>
            <p className="muted">
              Fertige Skript-Ideen mit Handlung, Voiceover, Texteinblendungen und Hashtags.
            </p>
            <div className="idea-grid">
              {videoIdeas.map((v, idx) => (
                <div className="idea-card" key={idx}>
                  <div className="idea-header">
                    <span>Skript #{idx + 1}</span>
                  </div>
                  <p className="idea-prompt">
                    <strong>Prompt:</strong> {v.prompt}
                  </p>
                  <p className="idea-text">{v.idea}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Downloads */}
        <section className="card" id="section-downloads">
          <h2>6. Downloads</h2>
          <p className="muted">
            Exportiere deine Prompts & Skripte für Instagram, Kunden oder dein Team.
          </p>
          <div className="download-row">
            <button className="btn btn-secondary" onClick={handleDownloadTxt}>
              .txt
            </button>
            <button className="btn btn-secondary" onClick={handleDownloadCsv}>
              .csv
            </button>
            <button className="btn btn-secondary" onClick={handleDownloadDocx}>
              .docx
            </button>
          </div>
        </section>

        <footer className="footer">
          Instagram Content KI · Dashboard (ohne Premium, Login & Credits – das kommt als Nächstes)
        </footer>
      </main>
    </div>
  );
}

export default App;
