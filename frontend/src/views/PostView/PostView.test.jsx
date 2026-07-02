import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PostView from './PostView';

vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn((url) => {
    if (url.includes('/api/auth/me')) {
      return Promise.resolve({ ok: true, json: async () => ({ id: 'user-123', username: 'odin_champion' }) });
    }
    if (url.includes('/api/posts/post-uuid-abc')) {
      return Promise.resolve({ ok: true, json: async () => ({ id: 'post-uuid-abc', content: 'Deep-linked thread content display canvas text', authorId: 'user-789', likes: [], comments: [] }) });
    }
    if (url.includes('/api/posts/missing-id')) {
      return Promise.resolve({ ok: false, status: 404 });
    }
    return Promise.reject(new Error(`Unhandled URL path: ${url}`));
  })
}));

import { AuthProvider } from '../../context/AuthContext/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext/ThemeContext';
import { customFetch } from '../../utils/api/api';

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

    const initialLoadingText = screen.getByRole('status');
    expect(initialLoadingText).toBeInTheDocument();
    expect(initialLoadingText).toHaveTextContent(/loading post thread/i);
    expect(screen.getByTestId('post-view-loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId('post-view-loading')).not.toBeInTheDocument();
    });

    const mainViewContainer = screen.getByRole('main');
    expect(mainViewContainer).toBeInTheDocument();
    expect(screen.getByTestId('post-view-canvas')).toBe(mainViewContainer);
    
    expect(screen.getByRole('heading', { level: 1, name: /post discussion thread view/i })).toBeInTheDocument();

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

    const mainViewContainer = screen.getByRole('main');
    expect(mainViewContainer).toBeInTheDocument();

    const alertMessage = screen.getByRole('alert');
    expect(alertMessage).toBeInTheDocument();
    expect(alertMessage).toHaveTextContent('The requested post could not be found.');
  });
});
