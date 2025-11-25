// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Root-Element abrufen
const rootElement = document.getElementById("root");

// Sicherheitscheck
if (!rootElement) {
  throw new Error(
    'Root-Element nicht gefunden. Stelle sicher, dass <div id="root"></div> in der index.html vorhanden ist.'
  );
}

// Render der React-App
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
