import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import ProtectedRoute from './ProtectedRoute';

let mockUser = null;
let mockLoading = true;

vi.mock('../../../context/AuthContext/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, loading: mockLoading })
}));

vi.mock('../../layout/Header/Header', () => ({
  default: () => <div data-testid="mock-header">Application Header</div>
}));

vi.mock('../../layout/Sidebar/Sidebar', () => ({
  default: () => <div data-testid="mock-sidebar">Application Sidebar</div>
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
    
    const liveAnnouncement = screen.getByRole('status');
    expect(liveAnnouncement).toBeInTheDocument();
    expect(liveAnnouncement).toHaveTextContent(/synchronizing social session graph/i);
    
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('should redirect unauthenticated users to the login route when token is missing', () => {
    mockLoading = false;
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

  it('should allow navigation access to nested outlets and render layout frame when a valid user occupies state parameters', () => {
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

    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    
    const sidebarComplementaryRail = screen.getByRole('complementary', { name: /application navigation rail/i });
    expect(sidebarComplementaryRail).toBeInTheDocument();
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
  });
});
