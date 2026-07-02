import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NewPostForm from './NewPostForm';

vi.mock('../../../utils/api/api', () => ({
  customFetch: vi.fn()
}));
import { customFetch } from '../../../utils/api/api';

describe('NewPostForm Component', () => {
  const mockOnPostCreated = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    mockOnPostCreated.mockClear();
    localStorage.clear();
    localStorage.setItem('token', 'mock-valid-jwt');

    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: vi.fn(() => 'blob:preview-test')
    });

    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: vi.fn()
    });
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

  it('shows a preview when a file is selected from a FileList-like input', async () => {
    render(<NewPostForm onPostCreated={mockOnPostCreated} />);

    const file = new File(['image-bits'], 'preview-photo.png', { type: 'image/png' });
    const fileInput = screen.getByTestId('image-file-input');

    fireEvent.change(fileInput, { target: { files: { 0: file, length: 1 } } });

    expect(await screen.findByTestId('image-preview-wrapper')).toBeInTheDocument();
    expect(screen.getByAltText('Upload preview')).toHaveAttribute('src', 'blob:preview-test');
  });

  it('submits multi-part FormData layout payload tracking attached file fields successfully', async () => {
    const mockPostResponse = { 
      id: 'post-99', 
      content: 'Form testing text input', 
      imageUrl: 'http://cloudinary.url' 
    };

    vi.mocked(customFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Post published successfully.',
        post: mockPostResponse
      })
    });

    render(<NewPostForm onPostCreated={mockOnPostCreated} />);
    
    const input = screen.getByTestId('new-post-input');
    fireEvent.change(input, { target: { value: 'Form testing text input' } });
    
    const file = new File(['image-bits'], 'test-photo.png', { type: 'image/png' });
    const fileInput = screen.getByTestId('image-file-input');
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    const form = screen.getByTestId('new-post-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(customFetch).toHaveBeenCalledTimes(1);
      expect(mockOnPostCreated).toHaveBeenCalledWith(mockPostResponse);
    });

    expect(input.value).toBe('');
    expect(screen.queryByTestId('image-preview-wrapper')).not.toBeInTheDocument();
  });
});
