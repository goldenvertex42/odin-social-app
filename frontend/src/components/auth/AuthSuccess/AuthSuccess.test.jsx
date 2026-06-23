import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import AuthSuccess from './AuthSuccess';
import { AuthProvider } from '../../../context/AuthContext/AuthContext';

// Mock the AuthContext values directly to observe inner synchronization hooks cleanly
const mockRefreshUser = vi.fn(() => Promise.resolve());
vi.mock('../../../context/AuthContext/AuthContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: () => ({
      refreshUser: mockRefreshUser
    })
  };
});

describe('AuthSuccess Redirect Capture Component Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should write token to localStorage, run sync context, and navigate to /feed on success', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/auth-success?token=mock-oauth-google-jwt-token']}>
          <Routes>
            <Route path="/auth-success" element={<AuthSuccess />} />
            <Route path="/feed" element={<div>Social Feed Dashboard Screen</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    // 1. Verify loading interface renders immediately
    expect(screen.getByText('Securing your workspace profile...')).toBeInTheDocument();

    // 2. Expect token parameter extraction to have written into storage parameters
    expect(localStorage.getItem('token')).toBe('mock-oauth-google-jwt-token');

    // 3. Verify downstream dashboard route navigation successfully renders
    await waitFor(() => {
      expect(mockRefreshUser).toHaveBeenCalled();
      expect(screen.getByText('Social Feed Dashboard Screen')).toBeInTheDocument();
    });
  });

  it('should fall back onto the login route if no token property occupies the parameter box', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/auth-success']}>
          <Routes>
            <Route path="/auth-success" element={<AuthSuccess />} />
            <Route path="/login" element={<div>Login Access Form Screen</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Access Form Screen')).toBeInTheDocument();
    });
    expect(localStorage.getItem('token')).toBeNull();
  });
});
