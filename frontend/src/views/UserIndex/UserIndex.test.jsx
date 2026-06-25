import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserIndex from './UserIndex';

// Stub out FollowCard component to isolate page grid structure tests
vi.mock('../../components/network/FollowCard/FollowCard', () => ({
  default: ({ member, initialStatus }) => (
    <div data-testid={`stub-follow-card-${member.id}`}>
      <span>{member.username}</span>
      <span data-testid={`status-${member.id}`}>{initialStatus}</span>
    </div>
  )
}));

const mockProfiles = [
  { id: 'u1', username: 'odin_king', relationshipStatus: 'FOLLOWING' },
  { id: 'u2', username: 'thor_lightning', relationshipStatus: 'REQUEST_RECEIVED' },
  { id: 'u3', username: 'loki_mischief', relationshipStatus: 'NOT_FOLLOWING' }
];

describe('UserIndex Layout Architecture View Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'mock-valid-jwt');
  });

  it('renders initial syncing indicators and branches profiles across correct structural grids', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfiles
    });

    render(<UserIndex />);

    expect(screen.getByTestId('directory-loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId('directory-loading')).not.toBeInTheDocument();
    });

    // Verify upper incoming request tray segment isolation
    expect(screen.getByTestId('incoming-tray')).toBeInTheDocument();
    expect(screen.getByTestId('stub-follow-card-u2')).toBeInTheDocument();
    expect(screen.getByTestId('status-u2')).toHaveTextContent('REQUEST_RECEIVED');

    // Verify lower general community dashboard catalog distribution
    expect(screen.getByTestId('global-directory')).toBeInTheDocument();
    expect(screen.getByTestId('stub-follow-card-u1')).toBeInTheDocument();
    expect(screen.getByTestId('stub-follow-card-u3')).toBeInTheDocument();
  });

  it('handles empty response payloads gracefully without falling back to exceptions', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    render(<UserIndex />);

    await waitFor(() => {
      expect(screen.queryByTestId('incoming-tray')).not.toBeInTheDocument();
      expect(screen.getByTestId('empty-directory-msg')).toBeInTheDocument();
    });
  });
});
