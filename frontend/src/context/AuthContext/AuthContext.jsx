import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { customFetch } from '../../utils/api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronize dynamic session token data strings into state structures
  const syncIdentity = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await customFetch('/api/auth/me');
      const data = await res.json();
      setUser(data);
    } catch (err) {
      // Clear poisoned or expired token references cleanly
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncIdentity();
  }, [syncIdentity]);

  // Handle traditional credential form logins
  const login = async (email, password) => {
  setLoading(true);
  try {
    const res = await customFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    
    localStorage.setItem('token', data.token);
    
    // This populates the global layout parameters BEFORE lifting the loader!
    setUser(data.user);
    await syncIdentity(); 
    
    setLoading(false);
    return data.user;
  } catch (err) {
    setLoading(false);
    throw err;
  }
};

// Handle transient recruiter layout skips
const loginGuest = async () => {
  setLoading(true);
  try {
    const res = await customFetch('/api/auth/guest', { method: 'POST' });
    const data = await res.json();
    
    localStorage.setItem('token', data.token);
    
    setUser(data.user);
    await syncIdentity(); 
    
    setLoading(false);
    return data.user;
  } catch (err) {
    setLoading(false);
    throw err;
  }
};

  // Gracefully terminate sessions and mutate network presence states back to false
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
