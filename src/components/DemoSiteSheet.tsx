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
            /* Scheduled: show the estimate placeholder image */
            <div className="mx-4 mt-2 mb-4 rounded-xl overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/awp-estimate-placeholder.png"
                alt="AWP Estimate"
                className="w-full h-auto"
              />
            </div>
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
