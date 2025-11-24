// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Sicherstellen, dass das Root-Element existiert
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error(
    'Root-Element (#root) nicht gefunden. Stelle sicher, dass <div id="root"></div> in index.html enthalten ist.'
  );
}

// React 18 – Root erstellen
const root = ReactDOM.createRoot(rootElement);

// App rendern
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
