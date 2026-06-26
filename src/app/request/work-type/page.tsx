'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StepNav from '@/components/StepNav';
import ComingSoonSheet from '@/components/ComingSoonSheet';
import { getFormState, setFormState } from '@/lib/formState';
import type { WorkType, LaneSide } from '@/types/estimate';

const DIRECTIONS = ['Northbound', 'Southbound', 'Eastbound', 'Westbound', 'Northeastbound', 'Southeastbound', 'Southwestbound', 'Northwestbound'];

export default function WorkTypePage() {
  const router = useRouter();
  const [workType, setWorkType] = useState<WorkType | null>(null);
  const [selectedLane, setSelectedLane] = useState<LaneSide | null>(null);
  const [direction, setDirection] = useState('');
  const [showShoulderSheet, setShowShoulderSheet] = useState(false);

  useEffect(() => {
    const state = getFormState();
    setWorkType(state.workType);
    setSelectedLane(state.selectedLane);
    setDirection(state.direction || '');
  }, []);

  const isValid =
    workType === 'flagging'
      ? !!direction
      : workType === 'lane-closure'
      ? !!selectedLane && !!direction
      : false;

  const handleNext = () => {
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
          <span className="text-2xl">🚩</span>
          <div>
            <div className="font-semibold text-gray-900">Flagging</div>
            <div className="text-xs text-gray-500 mt-0.5">TA-10 — single flagger operation</div>
          </div>
          {workType === 'flagging' && (
            <div className="ml-auto w-5 h-5 rounded-full bg-[hsl(25,100%,50%)] flex items-center justify-center">
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
          <span className="text-2xl">🚧</span>
          <div>
            <div className="font-semibold text-gray-900">Lane Closure</div>
            <div className="text-xs text-gray-500 mt-0.5">TA-30/30R/33 — relay resolves from road geometry</div>
          </div>
          {workType === 'lane-closure' && (
            <div className="ml-auto w-5 h-5 rounded-full bg-[hsl(25,100%,50%)] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          )}
        </button>

        {/* Shoulder Closure (Coming Soon) */}
        <button
          onClick={() => setShowShoulderSheet(true)}
          className="w-full p-4 rounded-xl border-2 border-gray-200 text-left flex items-center gap-3 opacity-60"
        >
          <span className="text-2xl">🛞</span>
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
                  {lane === 'left' ? '← Left' : 'Right →'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Direction */}
        {workType && (
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
      </div>

      <ComingSoonSheet
        isOpen={showShoulderSheet}
        onClose={() => setShowShoulderSheet(false)}
        title="Coming Soon"
        message="Shoulder closure support will be available in a future update. Contact AWP directly for shoulder closure traffic control plans."
      />
    </div>
  );
}
