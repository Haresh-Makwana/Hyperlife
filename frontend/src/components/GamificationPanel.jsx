import { useEffect, useState } from "react";

export default function GamificationPanel() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/gamification")
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) return <p>Loading XP...</p>;

  const percent = (data.xp / data.next_level_xp) * 100;

  return (
    <div style={{ marginTop: 20 }}>
      <h3>🎮 Level {data.level}</h3>

      <div
        style={{
          background: "#333",
          height: 12,
          borderRadius: 6,
          overflow: "hidden"
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            background: "#4CAF50",
            height: "100%"
          }}
        />
      </div>

      <p>{data.xp} / {data.next_level_xp} XP</p>
    </div>
  );
}
