import React, { useState, useMemo } from "react";
import axios from "axios";

const BACKEND_URL = "https://instagram-content-ki-backend.onrender.com";

function App() {
  /* -------------------------------------------
     UI STATES
  --------------------------------------------*/
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

  const [copyInfo, setCopyInfo] = useState(null);

  /* -------------------------------------------
     THEME 
  --------------------------------------------*/
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  /* -------------------------------------------
     DRAG & DROP
  --------------------------------------------*/
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

  /* -------------------------------------------
     FILE UPLOAD → POSTS
  --------------------------------------------*/
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

      // Lokale Datei lesen
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setPosts(parsed);
      } else {
        setMessage("JSON muss ein Array sein.");
      }
    } catch (err) {
      console.error("Upload Error:", err);
      setMessage("Upload fehlgeschlagen.");
    } finally {
      setLoadingUpload(false);
    }
  };

  /* -------------------------------------------
     VIRALITY CALCULATION
  --------------------------------------------*/
  const postsWithVirality = useMemo(() => {
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

  /* -------------------------------------------
     GENERATE PROMPTS
  --------------------------------------------*/
  const handleGeneratePrompts = async () => {
    if (!posts.length) return alert("Bitte zuerst Posts hochladen.");

    try {
      setLoadingPrompts(true);
      setPrompts([]);
      setCopyInfo(null);
      setVideoIdeas([]);

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
      console.error("Prompt Error:", err);
      setMessage("Fehler beim Generieren der Prompts.");
    } finally {
      setLoadingPrompts(false);
    }
  };

  /* -------------------------------------------
     GENERATE VIDEO SCRIPTS
  --------------------------------------------*/
  const handleGenerateVideoIdeas = async () => {
    if (!prompts.length) return alert("Bitte zuerst Prompts generieren.");

    try {
      setLoadingVideos(true);
      setVideoIdeas([]);

      const res = await axios.post(`${BACKEND_URL}/generate-video-ideas`, {
        prompts,
      });

      const arr = res.data?.videoIdeas;
      if (Array.isArray(arr)) {
        setVideoIdeas(arr);
      } else {
        setMessage("Videoideen konnten nicht generiert werden.");
      }
    } catch (err) {
      console.error("Video Error:", err);
      setMessage("Fehler beim Generieren der Videoideen.");
    } finally {
      setLoadingVideos(false);
    }
  };

  /* -------------------------------------------
     COPY PROMPT
  --------------------------------------------*/
  const handleCopyPrompt = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyInfo(index);
      setTimeout(() => setCopyInfo(null), 1500);
    } catch {
      alert("Konnte nicht kopieren.");
    }
  };

  /* -------------------------------------------
     DOWNLOAD EXPORTS
  --------------------------------------------*/
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

  const downloadTxt = () => {
    if (!prompts.length) return alert("Keine Prompts vorhanden.");
    let out = prompts.map((p, i) => `Prompt ${i + 1}: ${p}`).join("\n\n");

    if (videoIdeas.length) {
      out += "\n\n--- Videoideen ---\n\n";
      videoIdeas.forEach((v, i) => {
        out += `Prompt ${i + 1}:\n${v.idea}\n\n`;
      });
    }

    downloadFile(out, "prompts.txt", "text/plain");
  };

  const downloadCsv = () => {
    if (!prompts.length) return alert("Keine Prompts vorhanden.");

    const rows = [["index", "prompt"]];
    prompts.forEach((p, i) => {
      const safe = p.replace(/"/g, '""');
      rows.push([i + 1, `"${safe}"`]);
    });

    const csv = rows.map((r) => r.join(",")).join("\n");
    downloadFile(csv, "prompts.csv", "text/csv");
  };

  const downloadDocx = () => {
    if (!prompts.length) return alert("Keine Prompts vorhanden.");

    let content = "Instagram Prompts & Videoideen\n\n";
    prompts.forEach((p, i) => {
      content += `Prompt ${i + 1}:\n${p}\n\n`;
    });
    if (videoIdeas.length) {
      content += "\nVideoideen:\n\n";
      videoIdeas.forEach((v, i) => {
        content += `Prompt ${i + 1}:\n${v.idea}\n\n`;
      });
    }

    downloadFile(
      content,
      "instagram-prompts.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  };

  /* -------------------------------------------
     UI LAYOUT
  --------------------------------------------*/
  return (
    <div className={`app app--${theme}`}>
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-dot" />
          <span className="logo-text">IG Content KI</span>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-btn" onClick={() => window.scrollTo(0, 0)}>
            Upload
          </button>
          <button
            className="nav-btn"
            onClick={() =>
              document.getElementById("section-prompts")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Prompts
          </button>
          <button
            className="nav-btn"
            onClick={() =>
              document.getElementById("section-scripts")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Skripte
          </button>
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

      {/* MAIN DASHBOARD */}
      <main className="main">
        <header className="main-header">
          <h1>Instagram Content Dashboard</h1>
          <p>Upload · Analyse · Prompts · Skripte</p>
        </header>

        {/* UPLOAD */}
        <section className="card">
          <h2>1. JSON Upload</h2>
          <div
            className={`dropzone ${isDragging ? "dropzone--active" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input type="file" accept=".json" className="dropzone-input" onChange={handleFileChange} />
            <div className="dropzone-inner">
              <div className="dropzone-icon">📁</div>
              <div className="dropzone-title">Datei hierher ziehen oder klicken</div>
            </div>
          </div>

          <button className="btn btn-primary" disabled={!file || loadingUpload} onClick={handleUpload}>
            {loadingUpload ? "Hochladen…" : "Upload starten"}
          </button>

          {message && <p>{message}</p>}
        </section>

        {/* POSTS + VIRALITY */}
        {postsWithVirality.length > 0 && (
          <section className="card">
            <h2>2. Posts & Virality</h2>
            <div className="posts-grid">
              {postsWithVirality.map((p, idx) => (
                <div className="post-card" key={idx}>
                  <h4>Post #{idx + 1}</h4>
                  <p>{p.caption}</p>
                  <p>
                    👍 {p.likes} · 💬 {p.comments} · 👀 {p.views}
                  </p>
                  <span className="virality-badge" style={{ background: p.viralityColor }}>
                    {p.viralityLabel} ({(p.viralityScore * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* KATEGORIE + VARIANTEN */}
        <section className="card" id="section-prompts">
          <h2>3. Kategorie + Varianten</h2>

          <label>
            Kategorie:
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Automatisch</option>
              <option value="Humor">Humor</option>
              <option value="Tutorial">Tutorial</option>
              <option value="Challenge">Challenge</option>
            </select>
          </label>

          <label>
            Prompt-Varianten:
            <select value={variantsPerPost} onChange={(e) => setVariantsPerPost(e.target.value)}>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </label>

          <button className="btn btn-secondary" onClick={handleGeneratePrompts} disabled={loadingPrompts}>
            {loadingPrompts ? "Generiere…" : "Prompts generieren"}
          </button>
        </section>

        {/* PROMPTS */}
        {prompts.length > 0 && (
          <section className="card">
            <h2>4. Generierte Prompts</h2>
            <div className="prompt-grid">
              {prompts.map((p, idx) => (
                <div className="prompt-card" key={idx}>
                  <div className="prompt-header">
                    <span>Prompt #{idx + 1}</span>
                    <button className="btn btn-ghost" onClick={() => handleCopyPrompt(p, idx)}>
                      {copyInfo === idx ? "Kopiert!" : "Copy"}
                    </button>
                  </div>
                  <p>{p}</p>
                </div>
              ))}
            </div>

            <button className="btn btn-primary" onClick={handleGenerateVideoIdeas} disabled={loadingVideos}>
              {loadingVideos ? "Generiere…" : "Skripte generieren"}
            </button>
          </section>
        )}

        {/* VIDEOIDEEN */}
        {videoIdeas.length > 0 && (
          <section className="card" id="section-scripts">
            <h2>5. Videoideen / Skripte</h2>
            <div className="idea-grid">
              {videoIdeas.map((v, idx) => (
                <div className="idea-card" key={idx}>
                  <h4>Prompt #{idx + 1}</h4>
                  <p>{v.prompt}</p>
                  <p>{v.idea}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DOWNLOADS */}
        <section className="card" id="section-downloads">
          <h2>Downloads</h2>
          <button className="btn btn-secondary" onClick={downloadTxt}>
            Download .txt
          </button>
          <button className="btn btn-secondary" onClick={downloadCsv}>
            Download .csv
          </button>
          <button className="btn btn-secondary" onClick={downloadDocx}>
            Download .docx
          </button>
        </section>

        <footer className="footer">
          Instagram Content KI – Dashboard UI (ohne Premium-System)
        </footer>
      </main>
    </div>
  );
}

export default App;
