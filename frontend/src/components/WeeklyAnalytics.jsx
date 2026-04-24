import { useEffect, useState } from "react";
import { getToken } from "../utils/auth";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

export default function WeeklyAnalytics() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/analytics/weekly", {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        Accept: "application/json",
      },
    })
      .then((res) => res.json())
      .then(setActivities)
      .catch(console.error);
  }, []);

  if (!activities.length) return <p>No analytics data</p>;

  const labels = activities.map((a) => a.activity_date);

  const moodData = activities.map((a) => a.mood_level);
  const energyData = activities.map((a) => a.energy_level);

  const data = {
    labels,
    datasets: [
      {
        label: "Mood Trend",
        data: moodData,
        borderColor: "#4caf50",
        tension: 0.3,
      },
      {
        label: "Energy Trend",
        data: energyData,
        borderColor: "#2196f3",
        tension: 0.3,
      },
    ],
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>Weekly Analytics</h2>
      <Line data={data} />
    </div>
  );
}
