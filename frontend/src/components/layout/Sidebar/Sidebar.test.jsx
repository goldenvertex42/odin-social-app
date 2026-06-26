import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router';
import Sidebar from './Sidebar';

// Import genuine app workspace context layers
import { AuthProvider } from '../../../context/AuthContext/AuthContext';

// Mock customFetch globally so AuthProvider passes its initial loading pass smoothly
vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn((url) => {
    if (url.includes('/api/auth/me')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ id: 'self-123', username: 'current_user' })
      });
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({})
    });
  })
}));

describe('Sidebar Component Module', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'mock-valid-jwt');

    render(
      <BrowserRouter>
        <AuthProvider>
          <Sidebar />
        </AuthProvider>
      </BrowserRouter>
    );
  });

  afterEach(() => {
    cleanup(); // Clear JSDOM memory tree completely
    vi.restoreAllMocks();
  });

  it('renders required system link targets correctly', () => {
    const feedLink = screen.getByRole('link', { name: /social feed/i });
    const exploreLink = screen.getByRole('link', { name: /discover users/i });

    expect(feedLink).toBeInTheDocument();
    expect(feedLink).toHaveAttribute('href', '/feed');
    expect(exploreLink).toBeInTheDocument();
    expect(exploreLink).toHaveAttribute('href', '/explore');
  });

  it('contains proper structural landmarks for non-visual screens', () => {
    expect(screen.getByRole('navigation', { name: /main application navigation/i })).toBeInTheDocument();
  });
});
