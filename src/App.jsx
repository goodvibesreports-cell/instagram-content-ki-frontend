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

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return alert('Bitte JSON Datei auswählen');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${BACKEND_URL}/upload`, formData);
      setMessage(res.data.message);
      const text = await file.text();
      setPosts(JSON.parse(text));
    } catch (err) {
      console.error(err);
      setMessage('Upload fehlgeschlagen');
    }
  };

  const handleGeneratePrompts = async () => {
    if (!posts.length) return alert('Bitte zuerst Posts hochladen');
    try {
      const res = await axios.post(`${BACKEND_URL}/generate-prompts`, { category });
      setPrompts(res.data.prompts);
    } catch (err) {
      console.error(err);
      setPrompts([]);
    }
  };

  const handleGenerateVideoIdeas = async () => {
    if (!prompts.length) return alert('Bitte zuerst Prompts generieren');
    try {
      const res = await axios.post(`${BACKEND_URL}/generate-video-ideas`, { prompts });
      setVideoIdeas(res.data.videoIdeas);
    } catch (err) {
      console.error(err);
      setVideoIdeas([]);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>Instagram Content KI</h1>

      <div>
        <h2>1. JSON Datei hochladen</h2>
        <input type="file" accept=".json" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload</button>
        <p>{message}</p>
      </div>

      <div>
        <h2>Posts</h2>
        <ul>
          {posts.map((p, idx) => (
            <li key={idx}>
              <b>{p.caption}</b> – Likes: {p.likes}, Comments: {p.comments}, Views: {p.views}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2>2. Kategorie auswählen (optional)</h2>
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">Keine Auswahl</option>
          <option value="Humor">Humor</option>
          <option value="Tutorial">Tutorial</option>
          <option value="Challenge">Challenge</option>
        </select>
        <button onClick={handleGeneratePrompts}>Prompts generieren</button>
      </div>

      <div>
        <h2>3. Generierte Prompts</h2>
        <ul>
          {prompts.map((p, idx) => <li key={idx}>{p}</li>)}
        </ul>
        <button onClick={handleGenerateVideoIdeas}>Videoideen generieren</button>
      </div>

      <div>
        <h2>4. Videoideen / Skripte</h2>
        <ul>
          {videoIdeas.map((v, idx) => (
            <li key={idx}>
              <b>Prompt:</b> {v.prompt}<br/>
              <b>Idee:</b> {v.idea}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
