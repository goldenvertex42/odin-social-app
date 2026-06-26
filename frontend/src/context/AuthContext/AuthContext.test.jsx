import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import * as apiModule from '../../utils/api/api';

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
    const fetchSpy = vi.spyOn(apiModule, 'customFetch').mockImplementation(async (url) => {
      if (url.includes('/api/auth/login')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ token: 'jwt-alpha', user: { username: 'Odin Alpha' } })
        };
      }
      if (url.includes('/api/auth/me')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ username: 'Odin Alpha' })
        };
      }
      return { ok: false, status: 404 };
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('auth-loading')).not.toBeInTheDocument();
    });

    fetchSpy.mockClear();

    fireEvent.click(screen.getByTestId('login-btn'));
    
    await waitFor(() => {
      expect(screen.getByTestId('welcome-heading')).toHaveTextContent('Welcome Odin Alpha');
    });

    expect(localStorage.getItem('token')).toBe('jwt-alpha');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalledWith('/api/auth/me');
  });

  it('executes ephemeral recruiter login bypass routes without state leakage', async () => {
    const fetchSpy = vi.spyOn(apiModule, 'customFetch').mockImplementation(async (url) => {
      if (url.includes('/api/auth/guest')) {
        return {
          ok: true,
          status: 201,
          json: async () => ({ token: 'jwt-recruiter', user: { username: 'Recruiter' } })
        };
      }
      if (url.includes('/api/auth/me')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ username: 'Recruiter' })
        };
      }
      return { ok: false, status: 404 };
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('auth-loading')).not.toBeInTheDocument();
    });

    fetchSpy.mockClear();

    fireEvent.click(screen.getByTestId('guest-btn'));
    
    await waitFor(() => {
      expect(screen.getByTestId('welcome-heading')).toHaveTextContent('Welcome Recruiter');
    });

    expect(localStorage.getItem('token')).toBe('jwt-recruiter');
    
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalledWith('/api/auth/me');
  });
});
