'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import ElevenLabsWidget from '@/components/ElevenLabsWidget';

const AWP_AGENT_ID = process.env.NEXT_PUBLIC_AWP_AGENT_ID ?? 'agent_8301kw2ea0h1ex0af3yjjee8kwef';

export default function RequestLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userOrg, setUserOrg] = useState('');

  useEffect(() => {
    if (!user) return;
    user.getIdTokenResult().then((r) => {
      const org = r.claims.org as string | undefined;
      if (org) setUserOrg(org);
    });
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="px-4 pt-safe pt-4 pb-2">
        <h1 className="text-base font-bold text-gray-900">Request a Site</h1>
      </div>
      {children}

      <ElevenLabsWidget
        agentId={AWP_AGENT_ID}
        userEmail={user?.email ?? ''}
        org={userOrg}
      />
    </div>
  );
}
