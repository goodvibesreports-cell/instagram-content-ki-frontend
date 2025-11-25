// src/pages/Dashboard.jsx
import React, { useState, useMemo } from "react";
import axios from "axios";
import { BACKEND_URL } from "../api";

function computeViralityScores(posts) {
  if (!posts.length) return [];
  const maxLikes = Math.max(...posts.map((p) => p.likes || 0), 1);
  const maxComments = Math.max(...posts.map((p) => p.comments || 0), 1);
  const maxViews = Math.max(...posts.map((p) => p.views || 0), 1);

  return posts.map((p) => {
    const l = (p.likes || 0) / maxLikes;
    const c = (p.comments || 0) / maxComments;
    const v = (p.views || 0) / maxViews;
    const score = Math.round(((l * 0.4 + c * 0.3 + v * 0.3) || 0) * 100);
    return { ...p, viralityScore: score };
  });
}

function viralityClass(score) {
  if (score >= 70) return "badge-virality badge-virality--high";
  if (score >= 40) return "badge-virality badge-virality--medium";
  return "badge-virality badge-virality--low";
}

export default function Dashboard({ token, userEmail }) {
  const [file, setFile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState("");
  const [prompts, setPrompts] = useState([]);
  const [videoIdeas, setVideoIdeas] = useState([]);

  const [message, setMessage] = useState("");
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [copyIndex, setCopyIndex] = useState(null);

  const enhancedPosts = useMemo(
    () => computeViralityScores(posts),
    [posts]
  );

  const avgVirality =
    enhancedPosts.length > 0
      ? Math.round(
          enhancedPosts.reduce((s, p) => s + (p.viralityScore || 0), 0) /
            enhancedPosts.length
        )
      : 0;

  // Drag & Drop
  function handleDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.name.endsWith(".json")) {
      setFile(f);
      setMessage(`Datei ausgewählt: ${f.name}`);
    } else {
      setMessage("Bitte eine .json Datei ablegen.");
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  async function handleUpload() {
    if (!file) return alert("Bitte eine JSON-Datei auswählen.");
    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoadingUpload(true);
      setMessage("Upload läuft…");
      setPosts([]);
      setPrompts([]);
      setVideoIdeas([]);

      await axios.post(`${BACKEND_URL}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const raw = await file.text();
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        setPosts(data);
        setMessage("Upload & Analyse erfolgreich.");
      } else {
        setMessage("JSON muss ein Array von Posts sein.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Upload fehlgeschlagen.");
    } finally {
      setLoadingUpload(false);
    }
  }

  async function handleGeneratePrompts() {
    if (!posts.length) return alert("Bitte zuerst Posts hochladen.");

    try {
      setLoadingPrompts(true);
      setPrompts([]);
      setVideoIdeas([]);
      setCopyIndex(null);
      setMessage("");

      const res = await axios.post(
        `${BACKEND_URL}/generate-prompts`,
        { category },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const arr = res.data?.prompts;
      if (Array.isArray(arr)) {
        setPrompts(arr);
      } else {
        setMessage("Prompts konnten nicht generiert werden.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Fehler beim Generieren der Prompts.");
    } finally {
      setLoadingPrompts(false);
    }
  }

  async function handleGenerateVideoIdeas() {
    if (!prompts.length) return alert("Bitte zuerst Prompts generieren.");

    try {
      setLoadingVideos(true);
      setVideoIdeas([]);
      setMessage("");

      const res = await axios.post(
        `${BACKEND_URL}/generate-video-ideas`,
        { prompts },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const arr = res.data?.videoIdeas;
      if (Array.isArray(arr)) {
        setVideoIdeas(arr);
      } else {
        setMessage("Videoideen konnten nicht generiert werden.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Fehler beim Generieren der Videoideen.");
    } finally {
      setLoadingVideos(false);
    }
  }

  async function handleCopyPrompt(text, index) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyIndex(index);
      setTimeout(() => setCopyIndex(null), 1200);
    } catch (err) {
      console.error(err);
      alert("Konnte Prompt nicht kopieren.");
    }
  }

  function downloadFile(filename, content, mime = "text/plain") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function downloadPromptsAsTxt() {
    if (!prompts.length) return;
    downloadFile("prompts.txt", prompts.join("\n\n"));
  }

  function downloadPromptsAsCsv() {
    if (!prompts.length) return;
    const rows = prompts.map((p, i) => `"${i + 1}";"${p.replace(/"/g, '""')}"`);
    const csv = "index;prompt\n" + rows.join("\n");
    downloadFile("prompts.csv", csv, "text/csv");
  }

  function downloadPromptsAsDocx() {
    if (!prompts.length) return;
    const content =
      "Instagram Content KI – Prompts\n\n" + prompts.join("\n\n---\n\n");
    // Achtung: technisch kein echtes DOCX-Format, aber als einfache Textdatei mit .docx-Endung
    downloadFile(
      "prompts.docx",
      content,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  }

  return (
    <div className="dashboard">
      {/* KPI-Kacheln */}
      <section className="dashboard-row">
        <div className="card kpi-card">
          <div className="kpi-label">Posts</div>
          <div className="kpi-value">{posts.length}</div>
          <div className="kpi-desc">Analyse-Basis aus deinem JSON Upload</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-label">Ø Virality</div>
          <div className="kpi-value">
            {avgVirality}
            <span className="kpi-unit">/100</span>
          </div>
          <div className="kpi-desc">
            Durchschnittlicher Virality-Score deiner geladenen Posts
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-label">Prompts</div>
          <div className="kpi-value">{prompts.length}</div>
          <div className="kpi-desc">Generierte Reel-Ideen</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-label">Skripte</div>
          <div className="kpi-value">{videoIdeas.length}</div>
          <div className="kpi-desc">Fertige Video-Skripte</div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="card">
        <h2>1. JSON Upload</h2>
        <p className="muted">
          Ziehe deine <code>.json</code>-Datei hier hinein oder wähle sie aus.
        </p>

        <div
          className="dropzone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <p>
            {file
              ? `Ausgewählt: ${file.name}`
              : "Datei hier ablegen oder klicken zum Auswählen"}
          </p>
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFile(f || null);
              if (f) setMessage(`Datei ausgewählt: ${f.name}`);
            }}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={!file || loadingUpload}
        >
          {loadingUpload ? "Lade hoch…" : "Upload & Analysieren"}
        </button>

        {message && <p className="status-message">{message}</p>}
      </section>

      {/* Posts mit Virality */}
      {enhancedPosts.length > 0 && (
        <section className="card">
          <h2>2. Analysierte Posts & Virality</h2>
          <ul className="post-list">
            {enhancedPosts.map((p, idx) => (
              <li key={idx} className="post-item">
                <div className="post-main">
                  <div className="post-caption">{p.caption}</div>
                  <div className="post-metrics">
                    👍 {p.likes} · 💬 {p.comments} · 👀 {p.views}
                  </div>
                </div>
                <div className={viralityClass(p.viralityScore)}>
                  {p.viralityScore}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Prompt Generation */}
      <section className="card">
        <h2>3. Prompt-Generierung</h2>
        <div className="form-row">
          <div>
            <label>Kategorie (optional)</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Automatisch</option>
              <option value="Humor">Humor</option>
              <option value="Tutorial">Tutorial</option>
              <option value="Challenge">Challenge / Trends</option>
            </select>
          </div>

          <div className="form-row-actions">
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

      {/* Prompts + Copy + Downloads */}
      {prompts.length > 0 && (
        <section className="card">
          <h2>4. Generierte Prompts</h2>

          <div className="action-row">
            <button className="btn btn-outline" onClick={downloadPromptsAsTxt}>
              ⬇ TXT
            </button>
            <button className="btn btn-outline" onClick={downloadPromptsAsCsv}>
              ⬇ CSV
            </button>
            <button className="btn btn-outline" onClick={downloadPromptsAsDocx}>
              ⬇ DOCX
            </button>
          </div>

          <ul className="prompt-list">
            {prompts.map((p, idx) => (
              <li key={idx} className="prompt-item">
                <div className="prompt-text">{p}</div>
                <button
                  className="btn btn-ghost"
                  onClick={() => handleCopyPrompt(p, idx)}
                >
                  {copyIndex === idx ? "Kopiert ✅" : "Copy"}
                </button>
              </li>
            ))}
          </ul>

          <button
            className="btn btn-primary"
            onClick={handleGenerateVideoIdeas}
            disabled={loadingVideos}
          >
            {loadingVideos ? "Generiere Skripte…" : "Videoideen / Skripte generieren"}
          </button>
        </section>
      )}

      {/* Skripte */}
      {videoIdeas.length > 0 && (
        <section className="card">
          <h2>5. Videoideen & Skripte</h2>
          <ul className="script-list">
            {videoIdeas.map((v, idx) => (
              <li key={idx} className="script-item">
                <div className="script-prompt">
                  <strong>Prompt:</strong> {v.prompt}
                </div>
                <pre className="script-body">{v.idea}</pre>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
