import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = 'https://instagram-content-ki-backend.onrender.com';

function App() {
  const [file, setFile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState('');
  const [prompts, setPrompts] = useState([]);
  const [videoIdeas, setVideoIdeas] = useState([]);

  const [message, setMessage] = useState('');
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);

  // ---------------------------------------
  // Datei auswählen
  // ---------------------------------------
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    if (!selected || !selected.name.endsWith('.json')) {
      setMessage('Bitte eine gültige .json Datei auswählen');
      return;
    }
    setFile(selected);
    setMessage(`Datei ausgewählt: ${selected.name}`);
  };

  // ---------------------------------------
  // JSON hochladen
  // ---------------------------------------
  const handleUpload = async () => {
    if (!file) return alert('Bitte eine JSON-Datei auswählen.');

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoadingUpload(true);
      setMessage('Upload läuft…');

      // Reset
      setPosts([]);
      setPrompts([]);
      setVideoIdeas([]);

      // Backend Upload
      const res = await axios.post(`${BACKEND_URL}/upload`, formData);
      setMessage(res.data?.message || 'Upload erfolgreich');

      // Lokalen Inhalt sicher parsen
      const raw = await file.text();
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setPosts(parsed);
        } else {
          setPosts([]);
          setMessage('JSON Format ungültig');
        }
      } catch {
        setPosts([]);
        setMessage('JSON konnte nicht gelesen werden');
      }
    } catch (err) {
      console.error('UPLOAD ERROR:', err);
      setMessage('Upload fehlgeschlagen – bitte erneut versuchen.');
    } finally {
      setLoadingUpload(false);
    }
  };

  // ---------------------------------------
  // Prompts generieren
  // ---------------------------------------
  const handleGeneratePrompts = async () => {
    if (!posts.length) return alert('Bitte zuerst Posts hochladen.');

    try {
      setLoadingPrompts(true);
      setPrompts([]);
      setVideoIdeas([]);

      const res = await axios.post(`${BACKEND_URL}/generate-prompts`, {
        category: category.trim()
      });

      const generated = res.data?.prompts;
      if (Array.isArray(generated)) {
        setPrompts(generated);
      } else {
        setPrompts([]);
        setMessage('Konnte keine Prompts generieren.');
      }
    } catch (err) {
      console.error('PROMPT ERROR:', err);
      setMessage('Fehler beim Generieren der Prompts.');
    } finally {
      setLoadingPrompts(false);
    }
  };

  // ---------------------------------------
  // Videoideen generieren
  // ---------------------------------------
  const handleGenerateVideoIdeas = async () => {
    if (!prompts.length) return alert('Bitte zuerst Prompts generieren.');

    try {
      setLoadingVideos(true);
      setVideoIdeas([]);

      const res = await axios.post(`${BACKEND_URL}/generate-video-ideas`, {
        prompts
      });

      const ideas = res.data?.videoIdeas;
      if (Array.isArray(ideas)) {
        setVideoIdeas(ideas);
      } else {
        setMessage('Konnte keine Videoideen generieren.');
      }
    } catch (err) {
      console.error('SCRIPT ERROR:', err);
      setMessage('Fehler beim Generieren der Videoideen.');
    } finally {
      setLoadingVideos(false);
    }
  };

  // ---------------------------------------
  // Render
  // ---------------------------------------
  return (
    <div
      style={{
        padding: '2rem',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '900px',
        margin: '0 auto'
      }}
    >
      <h1>Instagram Content KI</h1>

      {/* -------------------------------- Upload -------------------------------- */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>1. JSON-Datei hochladen</h2>

        <input type="file" accept=".json" onChange={handleFileChange} />

        <button
          onClick={handleUpload}
          disabled={loadingUpload}
          style={{ marginLeft: '1rem' }}
        >
          {loadingUpload ? 'Lade hoch…' : 'Upload'}
        </button>

        {message && <p>{message}</p>}
      </section>

      {/* -------------------------------- Posts -------------------------------- */}
      {posts.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2>Posts ({posts.length})</h2>
          <ul>
            {posts.map((p, idx) => (
              <li key={idx}>
                <b>{p.caption}</b> – Likes: {p.likes} – Comments: {p.comments} – Views: {p.views}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* -------------------------------- Kategorie -------------------------------- */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>2. Kategorie auswählen (optional)</h2>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: '0.25rem', marginRight: '1rem' }}
        >
          <option value="">Keine Auswahl</option>
          <option value="Humor">Humor</option>
          <option value="Tutorial">Tutorial</option>
          <option value="Challenge">Challenge / Trends</option>
        </select>

        <button onClick={handleGeneratePrompts} disabled={loadingPrompts}>
          {loadingPrompts ? 'Generiere…' : 'Prompts generieren'}
        </button>
      </section>

      {/* -------------------------------- Prompts -------------------------------- */}
      {prompts.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2>3. Generierte Prompts</h2>

          <ul>
            {prompts.map((p, idx) => (
              <li key={idx}>{p}</li>
            ))}
          </ul>

          <button
            style={{ marginTop: '1rem' }}
            disabled={loadingVideos}
            onClick={handleGenerateVideoIdeas}
          >
            {loadingVideos ? 'Generiere…' : 'Videoideen generieren'}
          </button>
        </section>
      )}

      {/* -------------------------------- Skripte -------------------------------- */}
      {videoIdeas.length > 0 && (
        <section>
          <h2>4. Videoideen / Skripte</h2>

          <ul>
            {videoIdeas.map((v, idx) => (
              <li key={idx} style={{ marginBottom: '1rem' }}>
                <b>Prompt:</b> {v.prompt}
                <br />
                <b>Idee:</b> {v.idea}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default App;
