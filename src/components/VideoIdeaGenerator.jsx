import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = 'https://instagram-content-ki-backend.onrender.com';

const VideoIdeaGenerator = () => {
  const [file, setFile] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [error, setError] = useState('');
  const [prompts, setPrompts] = useState([]);
  const [videoIdeas, setVideoIdeas] = useState([]);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Kopiert!');
  };

  const exportJSON = () => {
    const data = { prompts, videoIdeas };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'video_ideas.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadAndGenerate = async () => {
    if (!file) {
      setError('Bitte eine Datei auswählen');
      return;
    }

    setError('');
    setPrompts([]);
    setVideoIdeas([]);

    try {
      // -------------------------
      // 1️⃣ Datei hochladen
      // -------------------------
      setLoadingUpload(true);
      const formData = new FormData();
      formData.append('file', file);
      await axios.post(`${BACKEND_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setLoadingUpload(false);

      // -------------------------
      // 2️⃣ Prompts generieren
      // -------------------------
      setLoadingPrompts(true);
      const promptRes = await axios.post(`${BACKEND_URL}/generate-prompts`);
      const generatedPrompts = promptRes.data.prompts;
      setPrompts(generatedPrompts);
      setLoadingPrompts(false);

      // -------------------------
      // 3️⃣ Videoideen generieren
      // -------------------------
      setLoadingIdeas(true);
      const ideasRes = await axios.post(`${BACKEND_URL}/generate-video-ideas`, { prompts: generatedPrompts });
      setVideoIdeas(ideasRes.data.videoIdeas);
      setLoadingIdeas(false);

    } catch (err) {
      console.error(err);
      setError('Fehler beim Generieren der Videoideen');
      setLoadingUpload(false);
      setLoadingPrompts(false);
      setLoadingIdeas(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Videoideen Generator</h2>

      <input type="file" accept=".json" onChange={handleFileChange} className="mb-2" />
      <button
        onClick={handleUploadAndGenerate}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        disabled={loadingUpload || loadingPrompts || loadingIdeas}
      >
        {loadingUpload ? 'Upload...' : loadingPrompts ? 'Prompts generieren...' : loadingIdeas ? 'Videoideen generieren...' : 'Upload & Generieren'}
      </button>

      {error && <p className="text-red-500">{error}</p>}

      {prompts.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold flex justify-between items-center">
            Generierte Prompts
            <button onClick={exportJSON} className="bg-green-500 text-white px-2 py-1 rounded text-sm">Export JSON</button>
          </h3>
          <ul className="list-disc ml-6">
            {prompts.map((p, idx) => (
              <li key={idx} className="flex justify-between items-center">
                <span>{p}</span>
                <button onClick={() => copyToClipboard(p)} className="ml-2 bg-gray-200 px-2 rounded text-sm">Kopieren</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {videoIdeas.length > 0 && (
        <div>
          <h3 className="font-semibold flex justify-between items-center">
            Videoideen / Skripte
            <button onClick={exportJSON} className="bg-green-500 text-white px-2 py-1 rounded text-sm">Export JSON</button>
          </h3>
          {videoIdeas.map((idea, idx) => (
            <div key={idx} className="border p-2 rounded mb-2">
              <p><strong>Prompt:</strong> {idea.prompt}</p>
              <p><strong>Video-Idee:</strong> {idea.idea}</p>
              <button onClick={() => copyToClipboard(idea.idea)} className="mt-1 bg-gray-200 px-2 rounded text-sm">Kopieren</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoIdeaGenerator;
