'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StepNav from '@/components/StepNav';
import ComingSoonSheet from '@/components/ComingSoonSheet';
import { getFormState, setFormState, clearFormState } from '@/lib/formState';
import type { WorkType, LaneSide } from '@/types/estimate';

const DIRECTIONS = ['Northbound', 'Southbound', 'Eastbound', 'Westbound', 'Northeastbound', 'Southeastbound', 'Southwestbound', 'Northwestbound'];

export default function WorkTypePage() {
  const router = useRouter();
  const [workType, setWorkType] = useState<WorkType | null>(null);
  const [selectedLane, setSelectedLane] = useState<LaneSide | null>(null);
  const [direction, setDirection] = useState('');
  const [showShoulderSheet, setShowShoulderSheet] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const state = getFormState();
    setWorkType(state.workType);
    setSelectedLane(state.selectedLane);
    setDirection(state.direction || '');
  }, []);

  const isValid =
    workType === 'flagging' ? !!direction
    : workType === 'lane-closure' ? !!selectedLane && !!direction
    : workType === 'tcp-request' ? true
    : false;

  const handleNext = () => {
    if (workType === 'tcp-request') {
      setSending(true);
      setFormState({ workType, selectedLane: null, direction: '' });
      setTimeout(() => {
        clearFormState();
        router.push('/home');
      }, 2200);
      return;
    }
    setFormState({ workType, selectedLane, direction });
    router.push('/request/review');
  };

  return (
    <div className="flex flex-col flex-1">
      <StepNav currentStep={3} onNext={handleNext} nextDisabled={!isValid} />

      <div className="flex-1 px-4 pb-6 space-y-3">
        <div className="text-sm font-semibold text-gray-700 mb-2">Work Type</div>

        {/* Flagging */}
        <button
          onClick={() => { setWorkType('flagging'); setSelectedLane(null); }}
          className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 transition-colors ${
            workType === 'flagging' ? 'border-[hsl(25,100%,50%)] bg-orange-50' : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Flagging</div>
            <div className="text-xs text-gray-500 mt-0.5">TA-10 — single flagger operation</div>
          </div>
          {workType === 'flagging' && (
            <div className="w-5 h-5 rounded-full bg-[hsl(25,100%,50%)] flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          )}
        </button>

        {/* Lane Closure */}
        <button
          onClick={() => setWorkType('lane-closure')}
          className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 transition-colors ${
            workType === 'lane-closure' ? 'border-[hsl(25,100%,50%)] bg-orange-50' : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Lane Closure</div>
            <div className="text-xs text-gray-500 mt-0.5">TA-30/30R/33 — relay resolves from road geometry</div>
          </div>
          {workType === 'lane-closure' && (
            <div className="w-5 h-5 rounded-full bg-[hsl(25,100%,50%)] flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          )}
        </button>

        {/* Complex Job: Request a TCP */}
        <button
          onClick={() => { setWorkType('tcp-request'); setSelectedLane(null); }}
          className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 transition-colors ${
            workType === 'tcp-request' ? 'border-[hsl(25,100%,50%)] bg-orange-50' : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Complex Job — Request a TCP</div>
            <div className="text-xs text-gray-500 mt-0.5">Multi-lane, intersection, or non-standard work — an AWP engineer will design your plan</div>
          </div>
          {workType === 'tcp-request' && (
            <div className="w-5 h-5 rounded-full bg-[hsl(25,100%,50%)] flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          )}
        </button>

        {/* Shoulder Closure (Coming Soon) */}
        <button
          onClick={() => setShowShoulderSheet(true)}
          className="w-full p-4 rounded-xl border-2 border-gray-200 text-left flex items-center gap-3 opacity-60"
        >
          <div className="flex-1">
            <div className="font-semibold text-gray-700">Shoulder Closure</div>
          </div>
          <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Coming Soon</span>
        </button>

        {/* Lane selection (Lane Closure only) */}
        {workType === 'lane-closure' && (
          <div className="pt-2">
            <div className="text-sm font-semibold text-gray-700 mb-2">Which lane is being closed?</div>
            <div className="grid grid-cols-2 gap-3">
              {(['left', 'right'] as LaneSide[]).map((lane) => (
                <button
                  key={lane}
                  onClick={() => setSelectedLane(lane)}
                  className={`py-3.5 rounded-xl border font-semibold text-sm capitalize transition-colors ${
                    selectedLane === lane
                      ? 'bg-[hsl(25,100%,50%)] text-white border-transparent'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  {lane === 'left' ? 'Left Lane' : 'Right Lane'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Direction (Flagging and Lane Closure only) */}
        {(workType === 'flagging' || workType === 'lane-closure') && (
          <div className="pt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Direction of travel</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-300 text-gray-900 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,50%)] focus:border-transparent"
            >
              <option value="">Select direction…</option>
              {DIRECTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {direction && (
              <p className="text-xs text-gray-400 mt-1 ml-1">Pre-filled from your pin placement</p>
            )}
          </div>
        )}

        {/* TCP request info */}
        {workType === 'tcp-request' && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-800">
            An AWP traffic engineer will review your site details and deliver a compliant, field-ready TCP within 72 hours. Tap <strong>Next</strong> to submit your request.
          </div>
        )}
      </div>

      {/* AI help link */}
      <div className="px-4 pb-6 flex justify-center">
        <button
          type="button"
          onClick={() => {
            const widget = document.querySelector('elevenlabs-convai') as HTMLElement | null;
            widget?.click();
          }}
          className="flex items-center gap-1.5 text-sm text-[hsl(25,100%,50%)] font-medium"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" />
          </svg>
          Not sure? Ask the AWP AI Expert
        </button>
      </div>

      {/* TCP request sending overlay */}
      {sending && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm gap-5">
          <div className="w-12 h-12 rounded-full border-4 border-[hsl(25,100%,50%)] border-t-transparent animate-spin" />
          <div className="text-center">
            <div className="font-bold text-gray-900 text-lg">Sending TCP Request</div>
            <div className="text-sm text-gray-500 mt-1">Your request is being sent to an AWP engineer…</div>
          </div>
        </div>
      )}

      <ComingSoonSheet
        isOpen={showShoulderSheet}
        onClose={() => setShowShoulderSheet(false)}
        title="Coming Soon"
        message="Shoulder closure support will be available in a future update. Contact AWP directly for shoulder closure traffic control plans."
      />
    </div>
  );
}
