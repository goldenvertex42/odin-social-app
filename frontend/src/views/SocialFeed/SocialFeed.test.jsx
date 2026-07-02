import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SocialFeed from './SocialFeed';

vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn()
}));
import { customFetch } from '../../utils/api/api';
import { AuthProvider } from '../../context/AuthContext/AuthContext';

const mockPosts = [
  {
    id: '1',
    content: 'Building the social media frontend cluster matrix.',
    createdAt: new Date().toISOString(),
    author: { id: 'user-789', username: 'dev_diana', displayName: 'Diana Prince', avatarUrl: null },
    comments: [],
    likes: []
  },
  {
    id: '2',
    content: 'Securing full-stack data models with strict WCAG contrast constraints.',
    createdAt: new Date().toISOString(),
    author: { id: 'user-456', username: 'bruce_ux', displayName: 'Bruce Wayne', avatarUrl: null },
    comments: [],
    likes: []
  }
];

vi.mock('../../components/social/PostCard/PostCard', () => ({
  default: ({ post }) => <div data-testid="mock-post-card">{post.content}</div>,
}));

vi.mock('../../components/social/NewPostForm/NewPostForm', () => ({
  default: ({ onPostCreated }) => (
    <div data-testid="mock-new-post-form">
      <button 
        data-testid="trigger-mock-create" 
        onClick={() => onPostCreated({ post: { id: '3', content: 'Brand new composite post!', authorId: 'user-uuid-123' } })}
      >
        Simulate Share Button Click
      </button>
    </div>
  ),
}));

describe('SocialFeed Context Layout Integration Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'mock-valid-jwt');

    vi.mocked(customFetch).mockImplementation((url) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: async () => ({ id: 'user-uuid-123', username: 'odin_champion', displayName: 'Odin Alpha', avatarUrl: 'https://cloudinary.com', email: 'odin@test.com' }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });
  });

  it('renders loading states, semantic main landmark wrappers, and maps database rows correctly', async () => {
    vi.mocked(customFetch).mockImplementation((url) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: async () => ({ id: 'user-uuid-123', username: 'odin_champion' }) });
      }
      if (url.includes('/api/posts/feed')) {
        return Promise.resolve({ ok: true, json: async () => mockPosts });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SocialFeed />
        </AuthProvider>
      </MemoryRouter>
    );

    const loadingAnnouncement = screen.getByRole('status');
    expect(loadingAnnouncement).toBeInTheDocument();
    expect(loadingAnnouncement).toHaveTextContent(/loading your feed/i);
    expect(screen.getByTestId('feed-loading')).toBe(loadingAnnouncement);

    await waitFor(() => {
      expect(screen.queryByTestId('feed-loading')).not.toBeInTheDocument();
    });

    const mainFeedContainer = screen.getByRole('main');
    expect(mainFeedContainer).toBeInTheDocument();
    expect(screen.getByTestId('feed-canvas')).toBe(mainFeedContainer);
    
    expect(screen.getByRole('heading', { level: 1, name: /chronological social dashboard feed/i })).toBeInTheDocument();

    const elements = screen.getAllByTestId('mock-post-card');
    expect(elements).toHaveLength(2);
    expect(elements[0]).toHaveTextContent(/Building the social media frontend/i);
  });

  it('inserts newly spawned leaf data nodes immediately atop index stacks', async () => {
    vi.mocked(customFetch).mockImplementation((url) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: async () => ({ id: 'user-uuid-123', username: 'odin_champion' }) });
      }
      if (url.includes('/api/posts/feed')) {
        return Promise.resolve({ ok: true, json: async () => mockPosts });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SocialFeed />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('mock-post-card')).toHaveLength(2);
    });

    const mockSubmitAction = screen.getByTestId('trigger-mock-create');
    fireEvent.click(mockSubmitAction);

    const currentCards = screen.getAllByTestId('mock-post-card');
    expect(currentCards).toHaveLength(3);
    
    expect(currentCards[0]).toHaveTextContent('Brand new composite post!');
  });
});
