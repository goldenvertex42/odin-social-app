import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import AuthSuccess from './AuthSuccess';
import { AuthProvider } from '../../../context/AuthContext/AuthContext';

const mockRefreshUser = vi.fn(() => Promise.resolve());
vi.mock('../../../context/AuthContext/AuthContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: () => ({ refreshUser: mockRefreshUser })
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

    const liveHeading = screen.getByRole('status');
    expect(liveHeading).toBeInTheDocument();
    expect(liveHeading).toHaveTextContent(/Securing your workspace profile/i);

    expect(localStorage.getItem('token')).toBe('mock-oauth-google-jwt-token');

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
