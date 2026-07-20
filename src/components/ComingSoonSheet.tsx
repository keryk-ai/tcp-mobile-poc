'use client';

import Sheet from './Sheet';

interface ComingSoonSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export default function ComingSoonSheet({
  isOpen,
  onClose,
  title = 'Coming Soon',
  message,
}: ComingSoonSheetProps) {
  if (!isOpen) return null;

  return (
    <Sheet onClose={onClose} zIndexClass="z-50">
      <div className="px-6 pt-2 pb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h2>
        <p className="text-gray-600 dark:text-neutral-300 leading-relaxed mb-6">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-4 rounded-xl bg-[hsl(25,100%,50%)] text-white font-semibold text-base active:opacity-80"
        >
          Got It
        </button>
      </div>
    </Sheet>
  );
}
