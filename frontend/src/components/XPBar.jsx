import { useEffect, useState } from "react";

export default function XPBar() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/gamification")
      .then(res => res.json())
      .then(setData)
      .catch(() => setError("Failed to load XP"));
  }, []);

  if (error) return <p>{error}</p>;
  if (!data) return <p>Loading XP...</p>;

  return (
    <div style={{ marginBottom: 20 }}>
      <h3>Level {data.level}</h3>

      <div
        style={{
          height: 20,
          background: "#333",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${data.progress}%`,
            height: "100%",
            background: "#4caf50",
          }}
        />
      </div>

      <p>{data.progress}/100 XP</p>
    </div>
  );
}
