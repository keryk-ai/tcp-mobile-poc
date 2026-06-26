'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StepNav from '@/components/StepNav';
import { getFormState, setFormState } from '@/lib/formState';
import type { TimeOfDay, ConstructionType } from '@/types/estimate';

export default function DetailsPage() {
  const router = useRouter();
  const [workOrderId, setWorkOrderId] = useState('');
  const [address, setAddress] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | ''>('');
  const [constructionType, setConstructionType] = useState<ConstructionType | ''>('');

  useEffect(() => {
    const state = getFormState();
    setWorkOrderId(state.workOrderId);
    setAddress(state.address);
    setTimeOfDay(state.timeOfDay);
    setConstructionType(state.constructionType);
  }, []);

  const isValid = workOrderId.trim() && address.trim() && timeOfDay && constructionType;

  const handleNext = () => {
    setFormState({ workOrderId: workOrderId.trim(), address: address.trim(), timeOfDay, constructionType });
    router.push('/request/map');
  };

  return (
    <div className="flex flex-col flex-1">
      <StepNav currentStep={1} onNext={handleNext} nextDisabled={!isValid} />

      <div className="flex-1 px-4 pb-6 space-y-5">
        {/* Work Order # */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Work Order #</label>
          <input
            type="text"
            value={workOrderId}
            onChange={(e) => setWorkOrderId(e.target.value)}
            placeholder="WO-2024-001"
            className="w-full px-4 py-3.5 rounded-xl border border-gray-300 text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,50%)] focus:border-transparent"
          />
        </div>

        {/* Work Address */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Work Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, Charlotte, NC"
            className="w-full px-4 py-3.5 rounded-xl border border-gray-300 text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,50%)] focus:border-transparent"
          />
        </div>

        {/* Time of Day */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Time of Day</label>
          <div className="grid grid-cols-2 gap-3">
            {(['Day', 'Night'] as TimeOfDay[]).map((t) => (
              <button
                key={t}
                onClick={() => setTimeOfDay(t)}
                className={`py-3.5 rounded-xl border font-semibold text-sm transition-colors ${
                  timeOfDay === t
                    ? 'bg-[hsl(25,100%,50%)] text-white border-transparent'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                {t === 'Day' ? '☀️' : '🌙'} {t}
              </button>
            ))}
          </div>
        </div>

        {/* Construction Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Construction Type</label>
          <div className="space-y-2">
            {([
              { value: 'underground', label: 'Underground' },
              { value: 'overhead', label: 'Overhead' },
              { value: 'other', label: 'Other' },
            ] as { value: ConstructionType; label: string }[]).map(({ value, label }) => (
              <label key={value} className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 cursor-pointer">
                <input
                  type="radio"
                  name="constructionType"
                  value={value}
                  checked={constructionType === value}
                  onChange={() => setConstructionType(value)}
                  className="w-4 h-4 accent-[hsl(25,100%,50%)]"
                />
                <span className="text-gray-800 font-medium">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
