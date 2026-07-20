'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import StepNav from '@/components/StepNav';
import { getFormState, setFormState } from '@/lib/formState';
import { getIdToken } from '@/lib/auth';
import { useCallback } from 'react';
import type { PinCoord } from '@/components/PinMap';

const PinMap = dynamic(() => import('@/components/PinMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-xl mx-4">
      <div className="text-gray-400 text-sm">Loading map…</div>
    </div>
  ),
});

export default function MapPage() {
  const router = useRouter();
  const [pinA, setPinA] = useState<PinCoord | null>(null);
  const [pinB, setPinB] = useState<PinCoord | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [direction, setDirection] = useState('');
  const [initialCenter, setInitialCenter] = useState<PinCoord | undefined>(undefined);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const state = getFormState();
    setPinA(state.pinA);
    setPinB(state.pinB);
    setDistance(state.distance);
    setDirection(state.direction);

    // Geocode Step 1 address to center map
    if (state.address && !state.pinA) {
      (async () => {
        try {
          const token = await getIdToken();
          const r = await fetch(`/api/geocode?q=${encodeURIComponent(state.address)}&limit=1`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const results = (await r.json()) as Array<{ lat: string; lon: string }>;
          if (results[0]) {
            setInitialCenter({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) });
          }
        } catch {
          // best-effort map centering — ignore failures (existing behavior)
        }
      })();
    } else if (state.pinA) {
      setInitialCenter(state.pinA);
    }
  }, []);

  const handlePinsChange = (a: PinCoord | null, b: PinCoord | null, dist: number | null, dir: string) => {
    setPinA(a);
    setPinB(b);
    setDistance(dist);
    setDirection(dir);
  };

  const handleNext = () => {
    setFormState({ pinA, pinB, distance, direction });
    router.push('/request/work-type');
  };

  const isValid = pinA !== null && pinB !== null;

  const handleReset = useCallback(() => {
    setPinA(null);
    setPinB(null);
    setDistance(null);
    setDirection('');
    setResetKey((k) => k + 1); // remount PinMap to clear all Leaflet marker state
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-neutral-900">
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <PinMap
          key={resetKey}
          initialCenter={initialCenter}
          initialPinA={pinA}
          initialPinB={pinB}
          onPinsChange={handlePinsChange}
        />
        {/* Clear pins button — only shown once at least one pin is placed */}
        {(pinA || pinB) && (
          <button
            type="button"
            onClick={handleReset}
            className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-200 text-xs font-semibold px-3 py-2 rounded-full shadow-md border border-gray-200 dark:border-neutral-700 active:bg-gray-50 dark:active:bg-neutral-700"
          >
            <svg className="w-3.5 h-3.5 text-gray-500 dark:text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reset pins
          </button>
        )}
      </div>

      <StepNav currentStep={2} onNext={handleNext} nextDisabled={!isValid} />
    </div>
  );
}
