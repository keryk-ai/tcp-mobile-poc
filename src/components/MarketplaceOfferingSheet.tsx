'use client';

import { useRef, useState } from 'react';
import type { MarketplaceOffering } from '@/lib/marketplaceData';
import { OfferingIcon, CheckmarkCircleIcon } from './MarketplaceIcons';

interface MarketplaceOfferingSheetProps {
  offering: MarketplaceOffering;
  onClose: () => void;
}

// Presented from the Apps tab tile list. The request flow is entirely
// simulated — see @/lib/marketplaceAck sibling notes for the surrounding
// marketplace gate.
export default function MarketplaceOfferingSheet({ offering, onClose }: MarketplaceOfferingSheetProps) {
  const [requested, setRequested] = useState(false);
  const startYRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches[0].clientY - startYRef.current > 80) onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} />

      <div
        className="relative w-full max-w-[430px] mx-auto bg-white dark:bg-neutral-900 rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col"
        style={{ animation: 'slideUp 0.3s ease-out' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto" />
        </div>

        {requested ? (
          <div className="flex flex-col items-center px-6 py-16 gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <CheckmarkCircleIcon className="w-10 h-10 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">Request received</p>
            <p className="text-sm text-gray-500 dark:text-neutral-400 text-center leading-5">
              An AWP representative will reach out to set up {offering.name} for your organization.
              <br />
              (Simulated for demo purposes.)
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 py-3.5 px-8 rounded-xl bg-[hsl(25,100%,50%)] text-white font-semibold text-sm active:opacity-85"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto flex-1">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
                <div className="w-14 h-14 rounded-2xl bg-[hsl(25,100%,95%)] dark:bg-neutral-800 flex items-center justify-center shrink-0">
                  <OfferingIcon name={offering.icon} className="w-7 h-7 text-[hsl(25,100%,50%)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 dark:text-white text-base">{offering.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={
                        offering.firstParty
                          ? 'text-xs font-semibold text-[hsl(25,100%,50%)]'
                          : 'text-xs font-medium text-gray-500 dark:text-neutral-400'
                      }
                    >
                      by {offering.partner}
                    </span>
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
                  </div>
                </div>
              </div>

              <div className="px-4 pt-3">
                <span className="inline-block rounded-full px-2.5 py-1 bg-gray-100 dark:bg-neutral-800 text-xs font-semibold text-gray-600 dark:text-neutral-300">
                  {offering.category}
                </span>
              </div>

              <div className="px-4 pt-3">
                <p className="text-sm text-gray-700 dark:text-neutral-300 leading-5">{offering.description}</p>
              </div>

              <div className="px-4 pt-4">
                <p className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                  What you get
                </p>
                <div className="flex flex-col gap-2">
                  {offering.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <CheckmarkCircleIcon className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span className="flex-1 text-sm text-gray-700 dark:text-neutral-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-4 pt-4 pb-4 flex flex-col gap-2">
                <div className="flex justify-between gap-3 rounded-xl border border-gray-200 dark:border-neutral-700 px-3 py-2.5">
                  <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400 shrink-0">Availability</span>
                  <span className="text-xs text-gray-700 dark:text-neutral-300 text-right">{offering.availability}</span>
                </div>
                <div className="flex justify-between gap-3 rounded-xl border border-gray-200 dark:border-neutral-700 px-3 py-2.5">
                  <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400 shrink-0">Pricing</span>
                  <span className="text-xs text-gray-700 dark:text-neutral-300">{offering.priceLine}</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 px-4 pb-6 pt-3 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setRequested(true)}
                className="w-full py-3.5 rounded-xl bg-[hsl(25,100%,50%)] text-white font-semibold text-sm active:opacity-85"
              >
                Request This Service
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
