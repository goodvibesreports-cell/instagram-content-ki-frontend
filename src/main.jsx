import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Root Element finden
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "Root-Element fehlt! Stelle sicher, dass <div id='root'></div> in index.html steht."
  );
}

// Render
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
