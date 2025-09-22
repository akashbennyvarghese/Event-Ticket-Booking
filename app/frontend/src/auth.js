export function saveToken(token) {
  localStorage.setItem("event_jwt", token);
}

export function loadToken() {
  return localStorage.getItem("event_jwt");
}

export function clearToken() {
  localStorage.removeItem("event_jwt");
}
