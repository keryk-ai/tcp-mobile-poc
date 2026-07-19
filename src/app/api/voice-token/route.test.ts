import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/verifyToken', () => ({ verifyFirebaseIdToken: vi.fn() }));

import { verifyFirebaseIdToken } from '@/lib/verifyToken';
import { GET } from './route';

const mockVerify = vi.mocked(verifyFirebaseIdToken);

function makeRequest(authHeader?: string) {
  return new NextRequest('http://localhost/api/voice-token', {
    method: 'GET',
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe('GET /api/voice-token', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.ELEVENLABS_API_KEY = 'xi-test-key';
    process.env.AWP_AGENT_ID = 'agent_test123';
  });
  afterEach(() => {
    delete process.env.ELEVENLABS_API_KEY;
    delete process.env.AWP_AGENT_ID;
    vi.unstubAllGlobals();
  });

  it('returns 401 with no token — even before config checks', async () => {
    delete process.env.ELEVENLABS_API_KEY; // proves auth precedes the 503 config check
    mockVerify.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthorized' });
  });

  it('returns 401 when the token is invalid', async () => {
    mockVerify.mockResolvedValue(null);
    const res = await GET(makeRequest('Bearer bad'));
    expect(res.status).toBe(401);
  });

  it('returns 503 when ELEVENLABS_API_KEY is not configured', async () => {
    delete process.env.ELEVENLABS_API_KEY;
    mockVerify.mockResolvedValue({ uid: 'uid-123' });
    const res = await GET(makeRequest('Bearer good'));
    expect(res.status).toBe(503);
  });

  it('mints a conversation token via the ElevenLabs API and returns it', async () => {
    mockVerify.mockResolvedValue({ uid: 'uid-123' });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ token: 'conv-token-abc' }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET(makeRequest('Bearer good'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ token: 'conv-token-abc' });

    // Upstream call: correct endpoint, agent_id, and xi-api-key header —
    // the key must go upstream only, never back to the client.
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      'https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=agent_test123',
    );
    expect((init.headers as Record<string, string>)['xi-api-key']).toBe('xi-test-key');

    // Tokens are per-session credentials — must not be cacheable.
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('returns 502 when the ElevenLabs API rejects the request', async () => {
    mockVerify.mockResolvedValue({ uid: 'uid-123' });
    const fetchMock = vi.fn().mockResolvedValue(new Response('nope', { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET(makeRequest('Bearer good'));
    expect(res.status).toBe(502);
    const body = await res.json();
    // Upstream failure detail stays server-side; client gets a generic error.
    expect(body).toEqual({ error: 'token service unavailable' });
  });

  it('returns 502 when the ElevenLabs API is unreachable', async () => {
    mockVerify.mockResolvedValue({ uid: 'uid-123' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const res = await GET(makeRequest('Bearer good'));
    expect(res.status).toBe(502);
  });
});
