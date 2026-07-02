import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router';
import Sidebar from './Sidebar';
import { AuthProvider } from '../../../context/AuthContext/AuthContext';

vi.mock('../../../utils/api/api', () => ({
  customFetch: vi.fn((url) => {
    if (url.includes('/api/auth/me')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ id: 'self-123', username: 'current_user' })
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  })
}));

describe('Sidebar Component Module', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders required system link targets correctly', async () => {
    localStorage.setItem('token', 'mock-valid-jwt');
    
    render(
      <MemoryRouter initialEntries={['/feed']}>
        <AuthProvider>
          <Sidebar />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      const feedLink = screen.getByRole('link', { name: /social feed/i });
      expect(feedLink).toBeInTheDocument();
      expect(feedLink).toHaveAttribute('href', '/feed');
    });

    const exploreLink = screen.getByRole('link', { name: /discover users/i });
    expect(exploreLink).toBeInTheDocument();
    expect(exploreLink).toHaveAttribute('href', '/explore');
  });

  it('contains proper structural landmarks for non-visual screens', async () => {
    localStorage.setItem('token', 'mock-valid-jwt');

    render(
      <MemoryRouter initialEntries={['/feed']}>
        <AuthProvider>
          <Sidebar />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: /main application navigation/i })).toBeInTheDocument();
    });
  });

  it('🌟 programmatically applies aria-current="page" to the active route link entry', async () => {
    localStorage.setItem('token', 'mock-valid-jwt');

    render(
      <MemoryRouter initialEntries={['/explore']}>
        <AuthProvider>
          <Sidebar />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      const exploreLink = screen.getByRole('link', { name: /discover users/i });
      const feedLink = screen.getByRole('link', { name: /social feed/i });
      expect(exploreLink).toHaveAttribute('aria-current', 'page');
      expect(feedLink).not.toHaveAttribute('aria-current');
    });
  });
});
