'use client';

import { useEffect, useRef, useState } from 'react';
import type { EstimateDoc } from '@/types/estimate';
import { getJobStatus, parseJobInput } from '@/types/estimate';
import StatusBadge from './StatusBadge';
import ComingSoonSheet from './ComingSoonSheet';
import { getFirestoreDb } from '@/lib/firebase';

interface JobDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  no_road_data: "We couldn't find a road at that location. Try a nearby address.",
  pipeline_error: 'Something went wrong generating this estimate. Please try again.',
  storage_upload_failed: "The plan was generated but couldn't be saved. Please try again.",
  job_not_found: 'This estimate could not be found. Please try again.',
  unknown: 'Something went wrong. Please try again.',
};

export default function JobDetailSheet({ isOpen, onClose, jobId }: JobDetailSheetProps) {
  const [doc, setDoc] = useState<EstimateDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [comingSoon, setComingSoon] = useState<{ title: string; message: string } | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const startYRef = useRef(0);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - startYRef.current;
    if (delta > 80) onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
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
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="font-bold text-gray-900 text-base">
              {input.workOrderId || jobId.slice(0, 8)}
            </div>
            <div className="text-xs text-gray-500">{input.location?.address || ''}</div>
          </div>
          <StatusBadge status={status} small />
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 pb-safe">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 rounded-full border-4 border-[hsl(25,100%,50%)] border-t-transparent animate-spin" />
              <p className="text-gray-600 text-sm">Loading site…</p>
            </div>
          )}

          {!loading && status === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 px-6">
              <div className="w-10 h-10 rounded-full border-4 border-[hsl(25,100%,50%)] border-t-transparent animate-spin" />
              <p className="text-gray-900 font-semibold text-center">Generating your site configuration…</p>
              <p className="text-gray-500 text-sm text-center">This takes about 3–5 seconds.</p>
            </div>
          )}

          {!loading && status === 'success' && doc?.estimate_response && (
            <div>
              {/* Disclaimer */}
              <div className="mx-4 mt-3 mb-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-800 font-medium">
                  ⓘ Draft estimate — for budgeting &amp; planning only. Not a compliant TCP.
                </p>
              </div>

              {/* Plan image */}
              {doc.estimate_response.image_signed_url && (
                <div className="mx-4 mb-3 rounded-xl overflow-hidden bg-gray-100 aspect-video">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={doc.estimate_response.image_signed_url}
                    alt="Traffic control plan"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* BOM */}
              {bom && (
                <div className="px-4 mb-4">
                  <h3 className="font-bold text-gray-900 mb-3">Bill of Materials</h3>

                  {bom.signs.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Signs</div>
                      {bom.signs.map((s) => (
                        <div key={s.mutcdCode} className="flex justify-between text-sm py-1 border-b border-gray-50">
                          <span className="text-gray-700">{s.label.replace(/_/g, ' ')} ({s.mutcdCode})</span>
                          <span className="font-semibold text-gray-900">{s.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {bom.devices.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Devices</div>
                      {bom.devices.map((d) => (
                        <div key={d.type} className="flex justify-between text-sm py-1 border-b border-gray-50">
                          <span className="text-gray-700">{d.type.replace(/_/g, ' ')}</span>
                          <span className="font-semibold text-gray-900">{d.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 space-y-1">
                    {bom.totals.coneCount > 0 && (
                      <div className="flex justify-between text-sm py-1 border-b border-gray-50">
                        <span className="text-gray-700">Cones</span>
                        <span className="font-semibold text-gray-900">{bom.totals.coneCount}</span>
                      </div>
                    )}
                    {bom.totals.standCount > 0 && (
                      <div className="flex justify-between text-sm py-1 border-b border-gray-50">
                        <span className="text-gray-700">Sign Stands</span>
                        <span className="font-semibold text-gray-900">{bom.totals.standCount}</span>
                      </div>
                    )}
                    {bom.totals.sandbagCount > 0 && (
                      <div className="flex justify-between text-sm py-1 border-b border-gray-50">
                        <span className="text-gray-700">Sandbags</span>
                        <span className="font-semibold text-gray-900">{bom.totals.sandbagCount}</span>
                      </div>
                    )}
                    {bom.totals.flaggerCount > 0 && (
                      <div className="flex justify-between text-sm py-1 border-b border-gray-50">
                        <span className="text-gray-700">Flaggers</span>
                        <span className="font-semibold text-gray-900">{bom.totals.flaggerCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="px-4 pb-4 space-y-3">
                {doc.estimate_response.image_signed_url && (
                  <a
                    href={doc.estimate_response.image_signed_url}
                    download={`tcp-${jobId.slice(0, 8)}.${doc.estimate_response.image_storage_path?.split('.').pop() ?? 'jpg'}`}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm"
                  >
                    ⬇ Download Image
                  </a>
                )}
                <button
                  onClick={() => setComingSoon({ title: 'Coming Soon', message: 'Pricing quotes will be available in a future update. Contact AWP directly to request a quote.' })}
                  className="w-full py-3.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm"
                >
                  💰 Quote
                </button>
                <button
                  onClick={() => setComingSoon({ title: 'Coming Soon', message: 'TCP ordering will be available in a future update. An AWP traffic engineer will review your location and deliver a compliant, field-ready plan within 72 hours.' })}
                  className="w-full py-3.5 rounded-xl bg-[hsl(25,100%,50%)] text-white font-semibold text-sm"
                >
                  📋 Order a Reviewed TCP
                </button>
                <button
                  onClick={() => setComingSoon({ title: 'Coming Soon', message: 'Job scheduling will be available in a future update. Contact AWP directly to schedule your traffic control setup.' })}
                  className="w-full py-3.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm"
                >
                  📅 Schedule
                </button>
              </div>

              {/* Metadata footer */}
              {taCode && (
                <div className="px-4 pb-6 text-xs text-gray-400 space-y-0.5">
                  <div>{taCode} · {input.work?.dynamicFields?.direction}</div>
                  {input.location?.address && <div>{input.location.address}</div>}
                </div>
              )}
            </div>
          )}

          {!loading && status === 'error' && (
            <div className="flex flex-col items-center py-12 px-6 gap-4">
              <div className="text-4xl">⚠️</div>
              <h3 className="font-bold text-gray-900 text-center">Couldn&apos;t generate this site configuration.</h3>
              <p className="text-gray-600 text-sm text-center">
                {ERROR_MESSAGES[doc?.estimate_response?.failure_reason ?? 'unknown']}
              </p>
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-xl bg-[hsl(25,100%,50%)] text-white font-semibold"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      {comingSoon && (
        <ComingSoonSheet
          isOpen
          onClose={() => setComingSoon(null)}
          title={comingSoon.title}
          message={comingSoon.message}
        />
      )}

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
