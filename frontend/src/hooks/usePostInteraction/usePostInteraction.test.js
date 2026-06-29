import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePostInteraction } from './usePostInteraction';

vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn()
}));
import { customFetch } from '../../utils/api/api';

describe('usePostInteraction Custom Hook State Machine', () => {
  const mockInitialLikes = [{ id: 'like-1', postId: 'post-11', userId: 'user-abc' }];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accurately evaluates hasLiked mappings when currentUserId falls inside the array matrix', () => {
    const { result } = renderHook(() => 
      usePostInteraction('post-11', mockInitialLikes, 'user-abc')
    );

    expect(result.current.likesCount).toBe(1);
    expect(result.current.hasLiked).toBe(true);
  });

  it('re-evaluates hasLiked to false if currentUserId represents an outsider account', () => {
    const { result } = renderHook(() => 
      usePostInteraction('post-11', mockInitialLikes, 'user-stranger')
    );

    expect(result.current.hasLiked).toBe(false);
  });

  it('submits backend updates on click and replaces the likes tracking collection array smoothly', async () => {
    const updatedPayload = [
      { id: 'like-1', postId: 'post-11', userId: 'user-abc' },
      { id: 'like-2', postId: 'post-11', userId: 'user-xyz' }
    ];

    vi.mocked(customFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => updatedPayload
    });

    const { result } = renderHook(() => 
      usePostInteraction('post-11', mockInitialLikes, 'user-xyz')
    );

    expect(result.current.likesCount).toBe(1);

    await act(async () => {
      await result.current.toggleLike({ stopPropagation: vi.fn() });
    });

    expect(customFetch).toHaveBeenCalledWith('/api/likes/post/post-11', { method: 'POST' });
    expect(result.current.likesCount).toBe(2);
  });
});
