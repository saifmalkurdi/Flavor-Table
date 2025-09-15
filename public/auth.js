// ============== ESM helpers for auth ============================ //

const TOKEN_KEY = "jwt";

export function saveToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function logout() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

// ============== Returns { Authorization: 'Bearer <token>' } or {} ============================ //

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isLoggedIn() {
  return !!getToken();
}

export function ensureLoggedIn({ redirect = true } = {}) {
  if (!isLoggedIn()) {
    alert("Please log in first to use favorites.");
    if (redirect) window.location.href = "/auth.html";
    return false;
  }
  return true;
}
