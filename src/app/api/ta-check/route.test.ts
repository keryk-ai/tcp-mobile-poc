import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/verifyToken', () => ({ verifyFirebaseIdToken: vi.fn() }));

import { verifyFirebaseIdToken } from '@/lib/verifyToken';
import { POST } from './route';

const mockVerify = vi.mocked(verifyFirebaseIdToken);

function makeRequest(body: unknown, authHeader?: string) {
  return new NextRequest('http://localhost/api/ta-check', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { authorization: authHeader } : {}),
    },
  });
}

describe('POST /api/ta-check auth', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.SVC1_ENRICH_URL = 'http://geocoder.test/v1/enrich';
  });
  afterEach(() => {
    delete process.env.SVC1_ENRICH_URL;
    vi.unstubAllGlobals();
  });

  it('returns 401 with no token — even before config checks', async () => {
    delete process.env.SVC1_ENRICH_URL; // proves auth precedes the 503 config check
    mockVerify.mockResolvedValue(null);
    const res = await POST(makeRequest({ lat: 35.2, lon: -80.8 }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthorized' });
  });

  it('returns 401 when the token is invalid', async () => {
    mockVerify.mockResolvedValue(null);
    const res = await POST(makeRequest({ lat: 35.2, lon: -80.8 }, 'Bearer bad'));
    expect(res.status).toBe(401);
  });

  it('proceeds to the geocoder call with a valid token', async () => {
    mockVerify.mockResolvedValue({ uid: 'uid-123' });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ road_attributes: { osm_highway_tag: 'residential', lanes: 2 } }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await POST(makeRequest({ lat: 35.2, lon: -80.8 }, 'Bearer good'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.road.type).toBe('residential');
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
