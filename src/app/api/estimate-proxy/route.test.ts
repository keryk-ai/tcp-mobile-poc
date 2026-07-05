import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/verifyToken', () => ({ verifyFirebaseIdToken: vi.fn() }));

import { verifyFirebaseIdToken } from '@/lib/verifyToken';
import { POST } from './route';

const mockVerify = vi.mocked(verifyFirebaseIdToken);

function makeRequest(authHeader?: string) {
  return new NextRequest('http://localhost/api/estimate-proxy', {
    method: 'POST',
    body: JSON.stringify({ work: {}, location: {} }),
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { authorization: authHeader } : {}),
    },
  });
}

describe('POST /api/estimate-proxy auth', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.RELAY_URL = 'http://relay.test';
  });
  afterEach(() => {
    delete process.env.RELAY_URL;
    vi.unstubAllGlobals();
  });

  it('returns 401 with no Authorization header', async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
    expect(mockVerify).not.toHaveBeenCalled(); // prefix check short-circuits
  });

  it('returns 401 when the token fails verification (previously forwarded!)', async () => {
    mockVerify.mockResolvedValue(null);
    const res = await POST(makeRequest('Bearer forged'));
    expect(res.status).toBe(401);
  });

  it('forwards to relay with the original header when the token verifies', async () => {
    mockVerify.mockResolvedValue({ uid: 'uid-123' });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ transaction_id: 'tx-1', status: 'complete' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await POST(makeRequest('Bearer real-token'));
    expect(res.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://relay.test/estimate');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer real-token');
  });
});
