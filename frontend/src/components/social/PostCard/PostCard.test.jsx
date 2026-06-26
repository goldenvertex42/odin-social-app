import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import PostCard from './PostCard';

vi.mock('../../../utils/api/api', () => ({
  customFetch: vi.fn()
}));
import { customFetch } from '../../../utils/api/api';

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
    author: { displayName: 'Diana Prince', avatarUrl: 'https://cloudinary.com' },
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
    cleanup();
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
    render(
      <MemoryRouter>
        <PostCard post={mockPostData} currentUserId="user-uuid-abc" />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: /Unlike post/i });
    expect(button.className).toContain('activeLikedState');
    expect(button).toHaveTextContent(/Liked/i);
    expect(button).toHaveTextContent(/\(1\)/);
  });

  it('triggers the customFetch API engine when clicking the post level like toggle action button', async () => {
    const updatedLikesPayload = [
      { id: 'like-1', postId: 'post-uuid-99', userId: 'user-uuid-abc' },
      { id: 'like-2', postId: 'post-uuid-99', userId: 'user-uuid-xyz' }
    ];

    const robustMockPost = {
      id: 'post-uuid-99',
      content: 'Mock post content string data text asset',
      authorId: 'user-uuid-abc',
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
      author: { displayName: 'Odin Alpha', username: 'alpha_odin', avatarUrl: null }
    };

    vi.mocked(customFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => updatedLikesPayload
    });

    render(
      <MemoryRouter>
        <PostCard post={robustMockPost} currentUserId="user-uuid-xyz" />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: /Like post/i });
    expect(button).not.toBeDisabled();

    fireEvent.click(button);

    await waitFor(() => {
      expect(customFetch).toHaveBeenCalledTimes(1);
    });

    expect(customFetch).toHaveBeenCalledWith('/api/likes/post/post-uuid-99', { method: 'POST' });

    await waitFor(() => {
      expect(button).toHaveTextContent(/Like/i);
      expect(button).toHaveTextContent(/\(2\)/);
    });
  });

  it('renders a delete button and handles network actions when currentUserId matches the authorId', async () => {
    vi.mocked(customFetch).mockResolvedValueOnce({
      ok: true,
      status: 204,
      text: async () => ''
    });

    const deleteMockCallback = vi.fn();

    render(
      <MemoryRouter>
        <PostCard 
          post={mockPostData} 
          currentUserId="author-uuid-11"
          onDeleteSuccess={deleteMockCallback} 
        />
      </MemoryRouter>
    );

    const deleteBtn = screen.getByTestId('delete-post-btn');
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(customFetch).toHaveBeenCalledWith('/api/posts/post-uuid-99', { method: 'DELETE' });
      expect(deleteMockCallback).toHaveBeenCalledWith('post-uuid-99');
    });
  });
});
