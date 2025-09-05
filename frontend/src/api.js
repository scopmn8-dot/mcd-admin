// Central API base URL handling for production and development
const defaultBase = process.env.REACT_APP_API_BASE_URL || `${window.location.origin.replace(/\/$/, '')}`;

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  // If defaultBase already includes protocol, return absolute
  return `${defaultBase}${p}`;
}

export async function apiFetch(path, options = {}) {
  // Get the auth token from localStorage
  const token = localStorage.getItem('token');
  
  // Prepare headers with authentication if token exists
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Merge options with authentication headers
  const fetchOptions = {
    ...options,
    headers
  };
  
  try {
    const response = await fetch(apiUrl(path), fetchOptions);
    
    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      console.warn('🔒 Authentication failed - redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Trigger a page reload to reset authentication state
      window.location.reload();
      return response;
    }
    
    return response;
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}
