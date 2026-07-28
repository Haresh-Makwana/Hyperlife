import axios from "axios";

// 🚀 CENTRALIZED API URL: Dynamically adapts to local dev or Vercel cloud
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://hyperlife-backend.onrender.com";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`, 
  withCredentials: true,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    "Accept": "application/json",
  }
});

// 1. Sanctum CSRF Protection
// Must be called before login or POST/PUT requests
export const getCsrfToken = () => {
    return axios.get(`${API_BASE_URL}/sanctum/csrf-cookie`, { withCredentials: true });
};

// 2. Universe Data Endpoints
// Fetches the collection of universes defined in your migrations
export const getUniverses = () => api.get("/universes");

// Fetches specific planets linked to a universe ID
export const getPlanets = (universeId) => api.get(`/universes/${universeId}/planets`);

// 3. User Progress & Interactions
// Updates planet-specific progress (like XP or streaks)
export const updatePlanetProgress = (planetId, data) => api.put(`/planets/${planetId}/progress`, data);

export default api;