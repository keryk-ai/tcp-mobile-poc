import { NextRequest } from 'next/server';
import { verifyFirebaseIdToken } from '@/lib/verifyToken';

const PROXY_TIMEOUT_MS = 60000;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const relayUrl = process.env.RELAY_URL;
  if (!relayUrl) {
    return new Response(JSON.stringify({ error: 'RELAY_URL is not configured' }), { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const user = await verifyFirebaseIdToken(authHeader);
  if (!user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  try {
    const payload = await request.json();
    const apiKey = process.env.SERVICE_AUTH_KEY;

    const startTime = Date.now();
    const res = await fetchWithTimeout(
      `${relayUrl}/estimate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
          ...(apiKey ? { 'X-Service-Auth-Key': apiKey } : {}),
        },
        body: JSON.stringify(payload),
      },
      PROXY_TIMEOUT_MS,
    );

    const duration = Date.now() - startTime;
    const text = await res.text();

    return new Response(text, {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') || 'application/json',
        'x-proxy-duration': duration.toString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proxy request failed';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
