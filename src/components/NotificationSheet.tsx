'use client';

import { useRef } from 'react';
import { MOCK_NOTIFICATIONS, TYPE_CONFIG, type AppNotification } from '@/lib/notifications';
import type { DemoSite } from '@/lib/demoData';

interface NotificationSheetProps {
  onClose: () => void;
  onReadAll: () => void;
  readIds: Set<string>;
  onMarkRead: (id: string) => void;
  onOpenDemoSite?: (site: DemoSite) => void;
  demoSites: DemoSite[];
}

export default function NotificationSheet({
  onClose,
  onReadAll,
  readIds,
  onMarkRead,
  onOpenDemoSite,
  demoSites,
}: NotificationSheetProps) {
  const startYRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => { startYRef.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches[0].clientY - startYRef.current > 80) onClose();
  };

  const handleAction = (notif: AppNotification) => {
    onMarkRead(notif.id);
    if (notif.actionJobId && onOpenDemoSite) {
      const site = demoSites.find(s => s.id === notif.actionJobId);
      if (site) { onClose(); onOpenDemoSite(site); }
    }
  };

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !readIds.has(n.id)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div
        className="relative w-full bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col"
        style={{ animation: 'slideUp 0.3s ease-out' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <div>
              <span className="font-bold text-gray-900 text-base">Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-semibold bg-[hsl(25,100%,50%)] text-white px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={onReadAll}
              className="text-xs font-semibold text-[hsl(25,100%,50%)]"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notification list */}
        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
          {MOCK_NOTIFICATIONS.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type];
            const isRead = readIds.has(notif.id);
            return (
              <div
                key={notif.id}
                className={`flex gap-3 px-4 py-4 ${isRead ? 'bg-white' : 'bg-gray-50/60'}`}
              >
                {/* Unread accent + icon */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  {!isRead && (
                    <div className="w-2 h-2 rounded-full bg-[hsl(25,100%,50%)] mt-1" />
                  )}
                  {isRead && <div className="w-2 h-2 mt-1" />}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${cfg.iconBg}`}>
                    {cfg.icon}
                  </div>
                </div>

                {/* Content */}
                <div className={`flex-1 min-w-0 border-l-2 pl-3 ${isRead ? 'border-gray-100' : cfg.accent}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className={`text-sm font-semibold leading-snug ${isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                      {notif.title}
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">{notif.timestamp}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notif.message}</p>
                  {notif.actionLabel && (
                    <button
                      onClick={() => handleAction(notif)}
                      className="mt-2 text-xs font-semibold text-[hsl(25,100%,50%)]"
                    >
                      {notif.actionLabel} →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
