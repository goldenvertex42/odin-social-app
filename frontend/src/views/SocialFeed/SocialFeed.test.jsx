import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SocialFeed from './SocialFeed';

// 1. Mock the API customFetch layer explicitly so AuthProvider can run its initial sync check safely
vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn(() => ({
    ok: true,
    json: async () => ({
      id: 'user-uuid-123',
      username: 'odin_champion',
      displayName: 'Odin Alpha',
      avatarUrl: 'https://cloudinary.com',
      email: 'odin@test.com'
    })
  }))
}));

// Re-import your project's genuine AuthProvider layer
import { AuthProvider } from '../../context/AuthContext/AuthContext';

// Mock PostCard to keep module tests decoupled
vi.mock('../../components/social/PostCard/PostCard', () => ({
  default: ({ post }) => <div data-testid="mock-post-card">{post.content}</div>,
}));

// Mock NewPostForm and simulate its return hook trigger sequence directly
vi.mock('../../components/social/NewPostForm/NewPostForm', () => ({
  default: ({ onPostCreated }) => (
    <div data-testid="mock-new-post-form">
      <button 
        data-testid="trigger-mock-create" 
        onClick={() => onPostCreated({ id: '3', content: 'Brand new composite post!', authorId: 'user-uuid-123' })}
      >
        Simulate Share Button Click
      </button>
    </div>
  ),
}));

const mockPosts = [
  { id: '1', content: 'First post content', authorId: 'user1', createdAt: '2026-06-23T12:00:00.000Z' },
  { id: '2', content: 'Second post content', authorId: 'user2', createdAt: '2026-06-23T11:00:00.000Z' },
];

describe('SocialFeed Context Layout Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'mock-valid-jwt');
  });

  it('renders loading states and maps database rows correctly', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockPosts,
    });

    // 2. Wrap component in BOTH genuine context layers to clear instantiation requirements
    render(
      <MemoryRouter>
        <AuthProvider>
          <SocialFeed />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('feed-loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId('feed-loading')).not.toBeInTheDocument();
    });

    const elements = screen.getAllByTestId('mock-post-card');
    expect(elements).toHaveLength(2);
    expect(elements[0]).toHaveTextContent('First post content');
  });

  it('inserts newly spawned leaf data nodes immediately atop index stacks', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockPosts,
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
