import { NextRequest } from 'next/server';

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
}

async function nominatimSearch(q: string, limit: string): Promise<GeoResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&limit=${limit}&format=json&addressdetails=1`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'tcp-mobile-poc/1.0',
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
  const raw = await res.json() as Array<{ display_name: string; lat: string; lon: string }>;
  return raw.map((r) => ({ display_name: r.display_name, lat: r.lat, lon: r.lon }));
}

async function googleMapsSearch(q: string, limit: string): Promise<GeoResult[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return [];

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${apiKey}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Google Maps error: ${res.status}`);

  const data = await res.json() as {
    status: string;
    results: Array<{ formatted_address: string; geometry: { location: { lat: number; lng: number } } }>;
  };

  if (data.status !== 'OK') return [];

  return data.results
    .slice(0, parseInt(limit, 10))
    .map((r) => ({
      display_name: r.formatted_address,
      lat: String(r.geometry.location.lat),
      lon: String(r.geometry.location.lng),
    }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = searchParams.get('limit') || '5';

  if (!query) {
    return new Response('Query parameter is required', { status: 400 });
  }

  try {
    let results = await nominatimSearch(query, limit);
    if (results.length === 0) {
      results = await googleMapsSearch(query, limit);
    }
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return new Response('Failed to fetch geocoding data', { status: 500 });
  }
}
