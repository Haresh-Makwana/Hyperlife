import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ActivityChart({ data }) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <h3>Mood & Energy Trend</h3>

      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="activity_date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="mood_level" stroke="#8884d8" />
          <Line type="monotone" dataKey="energy_level" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
