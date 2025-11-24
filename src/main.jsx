import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Professionelle Struktur für Render-Deployment
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Bitte stelle sicher, dass <div id="root"></div> im HTML vorhanden ist.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
