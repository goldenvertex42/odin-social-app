import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileView from './ProfileView';

vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn((url) => {
    if (url.includes('/api/auth/me')) {
      return Promise.resolve({ ok: true, json: async () => ({ id: 'self-123', username: 'current_user' }) });
    }
    if (url.includes('/api/users/target-456')) {
      return Promise.resolve({ ok: true, json: async () => ({ id: 'target-456', username: 'cyber_punker', displayName: 'Neon Sam', colorPalette: 'cyberpunk', colorScheme: 'dark', relationshipStatus: 'NOT_FOLLOWING' }) });
    }
    if (url.includes('/api/posts/user/target-456')) {
      return Promise.resolve({ ok: true, json: async () => [] });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  })
}));

import { AuthProvider } from '../../context/AuthContext/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext/ThemeContext';

vi.mock('../../components/social/PostCard/PostCard', () => ({
  default: ({ post, onDeleteSuccess }) => (
    <div data-testid="mock-post" data-delete-hook={typeof onDeleteSuccess === 'function'}>
      {post?.content}
    </div>
  )
}));

describe('ProfileView System Context Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'mock-valid-jwt');
    document.documentElement.removeAttribute('data-color-palette');
    document.documentElement.removeAttribute('data-color-scheme');
  });

  it('triggers local theme context override parameters when rendering target accounts and satisfies main landmarks', async () => {
    render(
      <MemoryRouter initialEntries={['/users/target-456']}>
        <AuthProvider>
          <ThemeProvider>
            <Routes>
              <Route path="/users/:id" element={<ProfileView />} />
            </Routes>
          </ThemeProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile-view-canvas')).toBeInTheDocument();
    });

    const mainViewContainer = screen.getByRole('main');
    expect(mainViewContainer).toBeInTheDocument();
    expect(screen.getByTestId('profile-view-canvas')).toBe(mainViewContainer);

    expect(screen.getByRole('heading', { level: 1, name: /neon sam's member profile hub/i })).toBeInTheDocument();

    expect(screen.getByText('Neon Sam')).toBeInTheDocument();

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-color-palette')).toBe('cyberpunk');
    });
  });
});
