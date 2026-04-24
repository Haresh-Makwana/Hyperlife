import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

export default function TestPlanet() {
  const [universes, setUniverses] = useState([]);
  const [universeId, setUniverseId] = useState("");
  const [planets, setPlanets] = useState([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    type: "",
    size: "",
    position_x: "",
    position_y: "",
    position_z: "",
  });

  /* =========================
     LOAD UNIVERSES
  ========================= */
  useEffect(() => {
    apiFetch("/universes")
      .then((data) => {
        setUniverses(data.universes || []);
      })
      .catch(() => {
        setMessage("Failed to load universes");
      });
  }, []);

  /* =========================
     LOAD PLANETS BY UNIVERSE
  ========================= */
  const loadPlanets = async (uid) => {
    try {
      const data = await apiFetch(`/universes/${uid}/planets`);
      setPlanets(data.planets || []);
    } catch {
      setPlanets([]);
      setMessage("Failed to load planets");
    }
  };

  useEffect(() => {
    if (!universeId) {
      setPlanets([]);
      return;
    }

    loadPlanets(universeId);
  }, [universeId]);

  /* =========================
     CREATE PLANET
  ========================= */
  const createPlanet = async () => {
    setMessage("");

    if (!universeId || !form.name || !form.size) {
      setMessage("Universe, Name and Size are required");
      return;
    }

    try {
      const payload = {
        universe_id: Number(universeId),
        name: form.name,
        type: form.type || "Generic",
        size: Number(form.size),
        position_x: Number(form.position_x || 0),
        position_y: Number(form.position_y || 0),
        position_z: Number(form.position_z || 0),
      };

      await apiFetch("/planets", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setMessage("Planet created successfully");

      setForm({
        name: "",
        type: "",
        size: "",
        position_x: "",
        position_y: "",
        position_z: "",
      });

      // 🔑 RELOAD FROM BACKEND (SOURCE OF TRUTH)
      loadPlanets(universeId);
    } catch (err) {
      setMessage(err.message || "Planet creation failed");
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <div style={{ maxWidth: 600, margin: "auto" }}>
      <h1>Planet Test Page</h1>

      <select value={universeId} onChange={(e) => setUniverseId(e.target.value)}>
        <option value="">Select Universe</option>
        {universes.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>

      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <input
        placeholder="Type"
        value={form.type}
        onChange={(e) => setForm({ ...form, type: e.target.value })}
      />

      <input
        type="number"
        placeholder="Size"
        value={form.size}
        onChange={(e) => setForm({ ...form, size: e.target.value })}
      />

      <input
        type="number"
        placeholder="X"
        value={form.position_x}
        onChange={(e) => setForm({ ...form, position_x: e.target.value })}
      />

      <input
        type="number"
        placeholder="Y"
        value={form.position_y}
        onChange={(e) => setForm({ ...form, position_y: e.target.value })}
      />

      <input
        type="number"
        placeholder="Z"
        value={form.position_z}
        onChange={(e) => setForm({ ...form, position_z: e.target.value })}
      />

      <button onClick={createPlanet}>Create Planet</button>

      {message && <p>{message}</p>}

      <h2>Planets</h2>

      {planets.length === 0 ? (
        <p>No planets found</p>
      ) : (
        planets.map((p) => <div key={p.id}>{p.name}</div>)
      )}
    </div>
  );
}
