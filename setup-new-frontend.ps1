Write-Host "==============================================="
Write-Host "  Instagram Content KI – NEUES FRONTEND SETUP"
Write-Host "  Automatische Installation (Login + Dashboard)"
Write-Host "==============================================="

# -------------------------------------------------------------------
# VARIABLES
# -------------------------------------------------------------------
$frontendPath = "C:\Users\walle\Desktop\instagram-content-ki\frontend"

Write-Host "➡ Frontend-Verzeichnis: $frontendPath"

# Prüfen ob Ordner existiert
if (!(Test-Path $frontendPath)) {
    Write-Host "❌ FEHLER: Frontend-Ordner existiert nicht!"
    exit
}

# -------------------------------------------------------------------
# 1) FRONTEND ORDNER LEEREN (außer node_modules & package.json)
# -------------------------------------------------------------------
Write-Host "🧹 Lösche alte Frontend-Dateien..."

Get-ChildItem -Path $frontendPath -Exclude "node_modules","package.json" | Remove-Item -Recurse -Force

# -------------------------------------------------------------------
# 2) Neue Datei-Struktur anlegen
# -------------------------------------------------------------------
Write-Host "📁 Erstelle neue Struktur..."

New-Item -ItemType Directory -Path "$frontendPath/src" | Out-Null
New-Item -ItemType Directory -Path "$frontendPath/src/pages" | Out-Null
New-Item -ItemType Directory -Path "$frontendPath/src/components" | Out-Null
New-Item -ItemType Directory -Path "$frontendPath/src/styles" | Out-Null

# -------------------------------------------------------------------
# 3) NEUE FRONTEND DATEIEN ERSTELLEN
# -------------------------------------------------------------------

# ========= index.html =========
@"
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Instagram Content KI</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
"@ | Set-Content "$frontendPath/index.html"

# ========= vite.config.js =========
@"
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()]
});
"@ | Set-Content "$frontendPath/vite.config.js"


# ========= src/main.jsx =========
@"
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
"@ | Set-Content "$frontendPath/src/main.jsx"

# ========= src/App.jsx =========
@"
import React, { useEffect, useState } from "react";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import History from "./pages/History.jsx";

export default function App() {
  const [route, setRoute] = useState("login");
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Router Navigation
  const navigate = (page) => setRoute(page);

  useEffect(() => {
    if (token) setRoute("dashboard");
  }, [token]);

  if (!token) {
    return route === "register"
      ? <Register setRoute={setRoute} setToken={setToken} />
      : <Login setRoute={setRoute} setToken={setToken} />;
  }

  // Protected Routes
  if (route === "dashboard") return <Dashboard setRoute={setRoute} token={token} />;
  if (route === "history") return <History setRoute={setRoute} token={token} />;

  return <Login setRoute={setRoute} setToken={setToken} />;
}
"@ | Set-Content "$frontendPath/src/App.jsx"

# ========= Login.jsx =========
@"
import React, { useState } from 'react';
import axios from 'axios';

const API = 'https://instagram-content-ki-backend.onrender.com';

