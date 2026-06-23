import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import Header from './Header';

// Construct dynamic module-level variables for flexible test case overrides
let mockUser = null;
let mockLoading = false;
const mockLogout = vi.fn();

// Target the explicit custom hook export pathway exactly as defined in your context file
vi.mock('../../../context/AuthContext/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockLoading,
    logout: mockLogout
  })
}));

describe('Header Feature Component Suite', () => {
  beforeEach(() => {
    mockUser = null;
    mockLoading = false;
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup(); // Wipe JSDOM tree to prevent state bleeding
  });

  it('renders branding links and fallback unauthenticated controls when session is null', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText('SocialSphere')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByText(/hello/i)).not.toBeInTheDocument();
  });

  it('renders custom avatar and displayName greeting when user object is populated', () => {
    // Inject a simulated Prisma user model payload matching your database configuration
    mockUser = {
      id: 'user-uuid-111',
      displayName: 'Bruce Wayne',
      avatarUrl: 'https://cloudinary.com'
    };

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText('Bruce Wayne')).toBeInTheDocument();
    const avatar = screen.getByAltText("Bruce Wayne's profile");
    expect(avatar).toHaveAttribute('src', 'https://cloudinary.com');
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  it('falls back to default local vector avatar when backend avatarUrl is null', () => {
    mockUser = {
      id: 'user-uuid-222',
      displayName: 'Clark Kent',
      avatarUrl: null // Google or local account fallback condition
    };

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const avatar = screen.getByAltText("Clark Kent's profile");
    expect(avatar).toHaveAttribute('src', '/default-avatar.svg');
  });

  it('dispatches the context logout action sequence when the session close button is clicked', () => {
    mockUser = {
      id: 'user-uuid-111',
      displayName: 'Bruce Wayne',
      avatarUrl: null
    };

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const logoutButton = screen.getByRole('button', { name: /log out/i });
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
