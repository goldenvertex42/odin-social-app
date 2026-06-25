import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NewCommentForm from './NewCommentForm';

// 1. Intercept customFetch module exports globally before component rendering loops
vi.mock('../../../utils/api/api', () => ({
  customFetch: vi.fn()
}));

import { customFetch } from '../../../utils/api/api';

describe('NewCommentForm Component Module', () => {
  const mockOnCommentCreated = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(customFetch).mockClear();
    mockOnCommentCreated.mockClear();
  });

  it('renders input field elements and disables the reply button when text content is empty', () => {
    render(<NewCommentForm postId="post-123" onCommentCreated={mockOnCommentCreated} />);
    
    const input = screen.getByTestId('comment-input');
    const submitBtn = screen.getByTestId('comment-submit');

    expect(input).toBeInTheDocument();
    expect(input.value).toBe('');
    expect(submitBtn).toBeDisabled();
  });

  it('enables the submit button when valid text context strings are typed into the input', () => {
    render(<NewCommentForm postId="post-123" onCommentCreated={mockOnCommentCreated} />);
    
    const input = screen.getByTestId('comment-input');
    const submitBtn = screen.getByTestId('comment-submit');

    fireEvent.change(input, { target: { value: 'Valid comment content text string asset' } });
    
    expect(input.value).toBe('Valid comment content text string asset');
    expect(submitBtn).not.toBeDisabled();
  });

  it('submits data via customFetch absolute endpoints and unboxes the nested backend comment row object cleanly', async () => {
    const mockEnvelopePayload = {
      message: 'Comment posted successfully.',
      comment: { id: 'comment-uuid-777', content: 'Testing database row extraction parameters', postId: 'post-123' }
    };

    // Mock a highly successful network resolution lifecycle payload
    vi.mocked(customFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEnvelopePayload
    });

    render(<NewCommentForm postId="post-123" onCommentCreated={mockOnCommentCreated} />);
    
    const input = screen.getByTestId('comment-input');
    const form = screen.getByTestId('new-comment-form');

    fireEvent.change(input, { target: { value: 'Testing database row extraction parameters' } });
    fireEvent.submit(form);

    // 2. Validate API was queried with explicit multi-layered parameters and routing parameters
    await waitFor(() => {
      expect(customFetch).toHaveBeenCalledTimes(1);
    });

    expect(customFetch).toHaveBeenCalledWith('/api/comments/post/post-123', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: 'Testing database row extraction parameters' })
    });

    // 3. Confirm the backend envelope key 'comment' was successfully targeted and passed up
    expect(mockOnCommentCreated).toHaveBeenCalledWith(mockEnvelopePayload.comment);

    // 4. Confirm text box purges its internal text value cleanly post-submission loops
    expect(input.value).toBe('');
  });
});
