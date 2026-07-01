import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserIndex from './UserIndex';

vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn()
}));
import { customFetch } from '../../utils/api/api';

vi.mock('../../context/AuthContext/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'self-user-123', username: 'logged_in_user' }
  })
}));

vi.mock('../../components/network/FollowCard/FollowCard', () => ({
  default: ({ member, initialStatus }) => (
    <div data-testid={`stub-follow-card-${member.id}`}>
      <span>{member.username}</span>
      <span data-testid={`status-${member.id}`}>{initialStatus}</span>
    </div>
  )
}));

const mockProfiles = [
  { id: 'u1', username: 'odin_king', followStatus: 'FOLLOWING' },
  { id: 'u2', username: 'thor_lightning', followStatus: 'REQUEST_RECEIVED' },
  { id: 'u3', username: 'loki_mischief', followStatus: 'NOT_FOLLOWING' },
  { id: 'u4', username: 'freya_beauty', followStatus: 'REQUEST_SENT' },
  { id: 'self-user-123', username: 'logged_in_user', followStatus: 'NOT_FOLLOWING' }
];

describe('UserIndex Layout Architecture View Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(customFetch).mockClear();
    localStorage.clear();
    localStorage.setItem('token', 'mock-valid-jwt');
  });

  it('branches incoming vs outgoing pending requests correctly across separate visual subtrays and filters out self', async () => {
    vi.mocked(customFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfiles
    });

    render(<UserIndex />);

    await waitFor(() => {
      expect(screen.queryByTestId('directory-loading')).not.toBeInTheDocument();
    });

    expect(customFetch).toHaveBeenCalledWith('/api/users');

    expect(screen.getByTestId('pending-tray')).toBeInTheDocument();
    expect(screen.getByTestId('incoming-subtray')).toBeInTheDocument();
    expect(screen.getByTestId('stub-follow-card-u2')).toBeInTheDocument();
    expect(screen.getByTestId('status-u2')).toHaveTextContent('REQUEST_RECEIVED');

    expect(screen.getByTestId('sent-subtray')).toBeInTheDocument();
    expect(screen.getByTestId('stub-follow-card-u4')).toBeInTheDocument();
    expect(screen.getByTestId('status-u4')).toHaveTextContent('REQUEST_SENT');

    expect(screen.getByTestId('global-directory')).toBeInTheDocument();
    expect(screen.queryByTestId('stub-follow-card-u1')).not.toBeInTheDocument();
    expect(screen.getByTestId('stub-follow-card-u3')).toBeInTheDocument();
    
    expect(screen.queryByTestId('stub-follow-card-self-user-123')).not.toBeInTheDocument();
  });
});
