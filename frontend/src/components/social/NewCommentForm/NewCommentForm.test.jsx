import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NewCommentForm from './NewCommentForm';

vi.mock('../../../utils/api/api', () => ({
  customFetch: vi.fn()
}));
import { customFetch } from '../../../utils/api/api';

describe('NewCommentForm Component Module Suite', () => {
  const mockOnCommentCreated = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(customFetch).mockClear();
    mockOnCommentCreated.mockClear();
  });

  it('renders input field elements and disables the reply button when text content is empty', () => {
    render(<NewCommentForm postId="post-123" onCommentCreated={mockOnCommentCreated} />);
    
    const input = screen.getByLabelText(/Write a response to this post/i);
    const submitBtn = screen.getByRole('button', { name: /Reply/i });
    
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('');
    expect(submitBtn).toBeDisabled();
  });

  it('enables the submit button when valid text context strings are typed into the input', () => {
    render(<NewCommentForm postId="post-123" onCommentCreated={mockOnCommentCreated} />);
    
    const input = screen.getByLabelText(/Write a response to this post/i);
    const submitBtn = screen.getByRole('button', { name: /Reply/i });
    
    fireEvent.change(input, { target: { value: 'Valid comment content text string asset' } });
    
    expect(input.value).toBe('Valid comment content text string asset');
    expect(submitBtn).not.toBeDisabled();
  });

  it('submits data via customFetch absolute endpoints and unboxes the nested backend comment row object cleanly', async () => {
    const mockEnvelopePayload = {
      message: 'Comment posted successfully.',
      comment: { id: 'comment-uuid-777', content: 'Testing database row extraction parameters', postId: 'post-123' }
    };
    
    let resolveNetworkPromise;
    const networkPromise = new Promise((resolve) => {
      resolveNetworkPromise = () => resolve({ ok: true, json: async () => mockEnvelopePayload });
    });
    vi.mocked(customFetch).mockReturnValueOnce(networkPromise);

    render(<NewCommentForm postId="post-123" onCommentCreated={mockOnCommentCreated} />);
    
    const input = screen.getByLabelText(/Write a response to this post/i);
    const form = screen.getByTestId('new-comment-form');
    const submitBtn = screen.getByRole('button', { name: /reply/i });

    fireEvent.change(input, { target: { value: 'Testing database row extraction parameters' } });
    fireEvent.submit(form);

    expect(input).toBeDisabled();
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent(/replying.../i);

    resolveNetworkPromise();

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

    expect(mockOnCommentCreated).toHaveBeenCalledWith(mockEnvelopePayload.comment);
    
    expect(input).not.toBeDisabled();
    expect(input.value).toBe('');
  });
});
