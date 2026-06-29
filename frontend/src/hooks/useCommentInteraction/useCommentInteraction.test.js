import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCommentInteraction } from './useCommentInteraction';

vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn()
}));
import { customFetch } from '../../utils/api/api';

describe('useCommentInteraction Custom Hook State Machine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles response envelopes containing direct liked boolean state overrides smoothly', async () => {
    vi.mocked(customFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ liked: true })
    });

    const { result } = renderHook(() => 
      useCommentInteraction('comment-99', [], 'user-abc')
    );

    expect(result.current.likesCount).toBe(0);
    expect(result.current.hasLiked).toBe(false);

    await act(async () => {
      await result.current.toggleCommentLike();
    });

    expect(result.current.likesCount).toBe(1);
    expect(result.current.hasLiked).toBe(true);
  });
});
