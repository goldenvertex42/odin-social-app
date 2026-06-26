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
  });

  it('renders dropdown controls with current active option weights', () => {
    render(
      <ThemePreview
        scheme="dark"
        palette="nord"
        onSchemeChange={mockOnSchemeChange}
        onPaletteChange={mockOnPaletteChange}
      />
    );

    expect(screen.getByTestId('scheme-select').value).toBe('dark');
    expect(screen.getByTestId('palette-select').value).toBe('nord');
  });

  it('triggers real-time visual change handlers when selecting options', () => {
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
