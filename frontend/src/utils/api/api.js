const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof process !== 'undefined' && process.env.NODE_ENV === 'test' ? 'http://localhost:3000' : '');

/**
 * Enhanced fetch wrapper to automate token injection, content parsing,
 * and dynamic local/production environmental route switching.
 */
export async function customFetch(endpoint, options = {}) {
  const fullUrl = endpoint.startsWith('/') ? `${API_BASE_URL}${endpoint}` : `${API_BASE_URL}/${endpoint}`;
  
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const updatedOptions = { ...options, headers };
  const response = await fetch(fullUrl, updatedOptions);

  if (response.status === 401) {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
    }
    if (typeof window !== 'undefined' && window.location && !window.location.pathname.includes('/login')) {
      window.location.href = '/login?error=session_expired';
    }
  }

  let localizedResponse;

  if (response.status === 204 || response.status === 205) {
    localizedResponse = new Response(null, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });

    Object.defineProperties(localizedResponse, {
      ok: { value: response.ok, enumerable: true },
      json: { value: async () => null, enumerable: true, configurable: true },
      text: { value: async () => '', enumerable: true, configurable: true }
    });
  } else {
    const rawText = await response.text();
    
    localizedResponse = new Response(rawText, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });

    Object.defineProperties(localizedResponse, {
      ok: { value: response.ok, enumerable: true },
      json: { value: async () => (rawText ? JSON.parse(rawText) : null), enumerable: true, configurable: true },
      text: { value: async () => rawText, enumerable: true, configurable: true }
    });
  }

  return localizedResponse;
}
