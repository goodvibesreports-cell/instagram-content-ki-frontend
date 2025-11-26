// src/components/UploadZone.jsx
import React, { useState, useRef } from "react";
import { uploadPosts } from "../api";

export default function UploadZone({ token, onUploadSuccess }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    
    if (!file.name.endsWith(".json")) {
      setError("Bitte nur JSON-Dateien hochladen");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const result = await uploadPosts(file, token);
      
      if (result.success) {
        setUploadResult(result.data);
        onUploadSuccess?.(result.data);
        
        // Reset nach 3 Sekunden
        setTimeout(() => setUploadResult(null), 3000);
      } else {
        setError(result.error?.message || "Upload fehlgeschlagen");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    handleFile(file);
    e.target.value = "";
  }

  return (
    <div
      className={`upload-zone ${isDragOver ? "drag-over" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {isUploading ? (
        <div className="upload-loading">
          <div className="loading-spinner" />
          <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>
            Lade hoch...
          </p>
        </div>
      ) : uploadResult ? (
        <div className="upload-success">
          <span className="upload-success-icon">✓</span>
          <span>{uploadResult.count} Posts hochgeladen!</span>
        </div>
      ) : (
        <>
          <div className="upload-icon">📁</div>
          <div className="upload-title">
            JSON-Datei hierher ziehen
          </div>
          <div className="upload-subtitle">
            oder klicken zum Auswählen
          </div>
        </>
      )}

      {error && (
        <div style={{ 
          marginTop: "1rem", 
          color: "var(--error)", 
          fontSize: "0.875rem" 
        }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}


