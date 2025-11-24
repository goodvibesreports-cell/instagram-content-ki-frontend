import React, { useState, useEffect } from 'react'
import axios from 'axios'

// Backend URL auf Render
const BACKEND_URL = 'https://instagram-content-ki-backend.onrender.com'

function App() {
  const [file, setFile] = useState(null)
  const [posts, setPosts] = useState([])
  const [prompt, setPrompt] = useState('')
  const [generated, setGenerated] = useState('')
  const [message, setMessage] = useState('')

  const handleUpload = async () => {
    if (!file) return alert('Datei auswählen')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await axios.post(`${BACKEND_URL}/upload`, formData)
      setMessage(res.data.message)
      fetchPosts()
    } catch (err) {
      setMessage('Upload fehlgeschlagen: ' + err.response?.data?.error)
    }
  }

  const fetchPosts = async () => {
    const res = await axios.get(`${BACKEND_URL}/posts`)
    setPosts(res.data)
  }

  const handleGenerate = async () => {
    if (!prompt) return alert('Prompt eingeben')
    try {
      const res = await axios.post(`${BACKEND_URL}/generate`, { prompt })
      setGenerated(res.data.generated)
    } catch (err) {
      setMessage('Generierung fehlgeschlagen: ' + err.response?.data?.error)
    }
  }

  useEffect(() => { fetchPosts() }, [])

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Instagram Content KI</h1>

      <div>
        <input type="file" accept=".json" onChange={e => setFile(e.target.files[0])} />
        <button onClick={handleUpload}>Upload</button>
      </div>
      <p>{message}</p>

      <h2>Posts</h2>
      <ul>
        {posts.map(p => (
          <li key={p.post_id}>
            {p.caption} — Likes: {p.likes}, Comments: {p.comments}, Views: {p.views}
          </li>
        ))}
      </ul>

      <div>
        <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Prompt eingeben" style={{ width: '400px' }} />
        <button onClick={handleGenerate}>Generieren</button>
      </div>
      <h2>Generated Content</h2>
      <p>{generated}</p>
    </div>
  )
}

export default App
