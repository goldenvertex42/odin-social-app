import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import CommentThread from './CommentThread';

// Mock child elements to isolate sorting and slicing testing parameters cleanly
vi.mock('../Comment/Comment', () => ({
  default: ({ comment }) => (
    <div data-testid="mock-comment-node">
      <span>{comment.content}</span>
    </div>
  )
}));

vi.mock('../NewCommentForm/NewCommentForm', () => ({
  default: ({ onCommentCreated }) => (
    <button 
      data-testid="mock-add-comment-trigger" 
      onClick={() => onCommentCreated({ id: 'c-new', content: 'Fresh instant comment reply node text!', createdAt: new Date().toISOString() })}
    >
      Mock Add Reply
    </button>
  )
}));

describe('CommentThread Feature Engine Module', () => {
  const baseTime = new Date('2026-01-01T12:00:00.000Z').getTime();
  
  const mockCommentsArray = [
    { id: 'c1', content: 'Oldest comment structure.', createdAt: new Date(baseTime - 20000).toISOString() },
    { id: 'c2', content: 'Middle thread interaction.', createdAt: new Date(baseTime - 10000).toISOString() },
    { id: 'c3', content: 'Newest comment update text.', createdAt: new Date(baseTime).toISOString() }
  ];

  afterEach(() => {
    cleanup();
  });

  it('renders a helpful empty label string when comment array is empty', () => {
    render(
      <MemoryRouter>
        <CommentThread comments={[]} postId="post-99" currentUserId="user-123" />
      </MemoryRouter>
    );
    expect(screen.getByText(/no comments yet/i)).toBeInTheDocument();
  });

  it('sorts comments descending and slices layout to show only the single newest item initially', () => {
    render(
      <MemoryRouter>
        <CommentThread comments={mockCommentsArray} postId="post-99" currentUserId="user-123" />
      </MemoryRouter>
    );

    // Verify only 1 comment node is drawn into the grid framework
    const commentNodes = screen.getAllByTestId('mock-comment-node');
    expect(commentNodes).toHaveLength(1);

    // Verify it is explicitly the newest comment item matching sorting criteria
    expect(screen.getByText('Newest comment update text.')).toBeInTheDocument();
    expect(screen.queryByText('Oldest comment structure.')).not.toBeInTheDocument();
  });

  it('displays the dynamic hidden count on the toggle action button', () => {
    render(
      <MemoryRouter>
        <CommentThread comments={mockCommentsArray} postId="post-99" currentUserId="user-123" />
      </MemoryRouter>
    );

    // 3 comments total minus 1 visible = 2 hidden comments
    const toggleBtn = screen.getByRole('button', { name: /view more/i });
    expect(toggleBtn).toHaveTextContent('View More (2 hidden)');
  });

  it('reveals all comments in descending order when clicked, then collapses back securely', () => {
    render(
      <MemoryRouter>
        <CommentThread comments={mockCommentsArray} postId="post-99" currentUserId="user-123" />
      </MemoryRouter>
    );

    const toggleBtn = screen.getByRole('button', { name: /view more/i });

    // Click to Expand
    fireEvent.click(toggleBtn);
    const elementsExpanded = screen.getAllByTestId('mock-comment-node');
    expect(elementsExpanded).toHaveLength(3);
    expect(screen.getByText('Oldest comment structure.')).toBeInTheDocument();
    expect(toggleBtn).toHaveTextContent('View Less');

    // Click to Collapse
    fireEvent.click(toggleBtn);
    const elementsCollapsed = screen.getAllByTestId('mock-comment-node');
    expect(elementsCollapsed).toHaveLength(1);
    expect(toggleBtn).toHaveTextContent('View More (2 hidden)');
  });

    it('safely appends new comment payloads directly atop descending arrays chronologically', () => {
      render(
        <MemoryRouter>
          <CommentThread comments={mockCommentsArray} postId="post-99" currentUserId="user-123" />
        </MemoryRouter>
      );

      // 1. Expand the thread first to reveal all baseline historical nodes (3 items)
      const toggleBtn = screen.getByRole('button', { name: /view more/i });
      fireEvent.click(toggleBtn);
      expect(screen.getAllByTestId('mock-comment-node')).toHaveLength(3);

      // 2. Click mock form handler to emit a fresh unboxed comment node
      const trigger = screen.getByTestId('mock-add-comment-trigger');
      fireEvent.click(trigger);

      // 3. Verify total history expanded stack grew correctly (3 baseline + 1 new = 4 total)
      const currentCards = screen.getAllByTestId('mock-comment-node');
      expect(currentCards).toHaveLength(4);
      
      // 4. FIXED: Verify unshifted stack insertion logic placement (index 0 is the newest comment)
      expect(currentCards[0]).toHaveTextContent('Fresh instant comment reply node text!');
    });
});
