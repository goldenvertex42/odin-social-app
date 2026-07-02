import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import Header from './Header';

let mockUser = null;
let mockLoading = false;
const mockLogout = vi.fn();

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
    cleanup();
  });

  it('renders branding links, global landmark banners, and unauthenticated controls', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const globalBanner = screen.getByRole('banner', { name: /global application banner/i });
    expect(globalBanner).toBeInTheDocument();

    expect(screen.getByText('SocialSphere')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByText(/hello/i)).not.toBeInTheDocument();
  });

  it('renders custom avatar and displayName greeting when user object is populated', () => {
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
    
    const avatarImage = screen.getByTestId('user-avatar-image');
    expect(avatarImage).toBeInTheDocument();
    expect(avatarImage).toHaveAttribute('src', 'https://cloudinary.com');
    
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  it('renders an accessible fallback initial circle when the user avatarUrl returns null', () => {
    mockUser = { 
      id: 'user-uuid-111', 
      displayName: 'Clark Kent', 
      avatarUrl: null 
    };

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
  });

  it('dispatches the context logout action sequence when the session close button is clicked', () => {
    mockUser = { id: 'user-uuid-111', displayName: 'Bruce Wayne', avatarUrl: null };

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
