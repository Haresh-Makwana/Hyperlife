const TOKEN_KEY = "token";
const ROLE_KEY = "user_role"; 

/* 🔹 Get token safely & strip accidental quotes */
export const getToken = () => {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token || token === "null" || token === "undefined") {
    return null;
  }
  // 🚀 CRITICAL FIX: Removes invisible quotes that break the Laravel Bearer header
  return token.replace(/['"]+/g, '').trim(); 
};

/* 🔹 Save token safely */
export const setToken = (token) => {
  if (!token) {
    console.warn("⚠️ Attempted to save empty token");
    return;
  }
  // Sanitize before saving
  localStorage.setItem(TOKEN_KEY, token.replace(/['"]+/g, '').trim());
};

/* 🔹 User Role Management */
export const getRole = () => {
  return localStorage.getItem(ROLE_KEY) || "user";
};

export const setRole = (role) => {
  if (role) {
    localStorage.setItem(ROLE_KEY, String(role).trim().toLowerCase());
  }
};

/* 🔹 Remove token & role (Logout) */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
};

/* 🔹 Check login status */
export const isLoggedIn = () => {
  return getToken() !== null;
};

/* 🔹 Optional: Auth header helper */
export const authHeader = () => {
  const token = getToken();
  return token
    ? {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      }
    : {};
};