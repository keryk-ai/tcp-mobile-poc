'use client';

import { useEffect, useState } from 'react';
import { hasAcknowledgedMarketplace, setAcknowledgedMarketplace } from '@/lib/marketplaceAck';

// Mounted in the Apps/Marketplace screen (Task 4) and shown on first visit
// until acknowledged (see @/lib/marketplaceAck). Mirrors AlphaNotice: renders
// nothing until the ack has been read client-side, so there's no flash.
export default function MarketplaceNotice() {
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    setVisible(!hasAcknowledgedMarketplace());
  }, []);

  if (!visible) return null;

  const acknowledge = () => {
    setAcknowledgedMarketplace();
    setVisible(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 dark:bg-black/60">
      <div className="absolute bottom-0 inset-x-0 max-w-[430px] mx-auto bg-white dark:bg-neutral-900 rounded-t-2xl px-6 pt-6 pb-10">
        <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">About the Marketplace</p>
        <p className="text-sm text-gray-600 dark:text-neutral-400 leading-5 mb-3">
          This marketplace is a preview of what becomes possible once AWP customers manage their
          TCP work in the app.
        </p>
        <p className="text-sm text-gray-600 dark:text-neutral-400 leading-5 mb-3">
          From that foundation, AWP can add value to every job and drive upscopes through
          ecosystem partners.
        </p>
        <p className="text-sm text-gray-600 dark:text-neutral-400 leading-5 mb-6">
          All companies shown are fictitious except AWP, and the offerings are examples of what
          is possible.
        </p>
        <button
          type="button"
          onClick={acknowledge}
          className="w-full py-3.5 rounded-xl bg-[hsl(25,100%,50%)] flex items-center justify-center"
        >
          <span className="text-white font-semibold text-sm">Got It</span>
        </button>
      </div>
    </div>
  );
}
