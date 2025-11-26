import React from "react";

export default function AnalyzeResult({ result }) {
  if (!result) return null;
  return (
    <div className="analysis-result">
      <h4>Analyse Ergebnis</h4>
      <pre className="generated-text">{result.content || result}</pre>
    </div>
  );
}

