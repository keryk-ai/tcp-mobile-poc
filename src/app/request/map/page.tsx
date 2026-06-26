'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import StepNav from '@/components/StepNav';
import { getFormState, setFormState } from '@/lib/formState';
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

  useEffect(() => {
    const state = getFormState();
    setPinA(state.pinA);
    setPinB(state.pinB);
    setDistance(state.distance);
    setDirection(state.direction);

    // Geocode Step 1 address to center map
    if (state.address && !state.pinA) {
      fetch(`/api/geocode?q=${encodeURIComponent(state.address)}&limit=1`)
        .then((r) => r.json())
        .then((results) => {
          if (results[0]) {
            setInitialCenter({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) });
          }
        })
        .catch(() => {});
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

  return (
    <div className="flex flex-col flex-1" style={{ height: 'calc(100vh - 56px)' }}>
      <StepNav currentStep={2} onNext={handleNext} nextDisabled={!isValid} />

      <div className="flex-1 overflow-hidden">
        <PinMap
          initialCenter={initialCenter}
          initialPinA={pinA}
          initialPinB={pinB}
          onPinsChange={handlePinsChange}
        />
      </div>
    </div>
  );
}
