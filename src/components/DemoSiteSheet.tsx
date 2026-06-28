'use client';

import { useRef } from 'react';
import type { DemoSite } from '@/lib/demoData';
import AWPDocumentView from './AWPDocumentView';

interface DemoSiteSheetProps {
  site: DemoSite;
  onClose: () => void;
}

export default function DemoSiteSheet({ site, onClose }: DemoSiteSheetProps) {
  const startYRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches[0].clientY - startYRef.current > 80) onClose();
  };

  const isCompleted = site.type === 'completed';

  return (
    <div className="fixed inset-0 z-40 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div
        className="relative w-full bg-white rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col"
        style={{ animation: 'slideUp 0.3s ease-out' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 shrink-0 active:bg-gray-200"
            aria-label="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-900 text-base truncate">Job {site.jobName}</div>
            <div className="text-xs text-gray-500 truncate">{site.address}, {site.city}</div>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full border font-semibold px-2 py-0.5 text-xs ${
            isCompleted
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {isCompleted ? 'Completed' : 'Scheduled'}
          </span>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 pb-safe">
          {/* Status banner */}
          <div className={`mx-4 mt-3 mb-1 p-3 rounded-xl border text-sm font-medium ${
            isCompleted
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
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
                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Weather Forecast</span>
                      <span className="text-xs text-gray-400">· {site.scheduledDate}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{site.context.weather.icon}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-sm">{site.context.weather.condition}</div>
                        <div className="text-xs text-gray-500">High {site.context.weather.tempHigh}° · Low {site.context.weather.tempLow}° · Wind {site.context.weather.wind}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{site.context.weather.precipitation}</div>
                      </div>
                    </div>
                    {site.context.weather.advisory && (
                      <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-800 font-medium">
                        ⚠ {site.context.weather.advisory}
                      </div>
                    )}
                  </div>

                  {/* Nearby work */}
                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nearby Work Activity</span>
                    </div>
                    <div className="space-y-2">
                      {site.context.nearbyWork.map((w, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-base mt-0.5">🚧</span>
                          <div>
                            <div className="text-xs font-semibold text-gray-800">{w.company} <span className="font-normal text-gray-400">· {w.distance}</span></div>
                            <div className="text-xs text-gray-600">{w.description}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{w.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Restrictions */}
                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Site Restrictions & Requirements</span>
                    </div>
                    <div className="space-y-2">
                      {site.context.restrictions.map((r, i) => (
                        <div key={i} className={`p-2 rounded-lg border text-xs ${
                          r.impact === 'high' ? 'bg-red-50 border-red-100 text-red-800' :
                          r.impact === 'medium' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                          'bg-gray-50 border-gray-100 text-gray-700'
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
              <div className="mx-4 mt-3 mb-4 rounded-xl overflow-hidden border border-gray-200">
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Estimate · {site.documentId}</span>
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
        </div>
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
