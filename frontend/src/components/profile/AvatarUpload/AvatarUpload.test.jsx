import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AvatarUpload from './AvatarUpload';

describe('AvatarUpload Field Component', () => {
  const mockOnFileSelected = vi.fn();
  // Match your application's fallback string pattern using Gravatar's query string rules
  const gravatarFallback = 'https://gravatar.com';

  beforeEach(() => {
    vi.restoreAllMocks();
    mockOnFileSelected.mockClear();
  });

  it('renders Gravatar fallback image asset source when initial string parameter is missing', () => {
    render(<AvatarUpload initialAvatar={gravatarFallback} onFileSelected={mockOnFileSelected} />);
    
    const imageElement = screen.getByRole('img', { name: /avatar preview/i });
    expect(imageElement).toHaveAttribute('src', gravatarFallback);
    expect(screen.getByTestId('edit-avatar-input')).toBeInTheDocument();
  });

  it('loads provided user avatar strings onto the preview container successfully', () => {
    render(<AvatarUpload initialAvatar="https://cloudinary.com" onFileSelected={mockOnFileSelected} />);
    
    const imageElement = screen.getByRole('img', { name: /avatar preview/i });
    expect(imageElement).toHaveAttribute('src', 'https://cloudinary.com');
  });

  it('triggers onFileSelected callback and mutates preview source when attaching new files', async () => {
    render(<AvatarUpload initialAvatar={gravatarFallback} onFileSelected={mockOnFileSelected} />);
    
    const fileInput = screen.getByTestId('edit-avatar-input');
    const testingFile = new File(['avatar-raw-buffer-data'], 'avatar.png', { type: 'image/png' });

    // Simulate attached multi-part upload event arrays
    fireEvent.change(fileInput, { target: { files: [testingFile] } });

    expect(mockOnFileSelected).toHaveBeenCalled(1);

    // Wait securely for the FileReader microtask loop to fire and rewrite src tags
    await waitFor(() => {
      const updatedImage = screen.getByRole('img', { name: /avatar preview/i });
      expect(updatedImage.getAttribute('src')).toContain('data:image/png;base64,');
    });
  });
});
