'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import AppShell from '@/components/AppShell';
import VoiceAgent from '@/components/VoiceAgent';

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
    <AppShell hideTabBar>
      <div className="flex flex-col flex-1 min-h-0">
        <div className="px-4 pt-safe pt-4 pb-2">
          <h1 className="text-base font-bold text-gray-900 dark:text-white">Request a Site</h1>
        </div>
        <div className="flex-1 flex flex-col min-h-0">{children}</div>

        <VoiceAgent
          userEmail={user?.email ?? ''}
          org={userOrg}
        />
      </div>
    </AppShell>
  );
}
