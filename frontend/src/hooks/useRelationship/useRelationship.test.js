import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRelationship } from './useRelationship';

vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn()
}));
import { customFetch } from '../../utils/api/api';

describe('useRelationship Custom Hook State Machine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('initializes layout parameters with clean, predictable starting constraints', () => {
    const { result } = renderHook(() => useRelationship('user-456', 'NOT_FOLLOWING'));
    
    expect(result.current.relationship).toBe('NOT_FOLLOWING');
    expect(result.current.isProcessing).toBe(false);
  });

  it('advances status smoothly upon successful network transaction resolutions', async () => {
    vi.mocked(customFetch).mockResolvedValueOnce({ ok: true });

    const { result } = renderHook(() => useRelationship('user-456', 'NOT_FOLLOWING'));

    let hookResolutionPass;
    await act(async () => {
      hookResolutionPass = await result.current.executeRelationshipAction('POST', 'REQUEST_SENT');
    });

    expect(hookResolutionPass).toBe(true);
    expect(result.current.relationship).toBe('REQUEST_SENT');
    expect(customFetch).toHaveBeenCalledWith('/api/users/user-456/follow', { method: 'POST' });
  });

  it('triggers a safety block fallback and returns false if the server rejects the packet', async () => {
    vi.mocked(customFetch).mockResolvedValueOnce({ ok: false });

    const { result } = renderHook(() => useRelationship('user-456', 'REQUEST_SENT'));

    let hookResolutionPass;
    await act(async () => {
      hookResolutionPass = await result.current.executeRelationshipAction('DELETE', 'NOT_FOLLOWING');
    });

    expect(hookResolutionPass).toBe(false);
    expect(result.current.relationship).toBe('REQUEST_SENT');
    expect(window.alert).toHaveBeenCalled();
  });
});
