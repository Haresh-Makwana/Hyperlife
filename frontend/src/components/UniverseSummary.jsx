import { useEffect, useState } from "react";
import { getToken } from "../utils/auth";

export default function UniverseSummary({ universeId }) {
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // If no universe is selected yet, do nothing
    if (!universeId) return;
    
    setError("");
    setSummary("");

    // Securely fetch the summary from your Laravel backend
    fetch(`http://127.0.0.1:8000/api/universes/${universeId}/summary`, {
      headers: {
        "Authorization": `Bearer ${getToken()}`, 
        "Accept": "application/json"
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then(data => setSummary(data.summary))
      .catch(err => {
        console.error("Summary Fetch Error:", err);
        setError("Could not load universe summary");
      });
  }, [universeId]);

  // Loading / Error States with futuristic styling
  if (error) {
    return <p style={{ color: "#ff5f6d", fontSize: "0.85rem", marginTop: "10px" }}>{error}</p>;
  }
  
  if (!summary) {
    return <p style={{ color: "#8b92a5", fontSize: "0.85rem", marginTop: "10px", fontStyle: "italic" }}>Scanning sector telemetry...</p>;
  }

  // Success State: Glowing Cyan Text
  return (
    <p style={{ color: "#00ffe7", fontSize: "0.85rem", marginTop: "10px", fontWeight: "500", letterSpacing: "0.5px" }}>
      <span style={{ marginRight: "5px", animation: "pulse 2s infinite" }}>✧</span> {summary}
    </p>
  );
}