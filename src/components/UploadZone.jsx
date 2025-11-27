// src/components/UploadZone.jsx
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadUniversal } from "../api";

const ALLOWED_EXTENSIONS = [".json", ".zip", ".txt", ".csv"];

export function buildFileTree(fileList = []) {
  const entries = Array.from(fileList || []);
  const allowedFiles = [];
  const tree = entries.map((file) => {
    const path = file.webkitRelativePath || file.relativePath || file.name;
    const extension = file.name ? file.name.toLowerCase().substring(file.name.lastIndexOf(".")) : "";
    const isAllowed = ALLOWED_EXTENSIONS.includes(extension) && file.size > 0;
    if (isAllowed) {
      allowedFiles.push(file);
    }
    return { path, isAllowed, size: file.size };
  });

  return {
    files: allowedFiles,
    totalFiles: entries.length,
    allowedCount: allowedFiles.length,
    tree
  };
}

export default function UploadZone({ token, onUploadSuccess }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [folderSummary, setFolderSummary] = useState(null);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const navigate = useNavigate();
  const LARGE_WARNING_BYTES = 250 * 1024 * 1024;

  async function handleFile(file) {
    if (!file) return;

    const extension = file.name ? file.name.toLowerCase().substring(file.name.lastIndexOf(".")) : "";
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setError("Bitte nur JSON-, ZIP-, TXT- oder CSV-Dateien hochladen");
      return;
    }
    if (!file.size) {
      setError("Die ausgewählte Datei ist leer (0 Bytes)");
      return;
    }
    setWarning(file.size > LARGE_WARNING_BYTES ? "Datei ist größer als 250MB – Analyse kann etwas länger dauern." : null);

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const result = await uploadUniversal([file], token);
      if (result.success) {
        const meta = result.meta || result.data?.meta || {};
        const analysis = result.analysis || result.data?.analysis || null;
        const postsPreview = result.itemsPreview || result.postsPreview || result.posts || result.items || [];
        const links = postsPreview.map((post) => post.link).filter(Boolean);
        const count = result.count ?? result.totalPosts ?? postsPreview.length ?? 0;
        const payload = {
          count,
          message: result.message || "Upload erfolgreich",
          meta,
          platform: result.platform || "mixed",
          platforms: result.platforms || [],
          posts: postsPreview,
          links,
          analysis,
          perPlatform: result.perPlatform || meta.perPlatform,
          summary: result.summary || meta.summary,
          datasetId: result.datasetId,
          dataset: result.dataset,
          fileName:
            result.fileName ||
            result.dataset?.sourceFilename ||
            meta?.sourceFilename ||
            file.name,
          fileSize: result.fileSize || result.dataset?.fileSize || file.size
        };

        setUploadResult(payload);
        onUploadSuccess?.(payload);
        const targetPlatform = (payload.platforms?.[0] || payload.platform || "tiktok").toLowerCase();
        if (payload.datasetId && navigate) {
          navigate(`/${targetPlatform}/insights/${payload.datasetId}`);
        }
        setTimeout(() => setUploadResult(null), 3000);
      } else {
        setError(result.error?.message || result.message || "Upload fehlgeschlagen");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleFolderFiles(fileList) {
    const { files, totalFiles, allowedCount } = buildFileTree(fileList);
    if (!files.length) {
      setError("Keine gültigen Dateien im Ordner gefunden.");
      return;
    }
    const largestFile = Math.max(...files.map((f) => f.size || 0), 0);
    setWarning(
      largestFile > LARGE_WARNING_BYTES ? "Es wurden sehr große Dateien entdeckt – Analyse kann länger dauern." : null
    );

    setIsUploading(true);
    setError(null);
    setWarning(null);
    setUploadResult(null);
    try {
      const response = await uploadUniversal(files, token);
      if (response?.success === false) {
        setError(response.error?.message || response.message || "Ordner-Upload fehlgeschlagen");
        return;
      }

      const summaryPayload = response.summary || response.meta?.summary || {
        totalFiles: response.totalFiles ?? totalFiles,
        processedFiles: response.processedFiles ?? allowedCount,
        ignoredFiles: response.ignoredFiles ?? Math.max(totalFiles - allowedCount, 0),
        allowedCount
      };
      setFolderSummary(summaryPayload);

      const message =
        response.message ||
        `Ordner analysiert (${summaryPayload.processedFiles ?? 0}/${summaryPayload.totalFiles ?? 0})`;

      const payload = {
        count: response.count ?? response.totalPosts ?? 0,
        message,
        platform: response.platform || "mixed",
        platforms: response.platforms || [],
        posts: response.itemsPreview || [],
        links: [],
        analysis: response.analysis,
        perPlatform: response.perPlatform || response.meta?.perPlatform,
        summary: summaryPayload,
        datasetId: response.datasetId || response.dataset?._id || null,
        dataset: response.dataset || null
      };

      setUploadResult(payload);
      onUploadSuccess?.(payload);
      const targetPlatform = (payload.platforms?.[0] || payload.platform || "tiktok").toLowerCase();
      if (payload.datasetId && navigate) {
        navigate(`/${targetPlatform}/insights/${payload.datasetId}`);
      }
    } catch (err) {
      setError(err.message || "Ordner-Upload fehlgeschlagen");
    } finally {
      setIsUploading(false);
      if (folderInputRef.current) {
        folderInputRef.current.value = "";
      }
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
    <div>
      <p className="helper-text" style={{ marginBottom: "1rem" }}>
        Lade hier komplette Creator- oder Konto-Exporte (JSON/ZIP/TXT/CSV) hoch – keine einzelnen Videodateien. Rohvideos (.mp4,
        .mov etc.) werden automatisch ignoriert, da die Analyse ausschließlich auf Metadaten basiert.
      </p>

      <div className="upload-grid">
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
            accept=".json,.zip,.txt,.csv"
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
              <span>
                {uploadResult.message || "Upload erfolgreich"} · {uploadResult.count}{" "}
                {uploadResult.count === 1 ? "Post" : "Posts"}
              </span>
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
        </div>

        <div className="folder-upload-card">
          <h4>📦 Plattform-Ordner</h4>
          <p>
            Lade deinen kompletten Export-Ordner hoch – CreatorOS filtert automatisch alle relevanten JSON-Dateien und ignoriert
            Watch History &amp; Likes.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => folderInputRef.current?.click()}
            disabled={isUploading}
          >
            Ordner auswählen
          </button>
          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory="true"
            directory="true"
            multiple
            accept=".json,.zip,.txt,.csv"
            style={{ display: "none" }}
            onChange={(e) => handleFolderFiles(e.target.files)}
          />
        </div>
      </div>

      <p className="helper-text" style={{ marginTop: "0.75rem" }}>
        Bitte lade nur Creator- oder Konto-Exporte (JSON/ZIP/TXT/CSV) hoch – reine Videodateien (.mp4, .mov, .jpg usw.) werden
        automatisch übersprungen und nicht ausgewertet.
      </p>

      {folderSummary && (
        <div className="status-message info" style={{ marginTop: "1rem" }}>
          <strong>Folder Upload:</strong> {folderSummary.processedFiles ?? 0} von {folderSummary.totalFiles ?? 0} Dateien verarbeitet ·{" "}
          {folderSummary.ignoredFiles ?? 0} ignoriert
        </div>
      )}

      {warning && (
        <div
          style={{
            marginTop: "1rem",
            color: "var(--warning)",
            fontSize: "0.875rem"
          }}
        >
          ⚠️ {warning}
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: "1rem",
            color: "var(--error)",
            fontSize: "0.875rem"
          }}
        >
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
