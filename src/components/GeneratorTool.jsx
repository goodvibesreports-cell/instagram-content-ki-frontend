// src/components/GeneratorTool.jsx
import React, { useState } from "react";

export default function GeneratorTool({ 
  title,
  description, 
  icon,
  cost,
  fields,
  onGenerate,
  isLoading,
  result,
  error
}) {
  const [formData, setFormData] = useState({});
  const [copied, setCopied] = useState(false);

  function handleChange(fieldId, value) {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onGenerate(formData);
  }

  async function handleCopy() {
    if (!result) return;
    
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <div>
          <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>{icon}</span>
            {title}
          </h2>
          <p className="card-subtitle">{description}</p>
        </div>
        <div className="tool-cost">
          ⚡ {cost} Credit{cost > 1 ? "s" : ""}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {fields.map((field) => (
          <div className="form-group" key={field.id}>
            <label className="form-label">{field.label}</label>
            
            {field.type === "text" && (
              <input
                type="text"
                className="form-input"
                placeholder={field.placeholder}
                value={formData[field.id] || ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
                required={field.required}
              />
            )}
            
            {field.type === "textarea" && (
              <textarea
                className="form-textarea"
                placeholder={field.placeholder}
                value={formData[field.id] || ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
                required={field.required}
              />
            )}
            
            {field.type === "select" && (
              <select
                className="form-select"
                value={formData[field.id] || field.default || ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
              >
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
            
            {field.type === "number" && (
              <input
                type="number"
                className="form-input"
                min={field.min}
                max={field.max}
                value={formData[field.id] || field.default || ""}
                onChange={(e) => handleChange(field.id, parseInt(e.target.value))}
              />
            )}
          </div>
        ))}

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading}
          style={{ width: "100%", marginTop: "0.5rem" }}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner" style={{ width: 16, height: 16 }} />
              Generiere...
            </>
          ) : (
            <>✨ Generieren</>
          )}
        </button>
      </form>

      {error && (
        <div className="status-message error" style={{ marginTop: "1rem" }}>
          {error}
        </div>
      )}

      {result && (
        <div className="generated-content">
          <button 
            className={`copy-btn ${copied ? "copied" : ""}`}
            onClick={handleCopy}
            title="In Zwischenablage kopieren"
          >
            {copied ? "✓" : "📋"}
          </button>
          <pre className="generated-text">{result}</pre>
        </div>
      )}
    </div>
  );
}

