import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NewPostForm from './NewPostForm';

describe('NewPostForm Component', () => {
  const mockOnPostCreated = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    mockOnPostCreated.mockClear();
    localStorage.clear();
    localStorage.setItem('token', 'mock-valid-jwt');
  });

  it('renders input elements, actions layout, and submittal states correctly', () => {
    render(<NewPostForm onPostCreated={mockOnPostCreated} />);
    
    expect(screen.getByTestId('new-post-input')).toBeInTheDocument();
    expect(screen.getByTestId('image-file-input')).toBeInTheDocument();
    expect(screen.getByTestId('new-post-submit')).toBeDisabled();
  });

  it('enables submit button when text content satisfies requirement array', () => {
    render(<NewPostForm onPostCreated={mockOnPostCreated} />);
    const input = screen.getByTestId('new-post-input');
    
    fireEvent.change(input, { target: { value: 'Valid input content string' } });
    expect(screen.getByTestId('new-post-submit')).not.toBeDisabled();
  });

  it('submits multi-part FormData layout payload tracking attached file fields successfully', async () => {
    const mockPostResponse = { id: 'post-99', content: 'Form testing text input', imageUrl: 'http://cloudinary.url' };
    
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockPostResponse,
    });

    render(<NewPostForm onPostCreated={mockOnPostCreated} />);
    
    const input = screen.getByTestId('new-post-input');
    fireEvent.change(input, { target: { value: 'Form testing text input' } });

    const file = new File(['image-bits'], 'test-photo.png', { type: 'image/png' });
    const fileInput = screen.getByTestId('image-file-input');
    
    // Simulate image array upload tracking mapping states
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    const form = screen.getByTestId('new-post-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(mockOnPostCreated).toHaveBeenCalledWith(mockPostResponse);
    });

    // Validates clean field states post upload workflow sequence
    expect(input.value).toBe('');
    expect(screen.queryByTestId('image-preview-wrapper')).not.toBeInTheDocument();
  });
});
