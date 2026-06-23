import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import customFetch from '../../../utils/api/api';
import Comment from './Comment';

// Mock the custom fetch module
vi.mock('../../../utils/api/api', () => ({
  default: vi.fn()
}));

describe('Comment Feature Component Module', () => {
  const mockCommentData = {
    id: 'comment-uuid-456',
    content: 'This is a test comment message stream string.',
    authorId: 'user-uuid-999',
    createdAt: new Date().toISOString(),
    author: {
      displayName: 'Bruce Wayne',
      avatarUrl: 'https://cloudinary.com'
    },
    likes: [
      { id: 'like-1', commentId: 'comment-uuid-456', userId: 'user-uuid-111' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup(); // Clear the virtual JSDOM landscape cleanly
  });

  it('renders author metadata details and raw text body strings correctly', () => {
    render(
      <MemoryRouter>
        <Comment comment={mockCommentData} currentUserId="user-uuid-222" />
      </MemoryRouter>
    );

    expect(screen.getByText('Bruce Wayne')).toBeInTheDocument();
    expect(screen.getByText('This is a test comment message stream string.')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Verifies count visualization
  });

  it('highlights the active like style state when currentUserId matches a like item', () => {
    render(
      <MemoryRouter>
        <Comment comment={mockCommentData} currentUserId="user-uuid-111" />
      </MemoryRouter>
    );

    const likeBtn = screen.getByRole('button', { name: /unlike comment/i });
    expect(likeBtn.className).toContain('activeLikedState');
  });

  it('dispatches a network mutate task when clicking the toggle comment like action item', async () => {
    const updatedLikesPayload = [
      { id: 'like-1', commentId: 'comment-uuid-456', userId: 'user-uuid-111' },
      { id: 'like-2', commentId: 'comment-uuid-456', userId: 'user-uuid-222' }
    ];
    vi.mocked(customFetch).mockResolvedValueOnce(updatedLikesPayload);

    render(
      <MemoryRouter>
        <Comment comment={mockCommentData} currentUserId="user-uuid-222" />
      </MemoryRouter>
    );

    const likeBtn = screen.getByRole('button', { name: /like comment/i });
    fireEvent.click(likeBtn);

    expect(customFetch).toHaveBeenCalledTimes(1);
    expect(customFetch).toHaveBeenCalledWith('api/likes/comment/comment-uuid-456', { method: 'POST' });

    // UI recalculates structural arrays dynamically
    const updatedCounter = await screen.findByText('2');
    expect(updatedCounter).toBeInTheDocument();
  });
});
