import { getToken } from "./auth";

// 🏆 THE FIX IS HERE 🏆
// This tells React: "Use the Vercel variable if it exists. If not, use localhost."
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export const apiFetch = async (endpoint, options = {}) => {
  // ❌ Prevent passing full URLs
  if (endpoint.startsWith("http")) {
    throw new Error(
      "apiFetch expects a relative endpoint like '/universes', not a full URL"
    );
  }

  // ✅ Ensure endpoint starts with '/'
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  const token = getToken();

  const res = await fetch(`${API_URL}${normalizedEndpoint}`, {
    ...options,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Cache-Control": "no-cache", // Forces fresh data for the 3D Universe
      ...(token && { "Authorization": `Bearer ${token}` }),
      ...options.headers,
    },
  });

  // ✅ Handle empty responses (204)
  if (res.status === 204) {
    return null;
  }

  const data = await res.json();

  if (!res.ok) {
    throw data;
  }

  return data;
};