'use client';

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
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="relative w-full bg-white rounded-t-2xl shadow-xl animate-[slideUp_0.3s_ease-out]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="px-6 pt-2 pb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-gray-600 leading-relaxed mb-6">{message}</p>
          <button
            onClick={onClose}
            className="w-full py-4 rounded-xl bg-[hsl(25,100%,50%)] text-white font-semibold text-base active:opacity-80"
          >
            Got It
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
