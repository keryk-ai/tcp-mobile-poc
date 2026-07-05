import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firebase', () => ({
  initializeFirebase: vi.fn(),
}));

import { initializeFirebase } from '@/lib/firebase';
import { getIdToken } from '@/lib/auth';

const mockInit = vi.mocked(initializeFirebase);

describe('getIdToken', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns the token for the signed-in user', async () => {
    mockInit.mockResolvedValue({
      app: {},
      auth: { currentUser: { getIdToken: vi.fn().mockResolvedValue('tok-abc') } },
    } as never);
    expect(await getIdToken()).toBe('tok-abc');
  });

  it('returns null when nobody is signed in', async () => {
    mockInit.mockResolvedValue({ app: {}, auth: { currentUser: null } } as never);
    expect(await getIdToken()).toBeNull();
  });

  it('returns null when auth failed to initialize', async () => {
    mockInit.mockResolvedValue({ app: null, auth: null } as never);
    expect(await getIdToken()).toBeNull();
  });

  it('returns null when token retrieval throws', async () => {
    mockInit.mockResolvedValue({
      app: {},
      auth: { currentUser: { getIdToken: vi.fn().mockRejectedValue(new Error('boom')) } },
    } as never);
    expect(await getIdToken()).toBeNull();
  });
});
