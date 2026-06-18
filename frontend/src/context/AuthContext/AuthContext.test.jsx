import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

function ConsumerComponent() {
  const { user, loading, login, loginGuest, logout } = useAuth();

  if (loading) return <div>Synchronizing Session...</div>;
  if (!user) {
    return (
      <div>
        <span>Unauthenticated Screen</span>
        <button onClick={() => login('alpha@odin.local', 'OdinPassword123!')}>Standard Sign In</button>
        <button onClick={loginGuest}>Recruiter Bypass</button>
      </div>
    );
  }

  return (
    <div>
      <span>Welcome, {user.displayName}</span>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}

describe('AuthContext Global State Orchestration Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize and resolve to unauthenticated if token is empty', async () => {
    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>
    );

    const unauthScreen = await screen.findByText('Unauthenticated Screen');
    expect(unauthScreen).toBeInTheDocument();
  });

  it('should auto-authenticate users on mount if a valid token string resides in localStorage', async () => {
    localStorage.setItem('token', 'mock-valid-jwt-string-from-msw');

    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome, Odin Alpha')).toBeInTheDocument();
    });
  });

  it('should handle standard login requests and write returned token strings to local storage', async () => {
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('Unauthenticated Screen')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Standard Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Welcome, Odin Alpha')).toBeInTheDocument();
    });

    expect(localStorage.getItem('token')).toBe('mock-valid-jwt-string-from-msw');
  });

  it('should execute recruiter shortcuts and instantiate cyberpunk theme parameters natively', async () => {
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('Unauthenticated Screen')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Recruiter Bypass' }));

    await waitFor(() => {
      expect(screen.getByText('Welcome, ✨ Recruiter Guest Profile')).toBeInTheDocument();
    });

    expect(localStorage.getItem('token')).toBe('mock-guest-jwt-string');
  });

  it('should drop token references and reset user states to null on logout triggers', async () => {
    const user = userEvent.setup();
    localStorage.setItem('token', 'mock-valid-jwt-string-from-msw');

    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('Welcome, Odin Alpha')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Sign Out' }));

    await waitFor(() => {
      expect(screen.getByText('Unauthenticated Screen')).toBeInTheDocument();
    });
    expect(localStorage.getItem('token')).toBeNull();
  });
});
