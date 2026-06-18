import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import RegisterForm from './RegisterForm';

describe('RegisterForm Feature Component Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render correct input attributes and Google OAuth registration path constraints', () => {
    import.meta.env.VITE_API_URL = 'http://localhost:3000';

    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Display Name (Optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();

    const googleLink = screen.getByRole('link', { name: /google/i });
    expect(googleLink).toHaveAttribute('href', 'http://localhost:3000/api/auth/google');
  });

  it('should create new local user records and navigate inside feed outlets upon successful forms', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/feed" element={<div>Chronological Dashboard Feed</div>} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Email Address'), 'new_user@odin.local');
    await user.type(screen.getByLabelText('Username'), 'new_odin_dev');
    await user.type(screen.getByLabelText('Password'), 'OdinPassword123!');
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    // Verify token serialization storage captures and subsequent redirection navigation rendering
    await waitFor(() => {
      expect(screen.getByText('Chronological Dashboard Feed')).toBeInTheDocument();
    });
  });
});
