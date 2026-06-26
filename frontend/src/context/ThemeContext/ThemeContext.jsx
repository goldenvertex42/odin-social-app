import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../AuthContext/AuthContext';
import { customFetch } from '../../utils/api/api';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user, refreshUser } = useAuth();

  const [colorScheme, setColorScheme] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const userPreferred = localStorage.getItem('workspace-user-preferred-scheme');
      if (userPreferred) return userPreferred;
      
      const cached = localStorage.getItem('workspace-color-scheme');
      if (cached) return cached;
    }
    
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    return 'light';
  });

  const [colorPalette, setColorPalette] = useState(() => {
    const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('workspace-color-palette') : null;
    const valid = ['default', 'cyberpunk', 'nord', 'sunset', 'obsidian', 'neonmint'];
    return valid.includes(cached) ? cached : 'default';
  });

  const [profileOverridePalette, setProfileOverridePalette] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      const userPreferred = localStorage.getItem('workspace-user-preferred-scheme');
      if (!userPreferred) {
        setColorScheme(e.matches ? 'dark' : 'light');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-color-scheme', colorScheme);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('workspace-color-scheme', colorScheme);
    }
  }, [colorScheme]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const activePalette = profileOverridePalette || colorPalette;
      document.documentElement.setAttribute('data-color-palette', activePalette);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('workspace-color-palette', colorPalette);
    }
  }, [colorPalette, profileOverridePalette]);

  useEffect(() => {
    if (user) {
      if (user.colorScheme) {
        setColorScheme(user.colorScheme);
        localStorage.setItem('workspace-user-preferred-scheme', user.colorScheme);
      }
      if (user.colorPalette) setColorPalette(user.colorPalette);
    }
  }, [user]);

  const updateTheme = async (newScheme, newPalette) => {
    if (newScheme) {
      setColorScheme(newScheme);
      localStorage.setItem('workspace-user-preferred-scheme', newScheme);
    }
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
