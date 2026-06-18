import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';
import { AuthProvider } from '../../context/AuthContext/AuthContext';

describe('LoginForm Feature Component Integration Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render structural form elements and Google OAuth anchor paths correctly', () => {
    import.meta.env.VITE_API_URL = 'http://localhost:3000';
    
    render(<AuthProvider><LoginForm /></AuthProvider>);

    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    
    // 🎯 REFACTORED CHECK: Targets the simplified 'Google' text label
    const googleLink = screen.getByRole('link', { name: /google/i });
    expect(googleLink).toHaveAttribute('href', 'http://localhost:3000/api/auth/google');
  });

  it('should authenticate users through credentials when form passes validation', async () => {
    const user = userEvent.setup();
    render(<AuthProvider><LoginForm /></AuthProvider>);

    await user.type(screen.getByLabelText('Email Address'), 'alpha@odin.local');
    await user.type(screen.getByLabelText('Password'), 'OdinPassword123!');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('mock-valid-jwt-string-from-msw');
    });
  });

  it('should successfully dispatch recruiter instant guest bypass routines', async () => {
    const user = userEvent.setup();
    render(<AuthProvider><LoginForm /></AuthProvider>);

    await user.click(screen.getByRole('button', { name: /guest/i }));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('mock-guest-jwt-string');
    });
  });
});
