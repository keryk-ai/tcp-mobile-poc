'use client';

import { useCallback, useId, useState } from 'react';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { getIdToken } from '@/lib/auth';

// Auth-enabled replacement for the <elevenlabs-convai> widget embed (AGE-83).
// The widget only supports public agents; with enable_auth on the agent, the
// client must exchange its Firebase ID token for a per-session conversation
// token via the gateway (/api/voice-token) and open the session itself.

interface VoiceAgentProps {
  userEmail?: string;
  org?: string;
  activeJobId?: string;
  onActiveChange?: (active: boolean) => void;
}

function VoiceAgentButton({
  userEmail = '',
  org = '',
  activeJobId = '',
  onActiveChange,
}: VoiceAgentProps) {
  const sessionId = useId().replace(/:/g, '');
  const [fetchingToken, setFetchingToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => onActiveChange?.(true),
    onDisconnect: () => onActiveChange?.(false),
    onError: () => setError('Voice session error'),
  });

  const startCall = useCallback(async () => {
    setError(null);
    setFetchingToken(true);
    try {
      const idToken = await getIdToken();
      if (!idToken) throw new Error('not signed in');

      const res = await fetch('/api/voice-token', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(`voice-token ${res.status}`);
      const { token } = await res.json();

      conversation.startSession({
        conversationToken: token,
        connectionType: 'webrtc',
        dynamicVariables: {
          user_email: userEmail,
          session_tenant_id: org,
          session_id: sessionId,
          job_id: activeJobId,
          location_lat: 0,
          location_lng: 0,
        },
      });
    } catch {
      setError('Could not start voice session');
      onActiveChange?.(false);
    } finally {
      setFetchingToken(false);
    }
  }, [conversation, userEmail, org, activeJobId, sessionId, onActiveChange]);

  const connected = conversation.status === 'connected';
  const busy = fetchingToken || conversation.status === 'connecting';

  return (
    <div className="fixed bottom-24 right-4 z-[999] flex flex-col items-end gap-2">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700 shadow">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={connected ? () => conversation.endSession() : startCall}
        disabled={busy}
        aria-label={connected ? 'End voice call' : 'Ask AWP AI'}
        className={`flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors ${
          connected ? 'bg-red-600' : 'bg-[#FF6B00]'
        } ${busy ? 'opacity-60' : ''}`}
      >
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            connected
              ? conversation.isSpeaking
                ? 'animate-pulse bg-white'
                : 'bg-white/70'
              : 'bg-white'
          }`}
        />
        {connected ? 'End call' : busy ? 'Connecting…' : 'Ask AWP AI'}
      </button>
    </div>
  );
}

export default function VoiceAgent(props: VoiceAgentProps) {
  return (
    <ConversationProvider>
      <VoiceAgentButton {...props} />
    </ConversationProvider>
  );
}
