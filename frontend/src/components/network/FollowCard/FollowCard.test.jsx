import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FollowCard from './FollowCard';
import * as apiModule from '../../../utils/api/api';

const mockMember = {
  id: 'member-99',
  username: 'odin_explorer',
  displayName: 'Odin Explorer',
  bio: 'Testing out the social graph connectivity hooks.'
};

describe('FollowCard Machine Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders NOT_FOLLOWING state and executes follow network transactions', async () => {
    const fetchSpy = vi.spyOn(apiModule, 'customFetch').mockResolvedValueOnce({ ok: true });
    
    // Wrapped in MemoryRouter to safeguard against routing Link operations
    render(
      <MemoryRouter>
        <FollowCard member={mockMember} initialStatus="NOT_FOLLOWING" />
      </MemoryRouter>
    );

    const followBtn = screen.getByTestId('follow-btn');
    expect(followBtn).toHaveTextContent('Connect');
    
    fireEvent.click(followBtn);
    
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/users/member-99/follow', expect.objectContaining({ method: 'POST' }));
      expect(screen.getByTestId('cancel-request-btn')).toHaveTextContent('Cancel Request');
    });
  });

  it('renders REQUEST_RECEIVED with choice buttons to split states', async () => {
    const fetchSpy = vi.spyOn(apiModule, 'customFetch').mockResolvedValueOnce({ ok: true });
    
    render(
      <MemoryRouter>
        <FollowCard member={mockMember} initialStatus="REQUEST_RECEIVED" />
      </MemoryRouter>
    );

    const acceptBtn = screen.getByTestId('accept-btn');
    expect(screen.getByTestId('reject-btn')).toBeInTheDocument();
    
    fireEvent.click(acceptBtn);
    
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/users/member-99/accept', expect.objectContaining({ method: 'PATCH' }));
      expect(screen.getByTestId('unfollow-btn')).toHaveTextContent('Disconnect');
    });
  });
});
