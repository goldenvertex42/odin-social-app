import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('api.js customFetch Wrapper Suite', () => {
  const BASE_URL = 'http://localhost:3000';

  const createMockResponse = (ok, status, statusText, textPayload, contentType = 'application/json') => {
    const headersMap = new Map();
    if (contentType) headersMap.set('content-type', contentType);
    return {
      ok,
      status,
      statusText,
      headers: { get: (key) => headersMap.get(key.toLowerCase()) },
      text: async () => textPayload
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.resetModules();
    
    import.meta.env.VITE_API_URL = BASE_URL;
    vi.spyOn(globalThis, 'fetch');

    if (typeof window !== 'undefined') {
      vi.spyOn(window, 'location', 'get').mockReturnValue({
        pathname: '/feed',
        href: ''
      });
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    import.meta.env.VITE_API_URL = '';
  });

  it('should prepend the VITE_API_URL to endpoints starting with a slash cleanly', async () => {
    globalThis.fetch.mockResolvedValueOnce(
      createMockResponse(true, 200, 'OK', JSON.stringify({ success: true }))
    );
    const { customFetch } = await import('./api');
    await customFetch('/api/posts/feed');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/posts/feed',
      expect.any(Object)
    );
  });

  it('should insert a separating slash fallback if the endpoint misses a slash prefix', async () => {
    globalThis.fetch.mockResolvedValueOnce(
      createMockResponse(true, 200, 'OK', JSON.stringify({ success: true }))
    );
    const { customFetch } = await import('./api');
    await customFetch('api/posts/feed');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/posts/feed',
      expect.any(Object)
    );
  });

  it('should automatically append JSON headers if passing an object payload body', async () => {
    globalThis.fetch.mockResolvedValueOnce(
      createMockResponse(true, 200, 'OK', JSON.stringify({ success: true }))
    );
    const { customFetch } = await import('./api');
    await customFetch('/api/posts', { 
      method: 'POST', 
      body: JSON.stringify({ content: 'Publishing standard text layout.' }) 
    });
    
    const calledOptions = vi.mocked(globalThis.fetch).mock.calls[0][1];
    expect(calledOptions.headers.get('Content-Type')).toBe('application/json');
  });

  it('should skip appending Content-Type headers if the transmission body is a FormData binary object', async () => {
    globalThis.fetch.mockResolvedValueOnce(
      createMockResponse(true, 200, 'OK', JSON.stringify({ success: true }))
    );
    const mockFormData = new FormData();
    const { customFetch } = await import('./api');
    await customFetch('/api/posts', { method: 'POST', body: mockFormData });
    
    const calledOptions = vi.mocked(globalThis.fetch).mock.calls[0][1];
    expect(calledOptions.headers.get('Content-Type')).toBeNull();
  });

  it('should automatically inject Bearer session authorization tokens when stored locally', async () => {
    localStorage.setItem('token', 'jwt-secret-payload-token-string');
    globalThis.fetch.mockResolvedValueOnce(
      createMockResponse(true, 200, 'OK', JSON.stringify({ success: true }))
    );
    const { customFetch } = await import('./api');
    await customFetch('/api/auth/me');
    
    const calledOptions = vi.mocked(globalThis.fetch).mock.calls[0][1];
    expect(calledOptions.headers.get('Authorization')).toBe('Bearer jwt-secret-payload-token-string');
  });

  it('should parse the network payload text body and serve responsive json/text tracking methods on success', async () => {
    const jsonString = JSON.stringify({ success: true, count: 42 });
    globalThis.fetch.mockResolvedValueOnce(
      createMockResponse(true, 200, 'OK', jsonString)
    );
    const { customFetch } = await import('./api');
    const result = await customFetch('/api/users');
    
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    
    const jsonData = await result.json();
    const textData = await result.text();
    expect(jsonData).toEqual({ success: true, count: 42 });
    expect(textData).toBe(jsonString);
  });

  it('should return ok: false contract envelopes instead of throwing raw exceptions during validation errors', async () => {
    const errorPayload = JSON.stringify({ message: 'Email or Username already taken.' });
    globalThis.fetch.mockResolvedValueOnce(
      createMockResponse(false, 400, 'Bad Request', errorPayload)
    );
    const { customFetch } = await import('./api');
    
    const result = await customFetch('/api/auth/register');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    
    const errData = await result.json();
    expect(errData.message).toBe('Email or Username already taken.');
  });

  it('should automatically purge tokens from local storage and trigger a hard viewport exit upon catching a 401 status code', async () => {
    localStorage.setItem('token', 'expired-or-poisoned-session-key');
    const authErrorPayload = JSON.stringify({ message: 'jwt expired' });
    
    globalThis.fetch.mockResolvedValueOnce(
      createMockResponse(false, 401, 'Unauthorized', authErrorPayload)
    );
    const { customFetch } = await import('./api');
    
    const result = await customFetch('/api/auth/me');
    
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
    expect(localStorage.getItem('token')).toBeNull();
    
    expect(window.location.pathname).toBe('/feed');
  });
});
