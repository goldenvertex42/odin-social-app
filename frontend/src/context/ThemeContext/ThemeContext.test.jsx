import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from './ThemeContext';

let mockUserInstance = null;
let matchMediaListeners = [];

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
    matchMediaListeners = [];
    document.documentElement.removeAttribute('data-color-scheme');
    document.documentElement.removeAttribute('data-color-palette');

    // Provision a clean, standard implementation of matchMedia inside JSDOM environment
    vi.stubGlobal('matchMedia', vi.fn((query) => ({
      matches: false, // Default system preference to light mode
      media: query,
      onchange: null,
      addEventListener: vi.fn((event, callback) => {
        if (event === 'change') matchMediaListeners.push(callback);
      }),
      removeEventListener: vi.fn((event, callback) => {
        if (event === 'change') {
          matchMediaListeners = matchMediaListeners.filter(cb => cb !== callback);
        }
      }),
      addListener: vi.fn(),
      removeListener: vi.fn()
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should initialize light and default styles correctly', () => {
    render(<ThemeProvider><ConsumerComponent /></ThemeProvider>);
    expect(screen.getByTestId('scheme').textContent).toBe('light');
    expect(screen.getByTestId('palette').textContent).toBe('default');
    expect(document.documentElement.getAttribute('data-color-palette')).toBe('default');
  });

  it('should respect system dark mode preferences if no local storage preference is set', () => {
    // Override the mock to return a matching system dark mode query parameter value
    vi.stubGlobal('matchMedia', vi.fn((query) => ({
      matches: true, // System explicitly requests dark mode
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })));

    render(<ThemeProvider><ConsumerComponent /></ThemeProvider>);
    expect(screen.getByTestId('scheme').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('dark');
  });

  it('should dynamically update theme layout when operating system preference changes live', async () => {
    render(
      <ThemeProvider>
        <ConsumerComponent />
      </ThemeProvider>
    );
    expect(screen.getByTestId('scheme').textContent).toBe('light');

    act(() => {
      if (matchMediaListeners.length > 0) {
        matchMediaListeners.forEach(cb => 
          cb({ 
            matches: true,
            media: '(prefers-color-scheme: dark)'
          })
        );
      }
    });

    await waitFor(() => {
      expect(screen.getByTestId('scheme').textContent).toBe('dark');
      expect(document.documentElement.getAttribute('data-color-scheme')).toBe('dark');
    });
  });


  it('should apply a palette override while preserving the user\'s local color scheme', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><ConsumerComponent /></ThemeProvider>);
    
    await user.click(screen.getByRole('button', { name: 'Visit Cyberpunk User' }));

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

    expect(screen.getByTestId('palette').textContent).toBe('default');
    expect(document.documentElement.getAttribute('data-color-palette')).toBe('default');
  });
});
