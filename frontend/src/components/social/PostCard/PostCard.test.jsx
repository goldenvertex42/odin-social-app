import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import customFetch from '../../../utils/api/api';
import PostCard from './PostCard';

// Mock custom fetch utility engine
vi.mock('../../../utils/api/api', () => ({
  default: vi.fn()
}));

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
    vi.mocked(customFetch).mockResolvedValueOnce(updatedLikesPayload);

    render(
      <MemoryRouter>
        <PostCard post={mockPostData} currentUserId="user-uuid-xyz" />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: /like post/i });
    fireEvent.click(button);

    expect(customFetch).toHaveBeenCalledTimes(1);
    expect(customFetch).toHaveBeenCalledWith('api/likes/post/post-uuid-99', { method: 'POST' });
    
    // UI state recalculates values and updates live text content streams automatically
    const updatedLabel = await screen.findByText(/liked \(2\)/i);
    expect(updatedLabel).toBeInTheDocument();
  });
});
