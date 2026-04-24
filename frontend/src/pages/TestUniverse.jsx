import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

export default function TestUniverse() {
  const [universes, setUniverses] = useState([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    size: "",
    position_x: "",
    position_y: "",
    position_z: "",
  });

  // Fetch universes
  const fetchUniverses = async () => {
    try {
      const data = await apiFetch("/universes");
      setUniverses(data.universes || []);
    } catch {
      setMessage("Failed to load universes");
    }
  };

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Create universe
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await apiFetch("/universes", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setForm({
        name: "",
        description: "",
        size: "",
        position_x: "",
        position_y: "",
        position_z: "",
      });

      fetchUniverses();
      setMessage("Universe created successfully");
    } catch (err) {
      setMessage(err.message || "Creation failed");
    }
  };

  useEffect(() => {
    fetchUniverses();
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: "auto" }}>
      <h1>Universe Management</h1>

      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Universe Name" value={form.name} onChange={handleChange} required />
        <input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
        <input type="number" name="size" placeholder="Size" value={form.size} onChange={handleChange} required />
        <input type="number" name="position_x" placeholder="Position X" value={form.position_x} onChange={handleChange} />
        <input type="number" name="position_y" placeholder="Position Y" value={form.position_y} onChange={handleChange} />
        <input type="number" name="position_z" placeholder="Position Z" value={form.position_z} onChange={handleChange} />
        <button type="submit">Create Universe</button>
      </form>

      {message && <p>{message}</p>}

      <hr />

      <h2>Universes</h2>
      {universes.length === 0 ? (
        <p>No universes found</p>
      ) : (
        <ul>
          {universes.map((u) => (
            <li key={u.id}>
              <strong>{u.name}</strong> — Size: {u.size} <br />
              Position: ({u.position_x}, {u.position_y}, {u.position_z})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
