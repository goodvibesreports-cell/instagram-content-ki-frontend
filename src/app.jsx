import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = 'https://instagram-content-ki-backend.onrender.com';

function App() {
  const [file, setFile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
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

  const handleGenerate = async () => {
    if (!prompt) return alert('Bitte Prompt eingeben');
    try {
      const res = await axios.post(`${BACKEND_URL}/generate`, { prompt });
      setResult(res.data.result);
    } catch (err) {
      console.error(err);
      setResult('Generierung fehlgeschlagen');
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
        <h2>2. Prompt generieren</h2>
        <textarea
          rows="4"
          cols="50"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <br />
        <button onClick={handleGenerate}>Generieren</button>
        <p>{result}</p>
      </div>
    </div>
  );
}

export default App;
