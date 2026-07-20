'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import StepNav from '@/components/StepNav';
import { getFormState, setFormState } from '@/lib/formState';
import { getIdToken } from '@/lib/auth';
import type { TimeOfDay, ConstructionType } from '@/types/estimate';

type GpsState = 'idle' | 'loading' | 'error';

export default function DetailsPage() {
  const router = useRouter();
  const [workOrderId, setWorkOrderId] = useState('');
  const [address, setAddress] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | ''>('');
  const [constructionType, setConstructionType] = useState<ConstructionType | ''>('');
  const [gpsState, setGpsState] = useState<GpsState>('idle');
  const [gpsError, setGpsError] = useState('');

  useEffect(() => {
    const state = getFormState();
    setWorkOrderId(state.workOrderId);
    setAddress(state.address);
    setTimeOfDay(state.timeOfDay);
    setConstructionType(state.constructionType);
  }, []);

  const handleUseLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsState('error');
      setGpsError('GPS not supported on this device');
      return;
    }
    setGpsState('loading');
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const token = await getIdToken();
          const res = await fetch(
            `/api/geocode/reverse?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} },
          );
          if (!res.ok) throw new Error('reverse geocode failed');
          const { address: resolved } = await res.json() as { address: string };
          setAddress(resolved);
          setGpsState('idle');
        } catch {
          setGpsState('error');
          setGpsError('Could not resolve address from location');
        }
      },
      (err) => {
        setGpsState('error');
        setGpsError(
          err.code === err.PERMISSION_DENIED
            ? 'Location access denied'
            : 'Could not get location'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const isValid = workOrderId.trim() && address.trim() && timeOfDay && constructionType;

  const handleNext = () => {
    setFormState({ workOrderId: workOrderId.trim(), address: address.trim(), timeOfDay, constructionType });
    router.push('/request/map');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-neutral-900">
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-5">
        {/* Work Order # */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Work Order #</label>
          <input
            type="text"
            value={workOrderId}
            onChange={(e) => setWorkOrderId(e.target.value)}
            placeholder="WO-2024-001"
            className="w-full px-4 py-3.5 rounded-xl border border-gray-300 dark:border-neutral-700 text-gray-900 dark:text-white dark:bg-neutral-800 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,50%)] focus:border-transparent"
          />
        </div>

        {/* Work Address */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Work Address</label>
            <button
              type="button"
              onClick={handleUseLocation}
              disabled={gpsState === 'loading'}
              className="flex items-center gap-1.5 text-sm font-medium text-[hsl(25,100%,50%)] disabled:opacity-50"
            >
              {gpsState === 'loading' ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Locating…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                  </svg>
                  Use my location
                </>
              )}
            </button>
          </div>
          <input
            type="text"
            value={address}
            onChange={(e) => { setAddress(e.target.value); setGpsState('idle'); setGpsError(''); }}
            placeholder="123 Main St, Charlotte, NC"
            className="w-full px-4 py-3.5 rounded-xl border border-gray-300 dark:border-neutral-700 text-gray-900 dark:text-white dark:bg-neutral-800 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,50%)] focus:border-transparent"
          />
          {gpsState === 'error' && (
            <p className="mt-1.5 text-xs text-red-500">{gpsError}</p>
          )}
          <p className="mt-1.5 text-xs text-gray-400 dark:text-neutral-500">
            System uses the MUTCD ruleset. State DOT and local jurisdiction rules will be added over time.
          </p>
        </div>

        {/* Time of Day */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Time of Day</label>
          <div className="grid grid-cols-2 gap-3">
            {(['Day', 'Night'] as TimeOfDay[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeOfDay(t)}
                className={`py-3.5 rounded-xl border font-semibold text-sm transition-colors ${
                  timeOfDay === t
                    ? 'bg-[hsl(25,100%,50%)] text-white border-transparent'
                    : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-neutral-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Construction Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Construction Type</label>
          <div className="space-y-2">
            {([
              { value: 'underground', label: 'Underground' },
              { value: 'overhead', label: 'Overhead' },
              { value: 'other', label: 'Other' },
            ] as { value: ConstructionType; label: string }[]).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setConstructionType(value)}
                aria-pressed={constructionType === value}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-neutral-700 text-left"
              >
                <span
                  className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                    constructionType === value
                      ? 'border-[hsl(25,100%,50%)] bg-[hsl(25,100%,50%)]'
                      : 'border-gray-300 dark:border-neutral-600'
                  }`}
                />
                <span className="text-gray-800 dark:text-gray-100 font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <StepNav currentStep={1} onNext={handleNext} nextDisabled={!isValid} />
    </div>
  );
}
