const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof process !== 'undefined' && process.env.NODE_ENV === 'test' ? 'http://localhost:3000' : '');

/**
 * Enhanced fetch wrapper to automate token injection, content parsing,
 * and dynamic local/production environmental route switching.
 */
export async function customFetch(endpoint, options = {}) {
  const fullUrl = endpoint.startsWith('/') ? `${API_BASE_URL}${endpoint}` : `${API_BASE_URL}/${endpoint}`;

  // 1. Automatically extract the active session JWT token parameter
  const token = localStorage.getItem('token');

  // 2. Safely initialize and merge incoming headers configuration properties
  const headers = new Headers(options.headers || {});

  // 3. Securely inject the Bearer signature required by Passport-JWT
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // 4. Intelligently format content flags unless processing multipart form-data (Cloudinary streams)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const updatedOptions = { ...options, headers };
  
  const response = await fetch(fullUrl, updatedOptions);
  
  // 5. HARD LOCK GUARD: Handle sudden token invalidations instantly to break infinite request loops
  if (response.status === 401) {
    localStorage.removeItem('token');
    // If running in a true browser context, force an immediate hard viewport flush back to /login
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login?error=session_expired';
    }
  }

  const text = await response.text();
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const parsedData = isJson && text ? JSON.parse(text) : null;

  // FIXED: Return the structured response contract directly so components can read status fields
  // natively, rather than crashing the virtual DOM with raw thrown exceptions.
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    json: async () => parsedData,
    text: async () => text
  };
}
