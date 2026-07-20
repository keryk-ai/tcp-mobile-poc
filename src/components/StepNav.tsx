'use client';

import { useRouter } from 'next/navigation';

interface StepNavProps {
  currentStep: 1 | 2 | 3 | 4;
  onNext?: () => void;
  onBack?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  hideNext?: boolean;
}

const STEP_LABELS = ['Details', 'Map', 'Type', 'Review'];
const STEP_PATHS = [
  '/request/details',
  '/request/map',
  '/request/work-type',
  '/request/review',
];

export default function StepNav({
  currentStep,
  onNext,
  onBack,
  nextDisabled = false,
  nextLabel = 'Next →',
  hideNext = false,
}: StepNavProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (currentStep === 1) {
      router.push('/home');
    } else {
      router.push(STEP_PATHS[currentStep - 2]);
    }
  };

  return (
    <div className="w-full border-t border-gray-100 dark:border-neutral-800">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 py-3">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isDone = stepNum < currentStep;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-3 h-3 rounded-full transition-colors ${
                    isActive
                      ? 'bg-[hsl(25,100%,50%)]'
                      : isDone
                      ? 'bg-[hsl(25,100%,50%)] opacity-60'
                      : 'bg-gray-300'
                  }`}
                />
                <span className={`text-[10px] ${isActive ? 'text-[hsl(25,100%,50%)] font-semibold' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`w-6 h-[2px] mb-4 ${isDone ? 'bg-[hsl(25,100%,50%)] opacity-60' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 px-4 pb-safe pb-4">
        <button
          type="button"
          onClick={handleBack}
          className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-200 font-semibold text-sm active:bg-gray-50 dark:active:bg-neutral-800"
        >
          ← Back
        </button>
        {!hideNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className="flex-[2] py-3 rounded-xl bg-[hsl(25,100%,50%)] text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed active:opacity-80"
          >
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}
