'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StepNav from '@/components/StepNav';
import { getFormState, clearFormState } from '@/lib/formState';
import { buildEstimatePayload, postEstimate } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';
import type { FormState } from '@/types/estimate';

function formatFeet(ft: number) {
  return `${Math.round(ft).toLocaleString()} ft`;
}

const CONSTRUCTION_LABELS: Record<string, string> = {
  underground: 'Underground',
  overhead: 'Overhead',
  other: 'Other',
};

const WORK_TYPE_LABELS: Record<string, string> = {
  'flagging': 'Flagging',
  'lane-closure': 'Lane Closure',
};

export default function ReviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState<FormState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const state = getFormState();
    setForm(state);
  }, []);

  const handleSubmit = async () => {
    if (!form || !user) return;

    setSubmitting(true);
    setError('');

    try {
      const idToken = await user.getIdToken();
      const idTokenResult = await user.getIdTokenResult();
      const customerOrg = (idTokenResult.claims.org as string) || 'unknown';

      const payload = buildEstimatePayload(form, customerOrg);
      const { transactionId } = await postEstimate(payload, idToken);

      clearFormState();
      router.push(`/inbox?new=${transactionId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setError(msg);
      setSubmitting(false);
    }
  };

  if (!form) return null;

  return (
    <div className="flex flex-col flex-1">
      <StepNav currentStep={4} hideNext />

      <div className="flex-1 px-4 pb-6 space-y-4">
        {/* Summary */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Job Summary</div>
          </div>
          <div className="divide-y divide-gray-100">
            <Row label="Work Order" value={form.workOrderId || '—'} />
            <Row label="Address" value={form.address || '—'} />
            <Row label="Time" value={form.timeOfDay || '—'} />
            <Row label="Construction" value={CONSTRUCTION_LABELS[form.constructionType] || form.constructionType || '—'} />
            <Row label="Work Type" value={WORK_TYPE_LABELS[form.workType ?? ''] || '—'} />
            {form.workType === 'lane-closure' && form.selectedLane && (
              <Row label="Lane" value={form.selectedLane.charAt(0).toUpperCase() + form.selectedLane.slice(1)} />
            )}
            <Row label="Direction" value={form.direction || '—'} />
            {form.distance != null && <Row label="Distance" value={formatFeet(form.distance)} />}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <div className="flex gap-2">
            <span className="text-amber-600 mt-0.5">ⓘ</span>
            <p className="text-sm text-amber-800 leading-snug">
              <strong>Draft budgetary estimate only.</strong> For a compliant TCP, order a reviewed plan from the result screen.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={handleSubmit} className="text-sm font-semibold text-red-700 mt-2 underline">
              Try again
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-1">
          <button
            onClick={() => router.push('/request/details')}
            disabled={submitting}
            className="w-full py-3.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm disabled:opacity-40"
          >
            ✏ Edit
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-[hsl(25,100%,50%)] text-white font-bold text-base disabled:opacity-70"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Generating…
              </span>
            ) : (
              '✓ Submit Request'
            )}
          </button>
        </div>

        {/* Loading overlay */}
        {submitting && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90">
            <div className="w-12 h-12 rounded-full border-4 border-[hsl(25,100%,50%)] border-t-transparent animate-spin mb-5" />
            <p className="font-semibold text-gray-900 text-lg">Generating your site configuration…</p>
            <p className="text-gray-500 text-sm mt-1">This takes about 3–5 seconds.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right max-w-[60%]">{value}</span>
    </div>
  );
}
