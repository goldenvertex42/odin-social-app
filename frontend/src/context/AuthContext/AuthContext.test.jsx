import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import * as apiModule from '../../utils/api/api';

// A mock consumer component to test context values
function TestConsumer() {
  const { user, loading, login, loginGuest, logout } = useAuth();
  
  if (loading) return <div data-testid="auth-loading">Loading...</div>;
  if (!user) {
    return (
      <div>
        <div data-testid="anonymous-view">No Active Session</div>
        <button data-testid="login-btn" onClick={() => login('odin@test.com', 'password123')}>Log In</button>
        <button data-testid="guest-btn" onClick={() => loginGuest()}>Recruiter Bypass</button>
      </div>
    );
  }

  return (
    <div>
      <h1 data-testid="welcome-heading">Welcome {user.username}</h1>
      <button data-testid="logout-btn" onClick={logout}>Sign Out</button>
    </div>
  );
}

describe('AuthContext Strict Production Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('authenticates traditional credentials and syncs user identity', async () => {
    // Intercept customFetch globally and return data matching login route requirements
    const fetchSpy = vi.spyOn(apiModule, 'customFetch').mockImplementation(async (url) => {
      if (url.includes('/api/auth/login')) {
        return {
          json: async () => ({ token: 'jwt-alpha', user: { username: 'Odin Alpha' } })
        };
      }
      if (url.includes('/api/auth/me')) {
        return {
          json: async () => ({ username: 'Odin Alpha' })
        };
      }
      throw new Error('Not found');
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Initial syncIdentity finishes (no token in localStorage, falls back quickly)
    await waitFor(() => {
      expect(screen.queryByTestId('auth-loading')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('welcome-heading')).toHaveTextContent('Welcome Odin Alpha');
    });
    expect(localStorage.getItem('token')).toBe('jwt-alpha');
  });

  it('executes ephemeral recruiter login bypass routes without state leakage', async () => {
    // Intercept customFetch globally and return data matching guest route requirements
    const fetchSpy = vi.spyOn(apiModule, 'customFetch').mockImplementation(async (url) => {
      if (url.includes('/api/auth/guest')) {
        return {
          json: async () => ({ token: 'jwt-recruiter', user: { username: 'Recruiter' } })
        };
      }
      if (url.includes('/api/auth/me')) {
        return {
          json: async () => ({ username: 'Recruiter' })
        };
      }
      throw new Error('Not found');
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('auth-loading')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('guest-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('welcome-heading')).toHaveTextContent('Welcome Recruiter');
    });
    expect(localStorage.getItem('token')).toBe('jwt-recruiter');
  });
});
