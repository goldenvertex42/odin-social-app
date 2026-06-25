import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PostView from './PostView';

// 1. Centralized network routing mock to satisfy initial auth sync loops and post requests
vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn((url) => {
    // Satisfy initial AuthProvider background synchronization verification loop
    if (url.includes('/api/auth/me')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ id: 'user-123', username: 'odin_champion' })
      });
    }
    // Handle standard standalone post thread queries
    if (url.includes('/api/posts/post-uuid-abc')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: 'post-uuid-abc',
          content: 'Deep-linked thread content display canvas text',
          authorId: 'user-789',
          likes: [],
          comments: []
        })
      });
    }
    // Handle 404 resource omissions explicitly
    if (url.includes('/api/posts/missing-id')) {
      return Promise.resolve({
        ok: false,
        status: 404
      });
    }
    return Promise.reject(new Error(`Unhandled URL path: ${url}`));
  })
}));

// Import genuine app context layers
import { AuthProvider } from '../../context/AuthContext/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext/ThemeContext';
import { customFetch } from '../../utils/api/api';

// Stub out PostCard children elements to isolate page structure test parameters
vi.mock('../../components/social/PostCard/PostCard', () => ({
  default: ({ post }) => <div data-testid="mock-post-card">{post.content}</div>
}));

describe('PostView Integration Layout View Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'mock-valid-jwt');
  });

  it('renders loading indicators and securely pulls individual deep-linked records', async () => {
    render(
      <MemoryRouter initialEntries={['/posts/post-uuid-abc']}>
        <AuthProvider>
          <ThemeProvider>
            <Routes>
              <Route path="/posts/:postId" element={<PostView />} />
            </Routes>
          </ThemeProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Verify initial layout entry state is visible
    expect(screen.getByTestId('post-view-loading')).toBeInTheDocument();

    // Wait safely for internal asynchronous hooks to complete rendering operations
    await waitFor(() => {
      expect(screen.queryByTestId('post-view-loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('post-view-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('mock-post-card')).toHaveTextContent('Deep-linked thread content display canvas text');
    expect(customFetch).toHaveBeenCalledWith('/api/posts/post-uuid-abc');
  });

  it('handles 404 resource omissions by displaying explicit fallback directions', async () => {
    render(
      <MemoryRouter initialEntries={['/posts/missing-id']}>
        <AuthProvider>
          <ThemeProvider>
            <Routes>
              <Route path="/posts/:postId" element={<PostView />} />
            </Routes>
          </ThemeProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('post-view-error')).toBeInTheDocument();
    });

    expect(screen.getByText('The requested post could not be found.')).toBeInTheDocument();
  });
});
