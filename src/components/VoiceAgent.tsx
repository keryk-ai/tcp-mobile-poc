'use client';

import { useCallback, useId, useState, type SVGProps } from 'react';
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
  /** 'floating' (default): fixed pill, used on Home and the request wizard.
   *  'embedded': large inline call orb for the AI tab's own screen. Same
   *  session/auth logic either way — only the outer chrome differs. */
  variant?: 'floating' | 'embedded';
}

function VoiceAgentButton({
  userEmail = '',
  org = '',
  activeJobId = '',
  onActiveChange,
  variant = 'floating',
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

  if (variant === 'embedded') {
    return (
      <div className="flex flex-col items-center gap-6">
        {!connected ? (
          <button
            type="button"
            onClick={startCall}
            disabled={busy}
            aria-label="Ask AWP AI"
            className={`w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 bg-[hsl(25,100%,50%)] active:opacity-85 ${
              busy ? 'opacity-60' : ''
            }`}
          >
            <MicIcon className="w-10 h-10 text-white" />
            <span className="text-white font-bold text-sm">
              {busy ? 'Connecting…' : 'Ask AWP AI'}
            </span>
          </button>
        ) : (
          <div
            className={`w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 ${
              conversation.isSpeaking ? 'bg-emerald-500' : 'bg-[hsl(25,100%,50%)]'
            }`}
          >
            <MicIcon className="w-10 h-10 text-white" />
            <span className="text-white font-bold text-sm">
              {conversation.isSpeaking ? 'Speaking…' : 'Listening…'}
            </span>
          </div>
        )}

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        {connected && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => conversation.setMuted(!conversation.isMuted)}
              className="px-5 py-3 rounded-xl border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-200 font-semibold text-sm"
            >
              {conversation.isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button
              type="button"
              onClick={() => conversation.endSession()}
              className="px-5 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm active:opacity-85"
            >
              End Conversation
            </button>
          </div>
        )}
      </div>
    );
  }

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

function MicIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M192 448h128M384 208v32c0 70.4-57.6 128-128 128h0c-70.4 0-128-57.6-128-128v-32M256 368v80" />
      <path d="M256 64a63.68 63.68 0 00-64 64v111c0 35.2 29 65 64 65s64-29 64-65V128c0-36-28-64-64-64z" />
    </svg>
  );
}

export default function VoiceAgent(props: VoiceAgentProps) {
  return (
    <ConversationProvider>
      <VoiceAgentButton {...props} />
    </ConversationProvider>
  );
}
