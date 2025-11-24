import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [topPosts, setTopPosts] = useState([]);
  const [suggestions, setSuggestions] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => setFile(e.target.files[0]);

  const uploadFile = async () => {
    if (!file) return alert("Bitte Datei auswählen!");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        alert(`Fehler: ${data.error}`);
        console.error(data.details);
        return;
      }

      setTopPosts(data);
      setSuggestions("");
    } catch (err) {
      console.error(err);
      alert("Fehler beim Hochladen der Datei");
    }
  };

  const generateContent = async () => {
    if (!topPosts || topPosts.length === 0) return alert("Keine Daten zum Generieren");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topPosts }),
      });

      const data = await res.json();

      if (data.error) {
        alert(`Fehler: ${data.error}`);
        console.error(data.details);
        return;
      }

      setSuggestions(data.suggestions);
    } catch (err) {
      console.error(err);
      alert("Fehler beim Generieren der Vorschläge");
    }
    setLoading(false);
  };

  // CSV Export
  const exportCSV = () => {
    if (!topPosts || topPosts.length === 0) return alert("Keine Daten zum Exportieren");
    
    const csvContent =
      Object.keys(topPosts[0]).join(",") + "\n" +
      topPosts.map(row => Object.values(row).join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "posts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Vorschläge Export
  const exportSuggestions = () => {
    if (!suggestions) return alert("Keine Vorschläge zum Exportieren");

    const blob = new Blob([suggestions], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "suggestions.txt");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: 30, fontFamily: "Arial" }}>
      <h1>Content Creator Dashboard</h1>

      <input
        type="file"
        accept=".csv,application/json"
        onChange={handleFile}
      />
      <button onClick={uploadFile} style={{ marginLeft: 10 }}>
        Posts importieren
      </button>

      {topPosts.length > 0 && (
        <>
          <h3>Posts</h3>
          <table border="1" cellPadding="5">
            <thead>
              <tr>
                {Object.keys(topPosts[0]).map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topPosts.map((row, i) => (
                <tr key={i}>
                  {Object.keys(row).map((col) => (
                    <td key={col}>{row[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 20 }}>
            <button onClick={generateContent} style={{ padding: "8px 14px" }}>
              Vorschläge generieren
            </button>
            <button onClick={exportCSV} style={{ marginLeft: 10 }}>CSV exportieren</button>
            <button onClick={exportSuggestions} style={{ marginLeft: 10 }}>Vorschläge exportieren</button>
          </div>

          {loading && <p>KI Vorschläge werden generiert… Bitte warten.</p>}
        </>
      )}

      {suggestions && (
        <div style={{ marginTop: 20 }}>
          <h3>KI Vorschläge</h3>
          <pre style={{ background: "#eee", padding: 20, whiteSpace: "pre-wrap" }}>
            {suggestions}
          </pre>
        </div>
      )}
    </div>
  );
}
