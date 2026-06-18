import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import ProtectedRoute from './ProtectedRoute';

// Construct dynamic context mock state hooks
let mockUser = null;
let mockLoading = true;

vi.mock('../../context/AuthContext/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockLoading
  })
}));

describe('ProtectedRoute Security Perimeter Suite', () => {
  beforeEach(() => {
    mockUser = null;
    mockLoading = true;
    vi.clearAllMocks();
  });

  it('should display the structural fallback loading spinner while context syncing is active', () => {
    render(
      <MemoryRouter initialEntries={['/feed']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/feed" element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('route-loader')).toBeInTheDocument();
    expect(screen.getByText(/synchronizing/i)).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('should redirect unauthenticated users to the login route when token is missing', () => {
    mockLoading = false; // Sync finished, user is missing
    mockUser = null;

    render(
      <MemoryRouter initialEntries={['/feed']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/feed" element={<div>Dashboard</div>} />
          </Route>
          <Route path="/login" element={<div>Login Form Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Form Screen')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('should allow navigation access to nested outlets when a valid user occupies state parameters', () => {
    mockLoading = false;
    mockUser = { id: 'active-session-id', username: 'odin_user' };

    render(
      <MemoryRouter initialEntries={['/feed']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/feed" element={<div>Dashboard Protected Feed Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Protected Feed Content')).toBeInTheDocument();
    expect(screen.queryByTestId('route-loader')).not.toBeInTheDocument();
  });
});
