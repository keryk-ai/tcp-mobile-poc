'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import VoiceAgent from '@/components/VoiceAgent';
import { useAuth } from '@/components/AuthContext';

// Chrome ported from tcp-mobile/src/screens/Voice.tsx (header, call orb
// sizing) — VoiceAgent itself owns all session/auth logic (AGE-83); this
// page only supplies the surrounding screen and reads back call-active
// state via onActiveChange to show the hint.
//
// The hint copy diverges from RN's ("you can use the rest of the app during
// the call... come back here to end it"): RN's tab navigator keeps every
// screen mounted, so a call there survives switching tabs. This app's
// router unmounts /ai on navigation, and the ElevenLabs SDK's
// ConversationProvider ends the session on unmount — leaving this tab
// really does end the call. Scoped to what's actually true (Morgan,
// 2026-07-20).
export default function AIPage() {
  const { user } = useAuth();
  const [userOrg, setUserOrg] = useState('');
  const [callActive, setCallActive] = useState(false);

  useEffect(() => {
    if (!user) return;
    user.getIdTokenResult().then((r) => {
      const org = r.claims.org as string | undefined;
      if (org) setUserOrg(org);
    });
  }, [user]);

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-neutral-900">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-neutral-800">
          <h1 className="font-bold text-gray-900 dark:text-white text-lg">AWP AI Expert</h1>
          <p className="text-xs text-gray-400">Voice assistant for traffic control planning</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <VoiceAgent
            variant="embedded"
            userEmail={user?.email ?? ''}
            org={userOrg}
            onActiveChange={setCallActive}
          />

          {callActive && (
            <p className="text-xs text-gray-400 text-center px-8 leading-relaxed">
              Stay on this tab during your call. Leaving this tab ends the conversation.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
