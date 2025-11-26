import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCreatorProfile, saveCreatorProfile } from "../api";

const toneOptions = ["seriös", "frech", "motiviert", "edgy", "ruhig", "laut"];

export default function CreatorDNAPage({ token, onComplete, profile }) {
  const [form, setForm] = useState({
    niche: "",
    toneOfVoice: "seriös",
    targetAudience: "",
    contentGoals: "",
    exampleHooks: "",
    exampleCaptions: "",
    bannedWords: "",
    creatorStatement: ""
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const res = await getCreatorProfile(token);
        const remoteProfile = res?.profile;
        if (remoteProfile) {
          setForm({
            niche: remoteProfile.niche || "",
            toneOfVoice: remoteProfile.toneOfVoice || "seriös",
            targetAudience: remoteProfile.targetAudience || "",
            contentGoals: remoteProfile.contentGoals?.join(", ") || "",
            exampleHooks: remoteProfile.exampleHooks?.join("\n") || "",
            exampleCaptions: remoteProfile.exampleCaptions?.join("\n") || "",
            bannedWords: remoteProfile.bannedWords?.join(", ") || "",
            creatorStatement: remoteProfile.creatorStatement || ""
          });
        }
      } catch {
        // ignore – no profile yet
      } finally {
        setLoading(false);
      }
    }
    if (token) load();
  }, [token]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    try {
      const payload = {
        niche: form.niche,
        toneOfVoice: form.toneOfVoice,
        targetAudience: form.targetAudience,
        contentGoals: form.contentGoals.split(",").map((v) => v.trim()).filter(Boolean),
        exampleHooks: form.exampleHooks.split("\n").map((v) => v.trim()).filter(Boolean),
        exampleCaptions: form.exampleCaptions.split("\n").map((v) => v.trim()).filter(Boolean),
        bannedWords: form.bannedWords.split(",").map((v) => v.trim()).filter(Boolean),
        creatorStatement: form.creatorStatement
      };
      const res = await saveCreatorProfile(token, payload);
      const savedProfile = res?.profile || payload;
      setStatus({ type: "success", message: "Creator DNA gespeichert!" });
      onComplete?.(savedProfile);
      setTimeout(() => nav("/dashboard"), 400);
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  };

  if (loading) {
    return <p>Lade Creator Profil…</p>;
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">🧬 Creator DNA Wizard</h2>
          <p className="card-subtitle">Definiere deinen Stil, damit alle KI-Outputs perfekt passen.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="dna-form">
        <label>
          Nische *
          <input value={form.niche} onChange={(e) => handleChange("niche", e.target.value)} required placeholder="z.B. Business Storytelling" />
        </label>
        <label>
          Tonalität
          <select value={form.toneOfVoice} onChange={(e) => handleChange("toneOfVoice", e.target.value)}>
            {toneOptions.map((tone) => <option key={tone} value={tone}>{tone}</option>)}
          </select>
        </label>
        <label>
          Zielgruppe
          <input value={form.targetAudience} onChange={(e) => handleChange("targetAudience", e.target.value)} placeholder="z.B. Gründer:innen 25-35" />
        </label>
        <label>
          Content-Ziele (kommagetrennt)
          <input value={form.contentGoals} onChange={(e) => handleChange("contentGoals", e.target.value)} placeholder="Reichweite, Vertrauen, Sales" />
        </label>
        <label>
          Beispiel Hooks (je Zeile ein Hook)
          <textarea value={form.exampleHooks} onChange={(e) => handleChange("exampleHooks", e.target.value)} rows={4} />
        </label>
        <label>
          Beispiel Captions (je Zeile)
          <textarea value={form.exampleCaptions} onChange={(e) => handleChange("exampleCaptions", e.target.value)} rows={4} />
        </label>
        <label>
          Banned Wörter (kommagetrennt)
          <input value={form.bannedWords} onChange={(e) => handleChange("bannedWords", e.target.value)} />
        </label>
        <label>
          Creator Statement
          <textarea value={form.creatorStatement} onChange={(e) => handleChange("creatorStatement", e.target.value)} rows={3} />
        </label>
        <button type="submit" className="btn btn-primary">💾 Speichern & Weiter</button>
        {status && <p className={`status-message ${status.type === "error" ? "error" : "success"}`}>{status.message}</p>}
      </form>
    </div>
  );
}

