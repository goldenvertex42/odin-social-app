import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FollowCard from './FollowCard';

const mockCustomFetch = vi.fn();
vi.mock('../../../utils/api/api', () => ({
  customFetch: (...args) => mockCustomFetch(...args)
}));

const mockMember = {
  id: 'member-99',
  username: 'odin_explorer',
  displayName: 'Odin Explorer',
  bio: 'Testing out the social graph connectivity hooks.',
  followStatus: 'NOT_FOLLOWING',
  avatarUrl: 'https://cloudinary.com'
};

describe('FollowCard Machine Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCustomFetch.mockReset();
  });

  it('renders NOT_FOLLOWING state and executes follow network transactions', async () => {
    mockCustomFetch.mockResolvedValueOnce({ 
      ok: true, 
      json: async () => ({ status: 'REQUEST_SENT' }) 
    });

    render(
      <MemoryRouter>
        <FollowCard member={mockMember} initialStatus="NOT_FOLLOWING" />
      </MemoryRouter>
    );

    const followBtn = screen.getByTestId('follow-btn');
    expect(followBtn).toHaveTextContent(/Connect/i);
    
    fireEvent.click(followBtn);

    await waitFor(() => {
      expect(mockCustomFetch).toHaveBeenCalledWith(
        '/api/users/member-99/follow',
        expect.objectContaining({ method: 'POST' })
      );
      expect(screen.getByTestId('cancel-request-btn')).toHaveTextContent(/Cancel Request/i);
    });
  });

  it('renders REQUEST_RECEIVED with choice buttons to split states', async () => {
    mockCustomFetch.mockResolvedValueOnce({ 
      ok: true, 
      json: async () => ({ status: 'FOLLOWING' }) 
    });

    render(
      <MemoryRouter>
        <FollowCard member={mockMember} initialStatus="REQUEST_RECEIVED" />
      </MemoryRouter>
    );

    const actionGroup = screen.getByRole('group', { name: /respond to connection request/i });
    expect(actionGroup).toBeInTheDocument();

    const acceptBtn = screen.getByTestId('accept-btn');
    expect(screen.getByTestId('reject-btn')).toBeInTheDocument();
    
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(mockCustomFetch).toHaveBeenCalledWith(
        '/api/users/member-99/accept',
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(screen.getByTestId('unfollow-btn')).toHaveTextContent(/Disconnect/i);
    });
  });
});
