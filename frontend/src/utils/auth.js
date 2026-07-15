// 🔒 THE SHIELD: Cryptic Obfuscation. 
// Malicious scripts scrape for "token" or "role". We hide these in plain sight.
const TOKEN_KEY = "_hl_os_sys_core_v1_";
const ROLE_KEY = "_hl_os_clearance_lvl_"; 

// 🔒 THE SHIELD: RAM Cache. 
// Holds the token in isolated memory so we don't expose local storage reads continuously.
let memoryToken = null;
let memoryRole = null;

/* 🔹 Get token safely & strip accidental quotes */
export const getToken = () => {
  if (memoryToken) return memoryToken; // Fastest and safest route

  let token = localStorage.getItem(TOKEN_KEY);
  if (!token || token === "null" || token === "undefined") {
    return null;
  }
  
  // Clean and load into RAM
  memoryToken = token.replace(/['"]+/g, '').trim(); 
  return memoryToken;
};

/* 🔹 Save token safely */
export const setToken = (token) => {
  if (!token) {
    console.warn("⚠️ System Error: Null encryption key rejected.");
    return;
  }
  
  const cleanToken = token.replace(/['"]+/g, '').trim();
  memoryToken = cleanToken; // Save to RAM
  localStorage.setItem(TOKEN_KEY, cleanToken);
};

/* 🔹 User Role Management */
export const getRole = () => {
  if (memoryRole) return memoryRole;

  const role = localStorage.getItem(ROLE_KEY) || "operator";
  memoryRole = role;
  return memoryRole;
};

export const setRole = (role) => {
  if (role) {
    const cleanRole = String(role).trim().toLowerCase();
    memoryRole = cleanRole;
    localStorage.setItem(ROLE_KEY, cleanRole);
  }
};

/* 🔹 Remove token & role (Logout Protocol) */
export const removeToken = () => {
  memoryToken = null;
  memoryRole = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
};

/* 🔹 Check login status */
export const isLoggedIn = () => {
  return getToken() !== null;
};

/* 🔹 Auth header helper for API requests */
export const authHeader = () => {
  const token = getToken();
  return token
    ? {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      }
    : {};
};