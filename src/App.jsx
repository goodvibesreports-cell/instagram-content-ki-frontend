import React, { useState, useMemo } from "react";
import axios from "axios";

const BACKEND_URL = "https://instagram-content-ki-backend.onrender.com";

function App() {
  const [theme, setTheme] = useState("light");

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState("");
  const [variantsPerPost, setVariantsPerPost] = useState(3);

  const [prompts, setPrompts] = useState([]);
  const [videoIdeas, setVideoIdeas] = useState([]);

  const [message, setMessage] = useState("");
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);

  const [copyInfo, setCopyInfo] = useState(null); // index des zuletzt kopierten Prompts

  // -----------------------------
  // Theme
  // -----------------------------
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // -----------------------------
  // Drag & Drop + Datei auswählen
  // -----------------------------
  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) setMessage(`Datei ausgewählt: ${f.name}`);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0] || null;
    setFile(f);
    if (f) setMessage(`Datei ausgewählt: ${f.name}`);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // -----------------------------
  // Upload
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

      // Lokalen Inhalt zum Anzeigen parsen
      const raw = await file.text();
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setPosts(parsed);
        } else {
          setMessage("JSON-Format ungültig (erwarte Array von Posts).");
        }
      } catch {
        setMessage("JSON konnte lokal nicht gelesen werden.");
      }
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      setMessage("Upload fehlgeschlagen – bitte erneut versuchen.");
    } finally {
      setLoadingUpload(false);
    }
  };

  // -----------------------------
  // Virality Score (Frontend)
  // -----------------------------
  const postsWithVirality = useMemo(() => {
    if (!Array.isArray(posts)) return [];
    return posts.map((p) => {
      const likes = Number(p.likes || 0);
      const comments = Number(p.comments || 0);
      const views = Number(p.views || 0);
      const engagement = views > 0 ? (likes + comments * 2) / views : 0;
      let level = "niedrig";
      let color = "var(--score-low)";
      if (engagement > 0.08) {
        level = "hoch";
        color = "var(--score-high)";
      } else if (engagement > 0.03) {
        level = "mittel";
        color = "var(--score-mid)";
      }
      return {
        ...p,
        viralityScore: engagement,
        viralityLabel: level,
        viralityColor: color,
      };
    });
  }, [posts]);

  // -----------------------------
  // Prompts generieren (mit Varianten-Hinweis)
  // -----------------------------
  const handleGeneratePrompts = async () => {
    if (!posts.length) return alert("Bitte zuerst Posts hochladen.");

    try {
      setLoadingPrompts(true);
      setPrompts([]);
      setVideoIdeas([]);
      setCopyInfo(null);

      // Backend kennt variantsPerPost nicht, aber wir geben es schon mit –
      // das Backend ignoriert es einfach, falls nicht genutzt.
      const res = await axios.post(`${BACKEND_URL}/generate-prompts`, {
        category: category.trim(),
        variantsPerPost: Number(variantsPerPost) || 3,
      });

      const generated = res.data?.prompts;
      if (Array.isArray(generated)) {
        setPrompts(generated);
      } else {
        setPrompts([]);
        setMessage("Konnte keine Prompts generieren.");
      }
    } catch (err) {
      console.error("PROMPT ERROR:", err);
      setMessage("Fehler beim Generieren der Prompts.");
    } finally {
      setLoadingPrompts(false);
    }
  };

  // -----------------------------
  // Videoideen generieren
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
        setMessage("Konnte keine Videoideen generieren.");
      }
    } catch (err) {
      console.error("VIDEO IDEAS ERROR:", err);
      setMessage("Fehler beim Generieren der Videoideen.");
    } finally {
      setLoadingVideos(false);
    }
  };

  // -----------------------------
  // Copy-to-Clipboard
  // -----------------------------
  const handleCopyPrompt = async (prompt, index) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyInfo(index);
      setTimeout(() => setCopyInfo(null), 1500);
    } catch (err) {
      console.error("COPY ERROR:", err);
      alert("Kopieren nicht möglich.");
    }
  };

  // -----------------------------
  // Downloads (.txt, .csv, .docx)
  // -----------------------------
  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
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
    if (!prompts.length) return alert("Es gibt keine Prompts zum Download.");
    const lines = prompts.map((p, i) => `Prompt ${i + 1}:\n${p}\n`);
    if (videoIdeas.length) {
      lines.push("\n--- Videoideen ---\n");
      videoIdeas.forEach((v, i) => {
        lines.push(`Prompt ${i + 1}: ${v.prompt}\nSkript:\n${v.idea}\n`);
      });
    }
    downloadFile(lines.join("\n"), "instagram-prompts.txt", "text/plain;charset=utf-8");
  };

  const handleDownloadCsv = () => {
    if (!prompts.length) return alert("Es gibt keine Prompts zum Download.");
    const rows = [["index", "prompt"]];
    prompts.forEach((p, i) => {
      const safe = p.replace(/"/g, '""');
      rows.push([i + 1, `"${safe}"`]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    downloadFile(csv, "instagram-prompts.csv", "text/csv;charset=utf-8");
  };

  const handleDownloadDocx = () => {
    if (!prompts.length) return alert("Es gibt keine Prompts zum Download.");
    let content = "Instagram Prompts & Videoideen\n\n";
    prompts.forEach((p, i) => {
      content += `Prompt ${i + 1}:\n${p}\n\n`;
    });
    if (videoIdeas.length) {
      content += "Videoideen:\n\n";
      videoIdeas.forEach((v, i) => {
        content += `Prompt ${i + 1}: ${v.prompt}\nSkript:\n${v.idea}\n\n`;
      });
    }
    // Word öffnet einfache Text- oder RTF-Inhalte auch unter .docx
    downloadFile(
      content,
      "instagram-prompts.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  };

  return (
    <div className={`app app--${theme}`}>
      {/* Sidebar / Header */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-dot" />
          <span className="logo-text">IG Content KI</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Workflow</div>
          <button className="nav-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            1 · Upload
          </button>
          <button
            className="nav-btn"
            onClick={() =>
              document.getElementById("section-prompts")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            2 · Prompts
          </button>
          <button
            className="nav-btn"
            onClick={() =>
              document.getElementById("section-scripts")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            3 · Skripte
          </button>

          <div className="nav-section-title">Extras</div>
          <button
            className="nav-btn"
            onClick={() =>
              document.getElementById("section-downloads")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Downloads
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </button>
        </div>
      </aside>

      {/* Main Dashboard */}
      <main className="main">
        <header className="main-header">
          <div>
            <h1>Instagram Content Dashboard</h1>
            <p>JSON hochladen · Virality analysieren · Prompts & Skripte generieren</p>
          </div>
        </header>

        {/* Upload Card */}
        <section className="card">
          <h2>1. JSON Upload</h2>
          <p className="card-subtitle">
            Lade deine Instagram-Posts als JSON hoch (mit <code>caption</code>,{" "}
            <code>likes</code>, <code>comments</code>, <code>views</code>).
          </p>

          <div
            className={`dropzone ${isDragging ? "dropzone--active" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="dropzone-inner">
              <div className="dropzone-icon">📁</div>
              <div className="dropzone-title">Datei hierher ziehen oder klicken</div>
              <div className="dropzone-hint">Akzeptiert: .json</div>
              <input type="file" accept=".json" className="dropzone-input" onChange={handleFileChange} />
            </div>
          </div>

          <div className="upload-actions">
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={loadingUpload || !file}
            >
              {loadingUpload ? "Lade hoch…" : "Upload starten"}
            </button>
            {message && <span className="status-text">{message}</span>}
          </div>
        </section>

        {/* Posts + Virality */}
        {postsWithVirality.length > 0 && (
          <section className="card">
            <h2>2. Posts & Virality</h2>
            <p className="card-subtitle">
              Virality Score basiert auf Likes, Comments & Views (Farben: niedrig · mittel · hoch).
            </p>
            <div className="posts-grid">
              {postsWithVirality.map((p, idx) => (
                <div key={idx} className="post-card">
                  <div className="post-header">
                    <span className="pill">Post #{idx + 1}</span>
                    <span className="metrics">
                      👍 {p.likes ?? 0} · 💬 {p.comments ?? 0} · 👀 {p.views ?? 0}
                    </span>
                  </div>
                  <p className="post-caption">{p.caption}</p>
                  <div className="virality-row">
                    <span className="virality-label">Virality:</span>
                    <span className="virality-badge" style={{ backgroundColor: p.viralityColor }}>
                      {p.viralityLabel} ({(p.viralityScore * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Kategorie & Varianten */}
        <section className="card" id="section-prompts">
          <h2>3. Kategorie & Prompt-Varianten</h2>
          <p className="card-subtitle">
            Wähle optional eine Content-Kategorie und die gewünschte Anzahl an Prompt-Varianten.
          </p>

          <div className="form-row">
            <label className="form-label">
              Kategorie
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="select"
              >
                <option value="">Keine Auswahl (auto)</option>
                <option value="Humor">Humor</option>
                <option value="Tutorial">Tutorial</option>
                <option value="Challenge">Challenge / Trends</option>
              </select>
            </label>

            <label className="form-label">
              Varianten (global)
              <select
                value={variantsPerPost}
                onChange={(e) => setVariantsPerPost(e.target.value)}
                className="select"
              >
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
            </label>
          </div>

          <button
            className="btn btn-secondary"
            onClick={handleGeneratePrompts}
            disabled={loadingPrompts || !posts.length}
          >
            {loadingPrompts ? "Generiere…" : "Prompts generieren"}
          </button>
        </section>

        {/* Prompts Liste */}
        {prompts.length > 0 && (
          <section className="card">
            <h2>4. Generierte Prompts</h2>
            <p className="card-subtitle">
              Klicke auf „Copy“, um einen Prompt direkt in die Zwischenablage zu kopieren.
            </p>

            <div className="prompt-grid">
              {prompts.map((p, idx) => (
                <div key={idx} className="prompt-card">
                  <div className="prompt-header">
                    <span className="pill">Prompt #{idx + 1}</span>
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleCopyPrompt(p, idx)}
                    >
                      {copyInfo === idx ? "Kopiert!" : "Copy"}
                    </button>
                  </div>
                  <p className="prompt-text">{p}</p>
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary"
              onClick={handleGenerateVideoIdeas}
              disabled={loadingVideos}
            >
              {loadingVideos ? "Generiere…" : "Videoideen / Skripte generieren"}
            </button>
          </section>
        )}

        {/* Videoideen */}
        {videoIdeas.length > 0 && (
          <section className="card" id="section-scripts">
            <h2>5. Videoideen / Skripte</h2>
            <div className="idea-grid">
              {videoIdeas.map((v, idx) => (
                <div key={idx} className="idea-card">
                  <div className="pill pill-secondary">Prompt #{idx + 1}</div>
                  <p className="idea-prompt">{v.prompt}</p>
                  <p className="idea-text">{v.idea}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Downloads */}
        <section className="card" id="section-downloads">
          <h2>6. Downloads</h2>
          <p className="card-subtitle">
            Exportiere deine Prompts (und optional Skripte) in verschiedenen Formaten.
          </p>
          <div className="download-row">
            <button className="btn btn-secondary" onClick={handleDownloadTxt}>
              Download als .txt
            </button>
            <button className="btn btn-secondary" onClick={handleDownloadCsv}>
              Download als .csv
            </button>
            <button className="btn btn-secondary" onClick={handleDownloadDocx}>
              Download als .docx
            </button>
          </div>
        </section>

        <footer className="footer">
          <span>Instagram Content KI · Dashboard UI · ohne Premium-System (noch 😉)</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
