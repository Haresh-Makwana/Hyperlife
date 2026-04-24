import { useEffect, useState } from "react";
import { getToken } from "../utils/auth";
import { useNavigate, useParams } from "react-router-dom";

export default function EditActivity() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    energy_level: 5,
    mood_level: 5,
    activity_date: "",
  });

  const [error, setError] = useState("");

  // Load activity data
  useEffect(() => {
    const loadActivity = async () => {
      const res = await fetch(`http://127.0.0.1:8000/api/activities/${id}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          Accept: "application/json",
        },
      });

      const data = await res.json();
      setForm(data);
    };

    loadActivity();
  }, [id]);

  // Update activity
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/activities/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
          Accept: "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Update failed");

      navigate("/dashboard");
    } catch (err) {
      setError("Failed to update activity");
    }
  };

  return (
    <div>
      <h2>Edit Activity</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />

        <textarea
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />

        <input
          type="number"
          min="1"
          max="10"
          value={form.energy_level}
          onChange={(e) =>
            setForm({ ...form, energy_level: e.target.value })
          }
        />

        <input
          type="number"
          min="1"
          max="10"
          value={form.mood_level}
          onChange={(e) =>
            setForm({ ...form, mood_level: e.target.value })
          }
        />

        <input
          type="date"
          value={form.activity_date}
          onChange={(e) =>
            setForm({ ...form, activity_date: e.target.value })
          }
        />

        <button type="submit">Update Activity</button>
      </form>
    </div>
  );
}
