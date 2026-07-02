import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import Comment from './Comment';

vi.mock('../../../utils/api/api', () => ({
  customFetch: vi.fn()
}));
import { customFetch } from '../../../utils/api/api';

describe('Comment Feature Component Module', () => {
  const mockCommentData = {
    id: 'comment-uuid-456',
    content: 'This is a test comment message stream string.',
    authorId: 'user-uuid-999',
    createdAt: new Date().toISOString(),
    author: { displayName: 'Bruce Wayne', avatarUrl: 'https://cloudinary.com' },
    likes: [
      { id: 'like-1', commentId: 'comment-uuid-456', userId: 'user-uuid-111' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders author metadata details and raw text body strings correctly', () => {
    render(
      <MemoryRouter>
        <Comment comment={mockCommentData} currentUserId="user-uuid-222" postOwnerId="post-owner-id" />
      </MemoryRouter>
    );
    expect(screen.getByText('Bruce Wayne')).toBeInTheDocument();
    expect(screen.getByText('This is a test comment message stream string.')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    
    const avatar = screen.getByTestId('comment-user-avatar');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://cloudinary.com');
  });

  it('highlights the active like style state when currentUserId matches a like item within actions', () => {
    render(
      <MemoryRouter>
        <Comment comment={mockCommentData} currentUserId="user-uuid-111" postOwnerId="post-owner-id" />
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
    vi.mocked(customFetch).mockResolvedValueOnce({ ok: true, json: async () => updatedLikesPayload });

    render(
      <MemoryRouter>
        <Comment comment={mockCommentData} currentUserId="user-uuid-222" postOwnerId="post-owner-id" />
      </MemoryRouter>
    );

    const likeBtn = screen.getByRole('button', { name: /like comment/i });
    fireEvent.click(likeBtn);

    await waitFor(() => {
      expect(customFetch).toHaveBeenCalledTimes(1);
    });
    expect(customFetch).toHaveBeenCalledWith('/api/likes/comment/comment-uuid-456', { method: 'POST' });

    const updatedCounter = await screen.findByText('2');
    expect(updatedCounter).toBeInTheDocument();
  });

  it('renders a delete button and handles network actions after stepping through the inline confirmation guardrail', async () => {
    vi.mocked(customFetch).mockResolvedValueOnce({ ok: true, status: 204, text: async () => '' });
    const deleteMockCallback = vi.fn();

    render(
      <MemoryRouter>
        <Comment 
          comment={mockCommentData} 
          currentUserId="user-uuid-999" 
          postOwnerId="post-owner-id" 
          onDeleteSuccess={deleteMockCallback} 
        />
      </MemoryRouter>
    );

    const deleteBtn = screen.getByTestId('delete-comment-btn');
    expect(deleteBtn).toBeInTheDocument();
    
    fireEvent.click(deleteBtn);
    
    const inlineGroup = screen.getByRole('group', { name: /confirm comment deletion/i });
    expect(inlineGroup).toBeInTheDocument();

    const confirmActionBtn = screen.getByRole('button', { name: /^yes$/i });
    fireEvent.click(confirmActionBtn);

    await waitFor(() => {
      expect(customFetch).toHaveBeenCalledWith('/api/comments/comment-uuid-456', { method: 'DELETE' });
      expect(deleteMockCallback).toHaveBeenCalledWith('comment-uuid-456');
    });
  });

  it('renders a delete button and handles moderation paths after stepping through the inline confirmation guardrail', async () => {
    vi.mocked(customFetch).mockResolvedValueOnce({ ok: true, status: 204, text: async () => '' });
    const deleteMockCallback = vi.fn();

    render(
      <MemoryRouter>
        <Comment 
          comment={mockCommentData} 
          currentUserId="post-owner-id" 
          postOwnerId="post-owner-id" 
          onDeleteSuccess={deleteMockCallback} 
        />
      </MemoryRouter>
    );

    const deleteBtn = screen.getByTestId('delete-comment-btn');
    expect(deleteBtn).toBeInTheDocument();
    
    fireEvent.click(deleteBtn);

    const confirmActionBtn = screen.getByRole('button', { name: /^yes$/i });
    fireEvent.click(confirmActionBtn);

    await waitFor(() => {
      expect(customFetch).toHaveBeenCalledWith('/api/comments/comment-uuid-456', { method: 'DELETE' });
      expect(deleteMockCallback).toHaveBeenCalledWith('comment-uuid-456');
    });
  });

  it('hides the delete button when currentUserId matches neither comment author nor post owner', () => {
    render(
      <MemoryRouter>
        <Comment comment={mockCommentData} currentUserId="user-uuid-stranger" postOwnerId="post-owner-id" />
      </MemoryRouter>
    );
    expect(screen.queryByTestId('delete-comment-btn')).not.toBeInTheDocument();
  });
});
