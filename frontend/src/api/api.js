import axios from "axios";

const api = axios.create({
  // Using the standard Laravel development URL from your .env
  baseURL: "http://127.0.0.1:8000/api", 
  withCredentials: true,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    "Accept": "application/json",
  }
});

// 1. Sanctum CSRF Protection
// Must be called before login or POST/PUT requests
export const getCsrfToken = () => {
    // Note: Sanctum routes usually sit outside the /api prefix
    return axios.get("http://127.0.0.1:8000/sanctum/csrf-cookie", { withCredentials: true });
};

// 2. Universe Data Endpoints
// Fetches the collection of universes defined in your migrations [cite: 12]
export const getUniverses = () => api.get("/universes");

// Fetches specific planets linked to a universe ID [cite: 12, 13]
export const getPlanets = (universeId) => api.get(`/universes/${universeId}/planets`);

// 3. User Progress & Interactions
// Updates planet-specific progress (like XP or streaks) [cite: 12]
export const updatePlanetProgress = (planetId, data) => api.put(`/planets/${planetId}/progress`, data);

export default api;