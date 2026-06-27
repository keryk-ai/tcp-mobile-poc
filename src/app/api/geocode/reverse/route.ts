import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return new Response('lat and lng are required', { status: 400 });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'tcp-mobile-poc/1.0', Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);

    const data = await res.json() as {
      display_name: string;
      address?: {
        house_number?: string;
        road?: string;
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        postcode?: string;
      };
    };

    // Build a compact street address from components when available
    const a = data.address;
    let address = data.display_name;
    if (a?.road) {
      const street = [a.house_number, a.road].filter(Boolean).join(' ');
      const locality = a.city ?? a.town ?? a.village ?? '';
      const region = [locality, a.state].filter(Boolean).join(', ');
      address = [street, region, a.postcode].filter(Boolean).join(', ');
    }

    return new Response(JSON.stringify({ address }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return new Response('Failed to reverse geocode', { status: 500 });
  }
}
