import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('heic2any', () => ({
  default: vi.fn(() => Promise.resolve(new Blob(['mock-converted-jpg-data'], { type: 'image/jpeg' })))
}));

import AvatarUpload from './AvatarUpload';

describe('AvatarUpload Component Suite', () => {
  const mockOnFileSelected = vi.fn();
  const gravatarFallback = 'https://gravatar.com';

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnFileSelected.mockClear();
    
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost:5173/mock-avatar-hash');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders initial image asset source when fallback string parameter is present', () => {
    render(
      <AvatarUpload 
        initialAvatar={gravatarFallback} 
        onFileSelected={mockOnFileSelected} 
        username="OdinDeveloper"
      />
    );

    const imageElement = screen.getByTestId('user-avatar-preview');
    expect(imageElement).toBeInTheDocument();
    expect(imageElement).toHaveAttribute('src', gravatarFallback);
    expect(screen.getByTestId('edit-avatar-input')).toBeInTheDocument();
  });

  it('renders an accessible initial profile text block fallback when image parameters are completely null', () => {
    render(
      <AvatarUpload 
        initialAvatar={null} 
        onFileSelected={mockOnFileSelected} 
        username="OdinDeveloper"
      />
    );

    expect(screen.queryByTestId('user-avatar-preview')).not.toBeInTheDocument();
    const initialsBadge = screen.getByTestId('avatar-fallback-initial');
    expect(initialsBadge).toBeInTheDocument();
    expect(initialsBadge).toHaveTextContent('O');
  });

  it('triggers onFileSelected callback and mutates preview source when attaching new files', async () => {
    render(
      <AvatarUpload 
        initialAvatar={gravatarFallback} 
        onFileSelected={mockOnFileSelected} 
        username="OdinDeveloper"
      />
    );

    const fileInput = screen.getByTestId('edit-avatar-input');
    const testingFile = new File(['avatar-raw-buffer-data'], 'avatar.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: { item: (index) => testingFile, length: 1 } } });

    expect(mockOnFileSelected).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      const updatedImage = screen.getByTestId('user-avatar-preview');
      expect(updatedImage.getAttribute('src')).toContain('blob:');
    });
  });
});
