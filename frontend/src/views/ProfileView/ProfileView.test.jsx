import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileView from './ProfileView';

// 1. Mock customFetch globally so the context providers pass their initial loading tasks smoothly
vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn((url) => {
    // Satisfy initial AuthProvider background user synchronization verification loop
    if (url.includes('/api/auth/me')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ id: 'self-123', username: 'current_user' })
      });
    }
    // Handle Profile user details endpoint lookup parameters
    if (url.includes('/api/users/target-456')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: 'target-456',
          username: 'cyber_punker',
          displayName: 'Neon Sam',
          colorPalette: 'cyberpunk',
          colorScheme: 'dark',
          relationshipStatus: 'NOT_FOLLOWING'
        })
      });
    }
    // Handle timeline posts fetch operations fallback loop
    if (url.includes('/api/posts/user/target-456')) {
      return Promise.resolve({
        ok: true,
        json: async () => []
      });
    }
    // Safe fallback resolution instead of rejection to keep test environments silent during component tear-down re-renders
    return Promise.resolve({
      ok: true,
      json: async () => ({})
    });
  })
}));

// Import genuine app workspace context layers
import { AuthProvider } from '../../context/AuthContext/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext/ThemeContext';

// Stub out nested children elements to keep unit test scopes isolated and mirror the refactored delete parameter interface
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

  it('triggers local theme context override parameters when rendering target accounts', async () => {
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

    // Let the async loading states clear down completely to reveal the canvas wrapper
    await waitFor(() => {
      expect(screen.getByTestId('profile-view-canvas')).toBeInTheDocument();
    });

    // Check that the underlying profile details text has drawn to the canvas frame safely
    expect(screen.getByText('Neon Sam')).toBeInTheDocument();

    // Assert straight against the document element data-attributes!
    // This proves your ThemeProvider hook successfully read 'cyberpunk' from the view state.
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-color-palette')).toBe('cyberpunk');
    });
  });
});
