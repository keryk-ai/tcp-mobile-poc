'use client';

// Presents from inside DemoSiteSheet's invoice footer (Pay button) — entirely
// simulated, no real processing or validation beyond cosmetic input limits.
import { useState } from 'react';
import Sheet from './Sheet';
import type { DemoSite } from '@/lib/demoData';

interface PaymentSheetProps {
  site: DemoSite;
  onClose: () => void;
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export default function PaymentSheet({ site, onClose }: PaymentSheetProps) {
  const [showAddCard, setShowAddCard] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const amount = fmt(site.total);

  const footer = !submitted ? (
    <div className="px-4 pb-6 pt-3 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800">
      <button
        type="button"
        onClick={() => setSubmitted(true)}
        className="w-full py-3.5 rounded-xl bg-[hsl(25,100%,50%)] text-white font-semibold text-sm active:opacity-85"
      >
        Pay {amount}
      </button>
    </div>
  ) : undefined;

  return (
    <Sheet onClose={onClose} maxHeight="85vh" zIndexClass="z-50" footer={footer}>
      {submitted ? (
        <div className="flex flex-col items-center px-6 py-16 gap-3">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <span className="text-emerald-600 dark:text-emerald-400 text-3xl">✓</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">Payment submitted</p>
          <p className="text-sm text-gray-500 dark:text-neutral-400">(Simulated — no charge was made.)</p>
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
          <div className="px-4 py-2 border-b border-gray-100 dark:border-neutral-800">
            <p className="font-bold text-gray-900 dark:text-white text-base">Payment</p>
            <p className="text-xs text-gray-400 dark:text-neutral-500">{amount}</p>
          </div>

          <div className="px-4 mt-3">
            <p className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
              Payment Method
            </p>
            <button
              type="button"
              className="w-full flex items-center gap-3 rounded-xl border-2 border-[hsl(25,100%,50%)] bg-[hsl(25,100%,97%)] dark:bg-neutral-800 p-3"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[hsl(25,100%,50%)] shrink-0" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Visa •••• 4242 (expires 12/28)
              </span>
            </button>
          </div>

          <div className="px-4 mt-3">
            <button
              type="button"
              onClick={() => setShowAddCard((v) => !v)}
              className="py-2 text-sm font-semibold text-[hsl(25,100%,50%)]"
            >
              {showAddCard ? '− Add new card' : '+ Add new card'}
            </button>

            {showAddCard && (
              <div className="flex flex-col gap-2 pb-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={19}
                  placeholder="Card number"
                  className="rounded-xl border border-gray-200 dark:border-neutral-700 dark:text-white px-3 py-2.5 text-sm placeholder:text-gray-400"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="MM/YY"
                    className="flex-1 rounded-xl border border-gray-200 dark:border-neutral-700 dark:text-white px-3 py-2.5 text-sm placeholder:text-gray-400"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="CVC"
                    className="flex-1 rounded-xl border border-gray-200 dark:border-neutral-700 dark:text-white px-3 py-2.5 text-sm placeholder:text-gray-400"
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </Sheet>
  );
}
