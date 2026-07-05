import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/verifyToken', () => ({ verifyFirebaseIdToken: vi.fn() }));

import { verifyFirebaseIdToken } from '@/lib/verifyToken';
import { GET as geocodeGET } from './route';
import { GET as reverseGET } from './reverse/route';

const mockVerify = vi.mocked(verifyFirebaseIdToken);

describe('geocode routes auth', () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it('geocode returns 401 without a valid token', async () => {
    mockVerify.mockResolvedValue(null);
    const res = await geocodeGET(new NextRequest('http://localhost/api/geocode?q=charlotte'));
    expect(res.status).toBe(401);
  });

  it('reverse returns 401 without a valid token', async () => {
    mockVerify.mockResolvedValue(null);
    const res = await reverseGET(
      new NextRequest('http://localhost/api/geocode/reverse?lat=35.2&lng=-80.8'),
    );
    expect(res.status).toBe(401);
  });

  it('geocode proceeds with a valid token', async () => {
    mockVerify.mockResolvedValue({ uid: 'uid-123' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([{ display_name: '4400 Sharon Rd', lat: '35.2', lon: '-80.8' }]), {
          status: 200,
        }),
      ),
    );
    const res = await geocodeGET(new NextRequest('http://localhost/api/geocode?q=sharon'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0].display_name).toBe('4400 Sharon Rd');
  });
});
