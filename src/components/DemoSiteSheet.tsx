'use client';

import { useState } from 'react';
import type { DemoSite } from '@/lib/demoData';
import AWPDocumentView from './AWPDocumentView';
import Sheet from './Sheet';
import ComingSoonSheet from './ComingSoonSheet';
import PaymentSheet from './PaymentSheet';

interface DemoSiteSheetProps {
  site: DemoSite;
  onClose: () => void;
}

export default function DemoSiteSheet({ site, onClose }: DemoSiteSheetProps) {
  const isCompleted = site.type === 'completed';
  const [showApproved, setShowApproved] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // Invoice actions (simulated): shown only for completed sites, alongside
  // the invoice rendered below via AWPDocumentView.
  const footer = isCompleted ? (
    <div className="flex gap-3 px-4 pb-6 pt-3 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800">
      <button
        type="button"
        onClick={() => setShowApproved(true)}
        className="flex-1 py-3.5 rounded-xl border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-200 font-semibold text-sm active:bg-gray-50 dark:active:bg-neutral-800"
      >
        Approve
      </button>
      <button
        type="button"
        onClick={() => setShowPayment(true)}
        className="flex-1 py-3.5 rounded-xl bg-[hsl(25,100%,50%)] text-white font-semibold text-sm active:opacity-85"
      >
        Pay
      </button>
    </div>
  ) : undefined;

  const header = (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 dark:border-neutral-800">
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 shrink-0 active:bg-gray-200 dark:active:bg-neutral-700"
        aria-label="Close"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 dark:text-white text-base truncate">Job {site.jobName}</p>
        <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">{site.address}, {site.city}</p>
      </div>
      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${
        isCompleted
          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
          : 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
      }`}>
        {isCompleted ? 'Completed' : 'Scheduled'}
      </span>
    </div>
  );

  return (
    <>
      <Sheet onClose={onClose} maxHeight="92vh" header={header} footer={footer}>
        {/* Status banner */}
        <div className={`mx-4 mt-3 mb-1 p-3 rounded-xl border text-sm font-medium ${
          isCompleted
            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
            : 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
        }`}>
          {isCompleted
            ? `Work completed ${site.completedDate}`
            : `Scheduled for ${site.scheduledDate} at ${site.scheduledTime}`
          }
        </div>

        {isCompleted ? (
          <AWPDocumentView site={site} mode="invoice" />
        ) : (
          <>
            {/* Site context cards */}
            {site.context && (
              <div className="px-4 mt-2 space-y-2">
                {/* Weather */}
                <div className="rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Weather Forecast</span>
                    <span className="text-xs text-gray-400 dark:text-neutral-500">· {site.scheduledDate}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{site.context.weather.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">{site.context.weather.condition}</div>
                      <div className="text-xs text-gray-500 dark:text-neutral-400">High {site.context.weather.tempHigh}° · Low {site.context.weather.tempLow}° · Wind {site.context.weather.wind}</div>
                      <div className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">{site.context.weather.precipitation}</div>
                    </div>
                  </div>
                  {site.context.weather.advisory && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 font-medium">
                      ⚠ {site.context.weather.advisory}
                    </div>
                  )}
                </div>

                {/* Nearby work */}
                <div className="rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Nearby Work Activity</span>
                  </div>
                  <div className="space-y-2">
                    {site.context.nearbyWork.map((w, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-base mt-0.5">🚧</span>
                        <div>
                          <div className="text-xs font-semibold text-gray-800 dark:text-neutral-200">{w.company} <span className="font-normal text-gray-400 dark:text-neutral-500">· {w.distance}</span></div>
                          <div className="text-xs text-gray-600 dark:text-neutral-300">{w.description}</div>
                          <div className="text-xs text-gray-400 dark:text-neutral-500 mt-0.5">{w.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Restrictions */}
                <div className="rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Site Restrictions & Requirements</span>
                  </div>
                  <div className="space-y-2">
                    {site.context.restrictions.map((r, i) => (
                      <div key={i} className={`p-2 rounded-lg border text-xs ${
                        r.impact === 'high' ? 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800 text-red-800 dark:text-red-300' :
                        r.impact === 'medium' ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800 text-amber-800 dark:text-amber-300' :
                        'bg-gray-50 dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 text-gray-700 dark:text-neutral-300'
                      }`}>
                        <div className="font-semibold mb-0.5">{r.source}</div>
                        <div>{r.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Estimate placeholder */}
            <div className="mx-4 mt-3 mb-4 rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700">
              <div className="px-3 py-2 border-b border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800">
                <span className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Estimate · {site.documentId}</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/awp-estimate-placeholder.png"
                alt="AWP Estimate"
                className="w-full h-auto"
              />
            </div>
          </>
        )}
      </Sheet>

      <ComingSoonSheet
        isOpen={showApproved}
        onClose={() => setShowApproved(false)}
        title="Invoice Approved"
        message={`Invoice ${site.documentId} has been approved. (Simulated for demo purposes.)`}
      />

      {showPayment && (
        <PaymentSheet site={site} onClose={() => setShowPayment(false)} />
      )}
    </>
  );
}
