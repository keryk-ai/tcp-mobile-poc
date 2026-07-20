'use client';

import { useEffect, useRef, useState } from 'react';
import ScheduleCalendarSheet from './ScheduleCalendarSheet';
import type { EstimateDoc } from '@/types/estimate';
import { getJobStatus, parseJobInput } from '@/types/estimate';
import StatusBadge from './StatusBadge';
import ComingSoonSheet from './ComingSoonSheet';
import Sheet from './Sheet';
import { getFirestoreDb } from '@/lib/firebase';

interface JobDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  no_road_data: "We couldn't find a road at that location. Try a nearby address.",
  pipeline_error: 'Something went wrong generating this estimate. Please try again.',
  storage_upload_failed: "The estimate was generated but couldn't be saved. Please try again.",
  job_not_found: 'This estimate could not be found. Please try again.',
  unknown: 'Something went wrong. Please try again.',
};

export default function JobDetailSheet({ isOpen, onClose, jobId }: JobDetailSheetProps) {
  const [doc, setDoc] = useState<EstimateDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [comingSoon, setComingSoon] = useState<{ title: string; message: string } | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isOpen || !jobId) return;

    setLoading(true);
    setDoc(null);

    const subscribe = async () => {
      const db = await getFirestoreDb();
      if (!db) { setLoading(false); return; }

      const { collection, doc: firestoreDoc, onSnapshot } = await import('firebase/firestore');
      const ref = firestoreDoc(collection(db, 'tcp_estimates'), jobId);

      unsubRef.current = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          setDoc({ id: snap.id, ...snap.data() } as EstimateDoc);
        }
        setLoading(false);
      });
    };

    subscribe();

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [isOpen, jobId]);

  if (!isOpen) return null;

  const status = doc ? getJobStatus(doc) : 'processing';
  const input = doc ? parseJobInput(doc) : {};
  const bom = doc?.estimate_response?.bom;
  const taCode = doc?.metadata?.rulesContext?.taCode;

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
        <p className="font-bold text-gray-900 dark:text-white text-base truncate">
          {input.workOrderId || jobId.slice(0, 8)}
        </p>
        <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">{input.location?.address || ''}</p>
      </div>
      <StatusBadge status={status} small />
    </div>
  );

  return (
    <>
      <Sheet onClose={onClose} maxHeight="92vh" header={header}>
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-[hsl(25,100%,50%)] border-t-transparent animate-spin" />
            <p className="text-gray-600 dark:text-neutral-400 text-sm">Loading site…</p>
          </div>
        )}

        {!loading && status === 'processing' && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 px-6">
            <div className="w-10 h-10 rounded-full border-4 border-[hsl(25,100%,50%)] border-t-transparent animate-spin" />
            <p className="text-gray-900 dark:text-white font-semibold text-center">Generating your site configuration…</p>
            <p className="text-gray-500 dark:text-neutral-400 text-sm text-center">This takes about 3–5 seconds.</p>
          </div>
        )}

        {!loading && status === 'success' && doc?.estimate_response && (
          <div>
            {/* Disclaimer */}
            <div className="mx-4 mt-3 mb-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                ⓘ Draft estimate — for budgeting &amp; planning only. Not a compliant TCP.
              </p>
            </div>

            {/* Job site diagram */}
            {doc.estimate_response.image_signed_url && (
              <div className="mx-4 mb-3 rounded-xl overflow-hidden bg-gray-100 dark:bg-neutral-800 aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={doc.estimate_response.image_signed_url}
                  alt="Job site diagram"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* BOM */}
            {bom && (
              <div className="px-4 mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">Bill of Materials</h3>

                {bom.signs.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Signs</div>
                    {bom.signs.map((s) => (
                      <div key={s.mutcdCode} className="flex justify-between text-sm py-1 border-b border-gray-50 dark:border-neutral-800">
                        <span className="text-gray-700 dark:text-neutral-300">{s.label.replace(/_/g, ' ')} ({s.mutcdCode})</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{s.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}

                {bom.devices.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Devices</div>
                    {bom.devices.map((d) => (
                      <div key={d.type} className="flex justify-between text-sm py-1 border-b border-gray-50 dark:border-neutral-800">
                        <span className="text-gray-700 dark:text-neutral-300">{d.type.replace(/_/g, ' ')}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{d.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-2 space-y-1">
                  {(bom.totals.coneCount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm py-1 border-b border-gray-50 dark:border-neutral-800">
                      <span className="text-gray-700 dark:text-neutral-300">Cones</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{bom.totals.coneCount}</span>
                    </div>
                  )}
                  {(bom.totals.standCount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm py-1 border-b border-gray-50 dark:border-neutral-800">
                      <span className="text-gray-700 dark:text-neutral-300">Sign Stands</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{bom.totals.standCount}</span>
                    </div>
                  )}
                  {(bom.totals.sandbagCount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm py-1 border-b border-gray-50 dark:border-neutral-800">
                      <span className="text-gray-700 dark:text-neutral-300">Sandbags</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{bom.totals.sandbagCount}</span>
                    </div>
                  )}
                  {(bom.totals.flaggerCount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm py-1 border-b border-gray-50 dark:border-neutral-800">
                      <span className="text-gray-700 dark:text-neutral-300">Flaggers</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{bom.totals.flaggerCount}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-4 pb-4 space-y-3">
              <button
                type="button"
                onClick={() => setComingSoon({ title: 'Coming Soon', message: 'Site risk analysis will be available in a future update. AWP will automatically identify hazards, flag compliance issues, and recommend mitigations for your location.' })}
                className="w-full py-3.5 rounded-xl border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-200 font-semibold text-sm"
              >
                Analyze Site Risks
              </button>
              <button
                type="button"
                onClick={() => setComingSoon({ title: 'Coming Soon', message: 'Pricing quotes will be available in a future update. Contact AWP directly to request a quote.' })}
                className="w-full py-3.5 rounded-xl border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-200 font-semibold text-sm"
              >
                Request a Quote
              </button>
              <button
                type="button"
                onClick={() => setComingSoon({ title: 'Coming Soon', message: 'TCP ordering will be available in a future update. An AWP traffic engineer will review your location and deliver compliant, field-ready job details within 72 hours.' })}
                className="w-full py-3.5 rounded-xl bg-[hsl(25,100%,50%)] text-white font-semibold text-sm"
              >
                Request a TCP
              </button>
              <button
                type="button"
                onClick={() => setShowSchedule(true)}
                className="w-full py-3.5 rounded-xl border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-200 font-semibold text-sm"
              >
                Schedule a Crew
              </button>
            </div>

            {/* Metadata footer */}
            {taCode && (
              <div className="px-4 pb-6 text-xs text-gray-400 dark:text-neutral-500 space-y-0.5">
                <div>{taCode} · {input.work?.dynamicFields?.direction}</div>
                {input.location?.address && <div>{input.location.address}</div>}
              </div>
            )}
          </div>
        )}

        {!loading && status === 'error' && (
          <div className="flex flex-col items-center py-12 px-6 gap-4">
            <div className="text-4xl">⚠️</div>
            <h3 className="font-bold text-gray-900 dark:text-white text-center">Couldn&apos;t generate this site configuration.</h3>
            <p className="text-gray-600 dark:text-neutral-400 text-sm text-center">
              {ERROR_MESSAGES[doc?.estimate_response?.failure_reason ?? 'unknown']}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-[hsl(25,100%,50%)] text-white font-semibold"
            >
              Try Again
            </button>
          </div>
        )}
      </Sheet>

      {comingSoon && (
        <ComingSoonSheet
          isOpen
          onClose={() => setComingSoon(null)}
          title={comingSoon.title}
          message={comingSoon.message}
        />
      )}

      {showSchedule && (
        <ScheduleCalendarSheet onClose={() => setShowSchedule(false)} />
      )}
    </>
  );
}
