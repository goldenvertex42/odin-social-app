import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ThemePreview from './ThemePreview';

describe('ThemePreview Component Module', () => {
  const mockOnSchemeChange = vi.fn();
  const mockOnPaletteChange = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    mockOnSchemeChange.mockClear();
    mockOnPaletteChange.mockClear();
    
    document.documentElement.removeAttribute('data-color-scheme');
    document.documentElement.removeAttribute('data-color-palette');
  });

  it('renders dropdown controls, landmark headings, and synchronizes document data attributes on mount', () => {
    render(
      <ThemePreview 
        scheme="dark" 
        palette="nord" 
        onSchemeChange={mockOnSchemeChange} 
        onPaletteChange={mockOnPaletteChange} 
      />
    );

    const heading = screen.getByRole('heading', { name: /design configuration/i, level: 2 });
    expect(heading).toBeInTheDocument();

    expect(screen.getByTestId('scheme-select').value).toBe('dark');
    expect(screen.getByTestId('palette-select').value).toBe('nord');

    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-color-palette')).toBe('nord');
  });

  it('triggers real-time visual change handlers when selecting alternative options', () => {
    render(
      <ThemePreview 
        scheme="light" 
        palette="default" 
        onSchemeChange={mockOnSchemeChange} 
        onPaletteChange={mockOnPaletteChange} 
      />
    );

    const schemeDropdown = screen.getByTestId('scheme-select');
    fireEvent.change(schemeDropdown, { target: { value: 'dark' } });
    expect(mockOnSchemeChange).toHaveBeenCalledWith('dark');

    const paletteDropdown = screen.getByTestId('palette-select');
    fireEvent.change(paletteDropdown, { target: { value: 'cyberpunk' } });
    expect(mockOnPaletteChange).toHaveBeenCalledWith('cyberpunk');
  });
});
