import { NextRequest } from 'next/server';
import { verifyFirebaseIdToken } from '@/lib/verifyToken';

const TIMEOUT_MS = 10000;

export async function POST(request: NextRequest) {
  const user = await verifyFirebaseIdToken(request.headers.get('authorization'));
  if (!user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const svc1Url = process.env.SVC1_ENRICH_URL;
  if (!svc1Url) {
    return new Response(JSON.stringify({ error: 'SVC1_ENRICH_URL not configured' }), { status: 503 });
  }

  let lat: number, lon: number;
  try {
    ({ lat, lon } = await request.json());
    if (lat == null || lon == null) throw new Error('missing coords');
  } catch {
    return new Response(JSON.stringify({ error: 'lat and lon required' }), { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const apiKey = process.env.SERVICE_AUTH_KEY;
    const res = await fetch(`${svc1Url}?lat=${lat}&lon=${lon}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-Service-Auth-Key': apiKey } : {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Geocoder returned ${res.status}` }), { status: 503 });
    }

    const data = await res.json();
    const ra = data.road_attributes;
    if (!ra) {
      return new Response(JSON.stringify({ road: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Map svc1-geocoder's /v1/enrich field names to the shape taCompatibility.ts expects
    return new Response(
      JSON.stringify({
        road: {
          type: ra.osm_highway_tag ?? null,
          lanes: ra.lanes ?? null,
          isOneWay: ra.is_oneway ?? false,
          isDivided: ra.is_divided ?? false,
          hasMedian: ra.median_present ?? false,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch {
    clearTimeout(timer);
    return new Response(JSON.stringify({ error: 'Geocoder unreachable' }), { status: 503 });
  }
}
