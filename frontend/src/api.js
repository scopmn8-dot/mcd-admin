// Central API base URL handling for production and development
const defaultBase = process.env.REACT_APP_API_BASE_URL || `${window.location.origin.replace(/\/$/, '')}`;

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  // If defaultBase already includes protocol, return absolute
  return `${defaultBase}${p}`;
}

export async function apiFetch(path, options) {
  return fetch(apiUrl(path), options);
}