export default function Login({ setRoute, setToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
    try {
      const res = await axios.post(API + '/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
    } catch (err) {
      alert('Login fehlgeschlagen');
    }
  };

  return (
    <div class='container'>
      <h1>Login</h1>
      <input placeholder='Email' onChange={(e)=>setEmail(e.target.value)} />
      <input type='password' placeholder='Passwort' onChange={(e)=>setPassword(e.target.value)} />
      <button onClick={login}>Einloggen</button>
      <p>Noch kein Account? <span onClick={()=>setRoute('register')}>Registrieren</span></p>
    </div>
  );
}
"@ | Set-Content "$frontendPath/src/pages/Login.jsx"

# ========= Register.jsx =========
@"
import React, { useState } from 'react';
import axios from 'axios';

const API = 'https://instagram-content-ki-backend.onrender.com';

export default function Register({ setRoute }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const register = async () => {
    try {
      await axios.post(API + '/auth/register', { email, password });
      setRoute('login');
    } catch (err) {
      alert('Registration fehlgeschlagen');
    }
  };

  return (
    <div class='container'>
      <h1>Registrieren</h1>
      <input placeholder='Email' onChange={(e)=>setEmail(e.target.value)} />
      <input type='password' placeholder='Passwort' onChange={(e)=>setPassword(e.target.value)} />
      <button onClick={register}>Account erstellen</button>
      <p>Schon ein Konto? <span onClick={()=>setRoute('login')}>Login</span></p>
    </div>
  );
}
"@ | Set-Content "$frontendPath/src/pages/Register.jsx"

# ========= Dashboard.jsx =========
@"
import React, { useState } from 'react';
import axios from 'axios';

const API = 'https://instagram-content-ki-backend.onrender.com';

export default function Dashboard({ setRoute, token }) {
  const [file, setFile] = useState();
  const [prompts, setPrompts] = useState([]);
  const [scripts, setScripts] = useState([]);

  const upload = async () => {
    const form = new FormData();
    form.append('file', file);

    await axios.post(API + '/ai/upload', form, {
      headers: { Authorization: 'Bearer ' + token }
    });
  };

  const generatePrompts = async () => {
    const res = await axios.post(API + '/ai/generate-prompts', {}, {
      headers: { Authorization: 'Bearer ' + token }
    });
    setPrompts(res.data.prompts);
  };

  const generateScripts = async () => {
    const res = await axios.post(API + '/ai/generate-video-ideas', { prompts }, {
      headers: { Authorization: 'Bearer ' + token }
    });
    setScripts(res.data.videoIdeas);
  };

  return (
    <div class='container'>
      <h1>Dashboard</h1>

      <input type='file' onChange={(e)=>setFile(e.target.files[0])} />
      <button onClick={upload}>Upload</button>

      <button onClick={generatePrompts}>Prompts generieren</button>

      {prompts.map((p,i)=> <p key={i}>{p}</p>)}

      <button onClick={generateScripts}>Skripte generieren</button>

      {scripts.map((s,i)=> (
        <div key={i}>
          <h3>{s.prompt}</h3>
          <p>{s.idea}</p>
        </div>
      ))}

      <button onClick={()=>setRoute('history')}>History</button>
      <button onClick={()=>{
        localStorage.removeItem('token')
        setRoute('login')
      }}>Logout</button>
    </div>
  );
}
"@ | Set-Content "$frontendPath/src/pages/Dashboard.jsx"

# ========= History.jsx =========
@"
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'https://instagram-content-ki-backend.onrender.com';

export default function History({ setRoute, token }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    axios.get(API + '/history', {
      headers: { Authorization: 'Bearer ' + token }
    }).then(res => setHistory(res.data));
  }, []);

  return (
    <div class='container'>
      <h1>History</h1>

      {history.map((h,i)=> (
        <div key={i}>
          <p>{h.type} – {h.createdAt}</p>
        </div>
      ))}

      <button onClick={()=>setRoute('dashboard')}>Zurück</button>
    </div>
  );
}
"@ | Set-Content "$frontendPath/src/pages/History.jsx"

# ========= index.css =========
@"
body {
  background: #0f172a;
  color: white;
  font-family: Arial;
  margin: 0;
}

.container {
  width: 90%;
  max-width: 500px;
  margin: 40px auto;
  background: #1e293b;
  padding: 20px;
  border-radius: 12px;
}

button {
  background: #3b82f6;
  border: none;
  padding: 12px;
  color: white;
  border-radius: 8px;
  margin-top: 10px;
  width: 100%;
  cursor: pointer;
}

input {
  width: 100%;
  padding: 10px;
  margin: 8px 0;
  border-radius: 6px;
  border: none;
}
"@ | Set-Content "$frontendPath/src/styles/index.css"


# -------------------------------------------------------------------
# 4) NPM INSTALL
# -------------------------------------------------------------------
Write-Host "📦 Installiere NPM Dependencies..."
npm install axios --prefix $frontendPath

Write-Host ""
Write-Host "==============================================="
Write-Host "🎉 NEUES FRONTEND ERFOLGREICH ERSTELLT!"
Write-Host "Starte es mit:  npm run dev"
Write-Host "==============================================="
pause