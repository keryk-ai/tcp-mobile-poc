'use client';

import { useEffect, useState } from 'react';
import { hasAcknowledgedAlpha, setAcknowledgedAlpha } from '@/lib/alphaAck';

// Mounted once in AppShell so every authenticated route gets it. Shown until
// the user acknowledges it (see @/lib/alphaAck). Renders nothing until the
// ack has been read client-side, so there's no flash on load.
export default function AlphaNotice() {
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    setVisible(!hasAcknowledgedAlpha());
  }, []);

  if (!visible) return null;

  const acknowledge = () => {
    setAcknowledgedAlpha();
    setVisible(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 dark:bg-black/60">
      <div className="absolute bottom-0 inset-x-0 max-w-[430px] mx-auto bg-white dark:bg-neutral-900 rounded-t-2xl px-6 pt-6 pb-10">
        <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">Alpha Demo</p>
        <p className="text-sm text-gray-600 dark:text-neutral-400 leading-5 mb-3">
          This app is designed to show how AWP can start with the TCP functionality that runs
          today, to build a portal that enables customers to order, schedule, and pay for AWP
          services, and in the future, services from AWP partners and trusted providers.
        </p>
        <p className="text-sm text-gray-600 dark:text-neutral-400 leading-5 mb-6">
          Start with &quot;Add New Site&quot; to see what is available today.
        </p>
        <button
          type="button"
          onClick={acknowledge}
          className="w-full py-3.5 rounded-xl bg-[hsl(25,100%,50%)] flex items-center justify-center"
        >
          <span className="text-white font-semibold text-sm">I Understand</span>
        </button>
      </div>
    </div>
  );
}
