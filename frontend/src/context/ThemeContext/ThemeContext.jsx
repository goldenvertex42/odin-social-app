import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../AuthContext/AuthContext';
import { customFetch } from '../../utils/api/api';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user, refreshUser } = useAuth();

  // 1. Initialize instantly into a safe default string (No more test suite crashes!)
  const [colorScheme, setColorScheme] = useState(() => {
    return localStorage.getItem('workspace-color-scheme') || 'light';
  });

  const [colorPalette, setColorPalette] = useState(() => {
    const cached = localStorage.getItem('workspace-color-palette');
    const valid = ['default', 'cyberpunk', 'nord', 'sunset', 'obsidian', 'neonmint'];
    return valid.includes(cached) ? cached : 'default';
  });

  const [profileOverridePalette, setProfileOverridePalette] = useState(null);

  // 2. Natively handle system-level dark mode detection ONLY in the real browser environment
  useEffect(() => {
    const cached = localStorage.getItem('workspace-color-scheme');
    if (!cached && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) setColorScheme('dark');
    }
  }, []);

  // 3. Keep your existing DOM attribute sync loops exactly the same
  useEffect(() => {
    document.documentElement.setAttribute('data-color-scheme', colorScheme);
    localStorage.setItem('workspace-color-scheme', colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    const activePalette = profileOverridePalette || colorPalette;
    document.documentElement.setAttribute('data-color-palette', activePalette);
  }, [colorPalette, profileOverridePalette]);

  // Sync state changes from logged-in user profile
  useEffect(() => {
    if (user) {
      if (user.colorScheme) setColorScheme(user.colorScheme);
      if (user.colorPalette) setColorPalette(user.colorPalette);
    }
  }, [user]);

  const updateTheme = async (newScheme, newPalette) => {
    if (newScheme) setColorScheme(newScheme);
    if (newPalette) setColorPalette(newPalette);

    if (user) {
      try {
        await customFetch('/api/users/profile', {
          method: 'PUT',
          body: JSON.stringify({
            colorScheme: newScheme || colorScheme,
            colorPalette: newPalette || colorPalette
          })
        });
        await refreshUser();
      } catch (err) {
        console.error('Failed to sync design configurations:', err);
      }
    }
  };

  const toggleColorScheme = () => {
    updateTheme(colorScheme === 'light' ? 'dark' : 'light', null);
  };

  return (
    <ThemeContext.Provider value={{ 
      colorScheme, 
      colorPalette, 
      activePalette: profileOverridePalette || colorPalette,
      updateTheme, 
      toggleColorScheme,
      setProfileOverridePalette 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be consumed within a ThemeProvider layer.');
  return context;
}
