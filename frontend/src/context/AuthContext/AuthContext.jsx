import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { customFetch } from '../../utils/api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncIdentity = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await customFetch('/api/auth/me');
      
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (err) {
      // Clear poisoned or expired token references cleanly
      console.error("Background identity sync failed safely:", err);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncIdentity();
  }, [syncIdentity]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await customFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.message || 'Login rejected by authentication server.');
      }

      const data = await res.json();
      localStorage.setItem('token', data.token);
      
      setUser(data.user);
      setLoading(false);
      return data.user;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const loginGuest = async () => {
    setLoading(true);
    try {
      const res = await customFetch('/api/auth/guest', { method: 'POST' });
      
      if (!res.ok) {
        throw new Error('Failed to initialize a transient guest worker workspace.');
      }

      const data = await res.json();
      localStorage.setItem('token', data.token);
      
      setUser(data.user);
      setLoading(false);
      return data.user;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await customFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout request exception:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('workspace-color-palette');
      localStorage.removeItem('workspace-color-scheme');
      setUser(null);
      setLoading(false);
    }
  };

  const value = { 
    user, 
    loading, 
    login, 
    loginGuest, 
    logout, 
    refreshUser: syncIdentity 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be consumed strictly within an AuthProvider layer.');
  }
  return context;
}
