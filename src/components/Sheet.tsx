'use client';

import { useRef, type ReactNode, type TouchEvent } from 'react';

interface SheetProps {
  onClose: () => void;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  /** Tailwind max-height arbitrary value, e.g. '92vh' or '85vh'. */
  maxHeight?: string;
  /** Tailwind z-index class. Detail-level sheets (JobDetailSheet,
   *  DemoSiteSheet, MarketplaceOfferingSheet) use the default 'z-40';
   *  sheets that must stack above another sheet (confirmations, Payment,
   *  Notifications, ScheduleCalendarSheet) pass 'z-50'. */
  zIndexClass?: string;
}

// Shared bottom-sheet chrome: backdrop, rounded-t-2xl sheet scoped to the
// phone column, centered drag handle, optional fixed header, scrollable
// body, optional sticky footer. Swipe-down-to-close and backdrop-tap-to-close
// are built in here instead of duplicated per sheet.
export default function Sheet({ onClose, header, footer, children, maxHeight = '92vh', zIndexClass = 'z-40' }: SheetProps) {
  const startYRef = useRef(0);

  const handleTouchStart = (e: TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: TouchEvent) => {
    if (e.changedTouches[0].clientY - startYRef.current > 80) onClose();
  };

  return (
    <div className={`fixed inset-0 ${zIndexClass} flex items-end`}>
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} />

      <div
        className="relative w-full max-w-[430px] mx-auto bg-white dark:bg-neutral-900 rounded-t-2xl shadow-2xl flex flex-col"
        style={{ animation: 'slideUp 0.3s ease-out', maxHeight }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto" />
        </div>

        {header && <div className="shrink-0">{header}</div>}

        <div className="overflow-y-auto flex-1">{children}</div>

        {footer && <div className="shrink-0">{footer}</div>}
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
