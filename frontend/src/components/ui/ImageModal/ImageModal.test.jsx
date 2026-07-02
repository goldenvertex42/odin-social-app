import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ImageModal from './ImageModal';

describe('ImageModal Component Module Suite', () => {
  const mockImageUrl = 'https://cloudinary.com';
  const mockAltText = 'Enlarged photography preview sample asset';
  const mockCloseCallback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    document.body.style.overflow = 'visible';
  });

  afterEach(() => {
    cleanup();
  });

  it('returns null and completely unmounts from the DOM if imageUrl is missing', () => {
    render(
      <ImageModal imageUrl="" onClose={mockCloseCallback} />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders structural elements, action icons, and imagery attributes flawlessly', () => {
    render(
      <ImageModal imageUrl={mockImageUrl} altText={mockAltText} onClose={mockCloseCallback} />
    );
    
    const dialog = screen.getByRole('dialog', { name: /image preview modal/i });
    expect(dialog).toBeInTheDocument();
    
    const renderedImage = screen.getByRole('img');
    expect(renderedImage).toHaveAttribute('src', mockImageUrl);
    expect(renderedImage).toHaveAttribute('alt', mockAltText);
    expect(renderedImage).toHaveAttribute('referrerPolicy', 'no-referrer');
    
    const closeBtn = screen.getByTestId('close-modal-btn');
    expect(closeBtn).toBeInTheDocument();

    expect(document.activeElement).toBe(closeBtn);
  });

  it('triggers the closure callback when selecting the close action button', () => {
    render(
      <ImageModal imageUrl={mockImageUrl} onClose={mockCloseCallback} />
    );
    const closeBtn = screen.getByTestId('close-modal-btn');
    fireEvent.click(closeBtn);
    expect(mockCloseCallback).toHaveBeenCalledTimes(1);
  });

  it('bubbles events up to call onClose when clicking the greyed-out background backdrop overlay', () => {
    render(
      <ImageModal imageUrl={mockImageUrl} onClose={mockCloseCallback} />
    );
    const backdropOverlay = screen.getByTestId('modal-backdrop');
    fireEvent.click(backdropOverlay);
    expect(mockCloseCallback).toHaveBeenCalledTimes(1);
  });

  it('intercepts keyboard interactions and fires onClose when pressing the Escape key code parameter', () => {
    render(
      <ImageModal imageUrl={mockImageUrl} onClose={mockCloseCallback} />
    );
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(mockCloseCallback).toHaveBeenCalledTimes(1);
  });

  it('locks background document layout scroll bars on mount phase, then restores them on cleanup unmount', () => {
    expect(document.body.style.overflow).toBe('visible');
    
    const { unmount } = render(
      <ImageModal imageUrl={mockImageUrl} onClose={mockCloseCallback} />
    );
    expect(document.body.style.overflow).toBe('hidden');
    
    unmount();
    expect(document.body.style.overflow).toBe('visible');
  });
});
