import React, { useState } from 'react';
import axios from 'axios';

// **Hier Backend-URL einstellen**
// Für lokal: http://localhost:5000
// Für Render: https://instagram-content-ki-backend.onrender.com
const BACKEND_URL = "https://instagram-content-ki-backend.onrender.com";

function App() {
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [generated, setGenerated] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return alert("Bitte JSON-Datei auswählen");
    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axios.post(`${BACKEND_URL}/upload`, formData);
      alert(`Upload erfolgreich: ${res.data.count} Posts`);

      // Posts direkt vom Backend abrufen
      const postsRes = await axios.get(`${BACKEND_URL}/posts`);
      setPosts(postsRes.data.posts);
    } catch (err) {
      alert("Upload fehlgeschlagen: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return alert("Bitte Prompt eingeben");

    try {
      setLoading(true);
      const res = await axios.post(`${BACKEND_URL}/generate`, { prompt });
      setGenerated(res.data.result);
    } catch (err) {
      alert("Generierung fehlgeschlagen: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Instagram Content KI</h1>

      <div>
        <h2>1️⃣ JSON-Datei hochladen</h2>
        <input type="file" accept=".json" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Lade..." : "Hochladen"}
        </button>
      </div>

      {posts.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h2>Hochgeladene Posts:</h2>
          <ul>
            {posts.map(post => (
              <li key={post.post_id}>
                {post.post_id}: {post.caption} ({post.likes} Likes, {post.comments} Kommentare, {post.views} Views)
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <h2>2️⃣ Content generieren</h2>
        <input
          type="text"
          placeholder="Prompt eingeben"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generiere..." : "Generieren"}
        </button>
      </div>

      {generated && (
        <div style={{ marginTop: 20 }}>
          <h2>Generierter Content:</h2>
          <p>{generated}</p>
        </div>
      )}
    </div>
  );
}

export default App;
