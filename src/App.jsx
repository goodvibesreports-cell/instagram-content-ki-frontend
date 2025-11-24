import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = 'https://instagram-content-ki-backend.onrender.com'; // Dein Render Backend

function App() {
  const [file, setFile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState('');
  const [prompts, setPrompts] = useState([]);
  const [videoIdeas, setVideoIdeas] = useState([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [customResult, setCustomResult] = useState('');

  // Datei auswählen
  const handleFileChange = (e) => setFile(e.target.files[0]);

  // Datei hochladen
  const handleUpload = async () => {
    if (!file) return alert('Bitte JSON Datei auswählen');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${BACKEND_URL}/upload`, formData);
      setMessage(res.data.message);

      // Lokale Anzeige der Posts
      const text = await file.text();
      setPosts(JSON.parse(text));

      setPrompts([]);
      setVideoIdeas([]);
      setCustomResult('');
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || 'Upload fehlgeschlagen');
    }
  };

  // Prompts generieren
  const handleGeneratePrompts = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/generate-prompts`);
      setPrompts(res.data.prompts);
      setVideoIdeas([]);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Prompts Generierung fehlgeschlagen');
    }
  };

  // Videoideen generieren
  const handleGenerateVideoIdeas = async () => {
    if (!prompts.length) return alert('Bitte zuerst Prompts generieren');
    try {
      const res = await axios.post(`${BACKEND_URL}/generate-video-ideas`, { prompts });
      setVideoIdeas(res.data.videoIdeas);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Videoideen Generierung fehlgeschlagen');
    }
  };

  // Eigenen Prompt generieren
  const handleCustomPrompt = async () => {
    if (!customPrompt) return alert('Bitte Prompt eingeben');
    try {
      const res = await axios.post(`${BACKEND_URL}/generate`, { prompt: customPrompt });
      setCustomResult(res.data.result);
    } catch (err) {
      setCustomResult(err.response?.data?.error || 'Generierung fehlgeschlagen');
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Instagram Content KI</h1>

      <section>
        <h2>1️⃣ JSON Datei hochladen</h2>
        <input type="file" accept=".json" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload</button>
        {message && <p>{message}</p>}
      </section>

      <section>
        <h2>Posts</h2>
        <ul>
          {posts.map((p, idx) => (
            <li key={idx}>
              <b>{p.caption}</b> – Likes: {p.likes}, Comments: {p.comments}, Views: {p.views}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>2️⃣ Prompts generieren</h2>
        <button onClick={handleGeneratePrompts}>Prompts erstellen</button>
        <ul>
          {prompts.map((p, idx) => <li key={idx}>{p}</li>)}
        </ul>
      </section>

      <section>
        <h2>3️⃣ Videoideen generieren</h2>
        <button onClick={handleGenerateVideoIdeas}>Videoideen erstellen</button>
        <ul>
          {videoIdeas.map((v, idx) => (
            <li key={idx}>
              <strong>Prompt:</strong> {v.prompt} <br />
              <strong>Idee:</strong> {v.idea}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>4️⃣ Eigenen Prompt generieren</h2>
        <input
          type="text"
          placeholder="Dein Prompt..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          style={{ width: '60%' }}
        />
        <button onClick={handleCustomPrompt}>Generieren</button>
        {customResult && <p>{customResult}</p>}
      </section>
    </div>
  );
}

export default App;
