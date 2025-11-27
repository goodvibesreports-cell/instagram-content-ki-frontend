// src/components/UploadZone.jsx
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadPosts, uploadFolder } from "../api";

const PLATFORM_OPTIONS = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram (Beta)" },
  { value: "facebook", label: "Facebook (Beta)" }
];

export function buildFileTree(fileList = []) {
  const entries = Array.from(fileList || []);
  const jsonFiles = [];
  const tree = entries.map((file) => {
    const path = file.webkitRelativePath || file.relativePath || file.name;
    const isJson = file.name.toLowerCase().endsWith(".json");
    if (isJson) {
      jsonFiles.push(file);
    }
    return { path, isJson };
  });

  return {
    jsonFiles,
    totalFiles: entries.length,
    jsonCount: jsonFiles.length,
    tree
  };
}

export default function UploadZone({ token, onUploadSuccess }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [folderSummary, setFolderSummary] = useState(null);
  const [error, setError] = useState(null);
  const [platform, setPlatform] = useState("tiktok");
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const navigate = useNavigate();

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
      const result = await uploadPosts(file, platform, token);
      if (result.success) {
        const meta = result.meta || result.data?.meta || {};
        const analysis = result.analysis || result.data?.analysis || null;
        const postsPreview = result.postsPreview || result.posts || result.data?.posts || [];
        const links = postsPreview.map((post) => post.link).filter(Boolean);
        const count = result.totalPosts ?? result.count ?? postsPreview.length ?? 0;
        const payload = {
          count,
          message: result.message || "Upload erfolgreich",
          meta,
          platform: result.platform || platform,
          posts: postsPreview,
          links,
          analysis,
          summary: result.summary,
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
        const targetPlatform = (result.platform || platform || "tiktok").toLowerCase();
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
    const { jsonFiles, totalFiles, jsonCount } = buildFileTree(fileList);
    if (!jsonFiles.length) {
      setError("Keine JSON-Dateien im Ordner gefunden.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadResult(null);
    try {
      const response = await uploadFolder(jsonFiles, token);
      if (response?.success === false) {
        setError(response.error?.message || response.message || "Ordner-Upload fehlgeschlagen");
        return;
      }

      const summaryPayload = {
        totalFiles: response.totalFiles ?? totalFiles,
        processedFiles: response.processedFiles ?? jsonCount,
        ignoredFiles: response.ignoredFiles ?? Math.max(totalFiles - jsonCount, 0),
        jsonCount
      };
      setFolderSummary(summaryPayload);

      const payload = {
        count: response.videoCount ?? 0,
        message: `Ordner analysiert (${summaryPayload.processedFiles}/${summaryPayload.totalFiles})`,
        platform: response.platform || "tiktok",
        posts: [],
        links: [],
        analysis: response.analysis,
        summary: summaryPayload,
        datasetId: response.datasetId || response.dataset?._id || null,
        dataset: response.dataset || null
      };

      setUploadResult(payload);
      onUploadSuccess?.(payload);
      const targetPlatform = (response.platform || "tiktok").toLowerCase();
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
      <div className="form-group" style={{ marginBottom: "1rem" }}>
        <label className="form-label">Plattform auswählen</label>
        <select
          className="form-select"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          disabled={isUploading}
        >
          {PLATFORM_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {platform !== "tiktok" && (
          <p className="helper-text">Beta: Ergebnisse noch eingeschränkt</p>
        )}
      </div>

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
          <h4>📦 TikTok Ordner</h4>
          <p>
            Lade deinen kompletten TikTok Datenordner hoch – CreatorOS filtert automatisch alle JSON-Dateien
            und ignoriert Watch History &amp; Likes.
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
            style={{ display: "none" }}
            onChange={(e) => handleFolderFiles(e.target.files)}
          />
        </div>
      </div>

      {folderSummary && (
        <div className="status-message info" style={{ marginTop: "1rem" }}>
          <strong>Folder Upload:</strong> {folderSummary.processedFiles ?? 0} von {folderSummary.totalFiles ?? 0} Dateien verarbeitet ·{" "}
          {folderSummary.jsonCount ?? 0} JSON-Dateien erkannt · {folderSummary.ignoredFiles ?? 0} ignoriert
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
