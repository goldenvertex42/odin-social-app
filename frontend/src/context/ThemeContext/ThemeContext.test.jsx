import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from './ThemeContext';

let mockUserInstance = null;
vi.mock('../AuthContext/AuthContext', () => ({
  useAuth: () => ({
    user: mockUserInstance,
    refreshUser: vi.fn(() => Promise.resolve())
  })
}));

function ConsumerComponent() {
  const { colorScheme, activePalette, setProfileOverridePalette } = useTheme();
  return (
    <div>
      <span data-testid="scheme">{colorScheme}</span>
      <span data-testid="palette">{activePalette}</span>
      <button onClick={() => setProfileOverridePalette('cyberpunk')}>Visit Cyberpunk User</button>
      <button onClick={() => setProfileOverridePalette(null)}>Leave Profile</button>
    </div>
  );
}

describe('ThemeContext Dual-Track Preference with Profile Override Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-color-scheme');
    document.documentElement.removeAttribute('data-color-palette');
  });

  it('should initialize light and default styles correctly', () => {
    render(<ThemeProvider><ConsumerComponent /></ThemeProvider>);
    expect(screen.getByTestId('scheme').textContent).toBe('light');
    expect(screen.getByTestId('palette').textContent).toBe('default');
    expect(document.documentElement.getAttribute('data-color-palette')).toBe('default');
  });

  it('should apply a palette override while preserving the user\'s local color scheme', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><ConsumerComponent /></ThemeProvider>);

    await user.click(screen.getByRole('button', { name: 'Visit Cyberpunk User' }));

    // Luminosity scheme stays light, but palette accent changes to cyberpunk
    expect(screen.getByTestId('scheme').textContent).toBe('light');
    expect(screen.getByTestId('palette').textContent).toBe('cyberpunk');
    expect(document.documentElement.getAttribute('data-color-palette')).toBe('cyberpunk');
  });

  it('should clear the palette override and revert to the user\'s base theme settings when leaving', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><ConsumerComponent /></ThemeProvider>);

    await user.click(screen.getByRole('button', { name: 'Visit Cyberpunk User' }));
    expect(document.documentElement.getAttribute('data-color-palette')).toBe('cyberpunk');

    await user.click(screen.getByRole('button', { name: 'Leave Profile' }));

    // Reverts safely back to default base configurations
    expect(screen.getByTestId('palette').textContent).toBe('default');
    document.documentElement.setAttribute('data-color-palette', 'default');
  });
});
