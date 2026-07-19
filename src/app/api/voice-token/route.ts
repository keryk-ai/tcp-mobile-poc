import { NextRequest } from 'next/server';
import { verifyFirebaseIdToken } from '@/lib/verifyToken';

// Mints a short-lived ElevenLabs conversation token (WebRTC) for the
// auth-enabled voice agent. The xi-api-key never leaves the server; the
// client exchanges its Firebase ID token for a per-session conversation
// token and passes it to startSession({ conversationToken }). (AGE-83)

const TIMEOUT_MS = 10000;
const DEFAULT_AGENT_ID = 'agent_8301kw2ea0h1ex0af3yjjee8kwef';

export async function GET(request: NextRequest) {
  const user = await verifyFirebaseIdToken(request.headers.get('authorization'));
  if (!user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured' }), {
      status: 503,
    });
  }

  const agentId =
    process.env.AWP_AGENT_ID ?? process.env.NEXT_PUBLIC_AWP_AGENT_ID ?? DEFAULT_AGENT_ID;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
      { headers: { 'xi-api-key': apiKey }, signal: controller.signal },
    );
    clearTimeout(timer);

    if (!res.ok) {
      // Upstream detail (key validity, agent config) stays server-side.
      console.error(`voice-token: ElevenLabs returned ${res.status} for uid ${user.uid}`);
      return new Response(JSON.stringify({ error: 'token service unavailable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { token } = await res.json();
    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch {
    clearTimeout(timer);
    return new Response(JSON.stringify({ error: 'token service unavailable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
