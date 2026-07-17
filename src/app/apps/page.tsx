'use client';

import { useState } from 'react';
import AppShell from '@/components/AppShell';
import MarketplaceNotice from '@/components/MarketplaceNotice';
import MarketplaceOfferingSheet from '@/components/MarketplaceOfferingSheet';
import { OfferingIcon, ChevronForwardIcon } from '@/components/MarketplaceIcons';
import { MARKETPLACE_OFFERINGS, type MarketplaceOffering } from '@/lib/marketplaceData';

export default function AppsPage() {
  const [selected, setSelected] = useState<MarketplaceOffering | null>(null);

  return (
    <AppShell>
      <div className="shrink-0 px-4 pt-safe pt-4 pb-3 border-b border-gray-100 dark:border-neutral-800">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">AWP Marketplace</h1>
        <p className="text-xs text-gray-400 mt-0.5">Services provided by AWP and AWP partners.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8">
        <div className="rounded-xl bg-[hsl(25,100%,97%)] dark:bg-neutral-800 p-3.5 mb-4">
          <p className="text-sm text-gray-700 dark:text-neutral-200 leading-5">
            Once users have this app, AWP can sell add-on services from AWP or from AWP partners. AWP
            customers can add services to any job with one tap. AWP can provision partners around the work
            zone and schedule, with everything billed together on one AWP invoice.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {MARKETPLACE_OFFERINGS.map((offering) => (
            <button
              key={offering.id}
              type="button"
              onClick={() => setSelected(offering)}
              className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-neutral-700 p-3 text-left active:bg-gray-50 dark:active:bg-neutral-800"
            >
              <div className="w-12 h-12 rounded-2xl bg-[hsl(25,100%,95%)] dark:bg-neutral-700 flex items-center justify-center shrink-0">
                <OfferingIcon name={offering.icon} className="w-6 h-6 text-[hsl(25,100%,50%)]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white text-sm">{offering.name}</div>
                <div
                  className={
                    offering.firstParty
                      ? 'text-xs font-semibold text-[hsl(25,100%,50%)] mt-0.5'
                      : 'text-xs font-medium text-gray-500 dark:text-neutral-400 mt-0.5'
                  }
                >
                  by {offering.partner}
                </div>
                <div className="text-xs text-gray-400 dark:text-neutral-500 mt-0.5 truncate">{offering.tagline}</div>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span
                  className={
                    offering.firstParty
                      ? 'rounded-full px-2 py-0.5 bg-[hsl(25,100%,50%)]'
                      : 'rounded-full px-2 py-0.5 bg-gray-100 dark:bg-neutral-700'
                  }
                >
                  <span
                    className={
                      offering.firstParty
                        ? 'text-[10px] font-bold text-white'
                        : 'text-[10px] font-bold text-gray-600 dark:text-neutral-300'
                    }
                  >
                    {offering.firstParty ? 'AWP' : 'PARTNER'}
                  </span>
                </span>
                <ChevronForwardIcon className="w-4 h-4 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <MarketplaceOfferingSheet offering={selected} onClose={() => setSelected(null)} />
      )}

      <MarketplaceNotice />
    </AppShell>
  );
}
