import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import PostCard from './PostCard';

// Mock custom fetch utility engine
vi.mock('../../../utils/api/api', () => ({
  customFetch: vi.fn()
}));

import { customFetch } from '../../../utils/api/api';

// Mock nested child thread component to cleanly isolate testing scope parameters
vi.mock('../CommentThread/CommentThread', () => ({
  default: () => <div data-testid="mock-comment-thread">Nested Comment Thread Canvas</div>
}));

describe('PostCard Feature Component Module', () => {
  const mockPostData = {
    id: 'post-uuid-99',
    content: 'This is an isolated core text string layout test.',
    imageUrl: 'https://cloudinary.com',
    authorId: 'author-uuid-11',
    createdAt: new Date().toISOString(),
    author: {
      displayName: 'Diana Prince',
      avatarUrl: 'https://cloudinary.com'
    },
    comments: [
      { id: 'comment-1', content: 'Cool post.' }
    ],
    likes: [
      { id: 'like-1', postId: 'post-uuid-99', userId: 'user-uuid-abc' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup(); // Completely purge the JSDOM context tree after each test block
  });

  it('renders author profile structures, content text strings, and layout shapes cleanly', () => {
    render(
      <MemoryRouter>
        <PostCard post={mockPostData} currentUserId="user-uuid-xyz" />
      </MemoryRouter>
    );

    expect(screen.getByText('Diana Prince')).toBeInTheDocument();
    expect(screen.getByText('This is an isolated core text string layout test.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /user published media asset/i })).toHaveAttribute('src', mockPostData.imageUrl);
    expect(screen.getByTestId('mock-comment-thread')).toBeInTheDocument();
  });

  it('applies explicit color styling states if the post is already liked by the active session user', () => {
    // Current user matches user inside the likes list
    render(
      <MemoryRouter>
        <PostCard post={mockPostData} currentUserId="user-uuid-abc" />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: /unlike post/i });
    expect(button.className).toContain('activeLikedState');
    expect(screen.getByText(/liked \(1\)/i)).toBeInTheDocument();
  });

  it('triggers the customFetch API engine when clicking the post level like toggle action button', async () => {
    const updatedLikesPayload = [
      { id: 'like-1', postId: 'post-uuid-99', userId: 'user-uuid-abc' },
      { id: 'like-2', postId: 'post-uuid-99', userId: 'user-uuid-xyz' }
    ];

    // 1. Force explicit data contracts on the post prop so likes array checks pass on load
    const robustMockPost = {
      id: 'post-uuid-99',
      content: 'Mock post content string data text asset',
      authorId: 'user-uuid-abc',
      createdAt: new Date().toISOString(),
      likes: [], // Explicit initial empty array so button is enabled
      comments: [],
      author: { displayName: 'Odin Alpha', username: 'alpha_odin', avatarUrl: null }
    };

    // 2. Explicitly spy on the direct module export to bypass import binding caching issues
    vi.mocked(customFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => updatedLikesPayload
    });

    render(
      <MemoryRouter>
        <PostCard post={robustMockPost} currentUserId="user-uuid-xyz" />
      </MemoryRouter>
    );

    // Find the button explicitly by role and trigger click
    const button = screen.getByRole('button', { name: /like post/i });
    expect(button).not.toBeDisabled(); // Double-check safety assertion
    
    fireEvent.click(button);

    await waitFor(() => {
      expect(customFetch).toHaveBeenCalledTimes(1);
    });
    
    expect(customFetch).toHaveBeenCalledWith('/api/likes/post/post-uuid-99', { method: 'POST' });

    // UI state recalculates values and updates live text content streams automatically
    const updatedLabel = await screen.findByText(/liked \(2\)/i);
    expect(updatedLabel).toBeInTheDocument();
  });
});
