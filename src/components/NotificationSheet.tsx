'use client';

import { MOCK_NOTIFICATIONS, TYPE_CONFIG, type AppNotification, type NotificationType } from '@/lib/notifications';
import type { DemoSite } from '@/lib/demoData';
import Sheet from './Sheet';

interface NotificationSheetProps {
  onClose: () => void;
  onReadAll: () => void;
  readIds: Set<string>;
  onMarkRead: (id: string) => void;
  onOpenDemoSite?: (site: DemoSite) => void;
  demoSites: DemoSite[];
}

// TYPE_CONFIG (src/lib/notifications.ts) is light-mode-only — layer dark:
// classes on top here rather than touching the shared config (same approach
// as the Inbox screen, Task 5).
const NOTIFICATION_DARK_CONFIG: Record<NotificationType, { bg: string; accent: string }> = {
  job_complete: { bg: 'dark:bg-emerald-900/30', accent: 'dark:border-emerald-700' },
  tcp_ready: { bg: 'dark:bg-blue-900/30', accent: 'dark:border-blue-700' },
  incentive: { bg: 'dark:bg-orange-900/30', accent: 'dark:border-[hsl(25,100%,40%)]' },
  algo_insight: { bg: 'dark:bg-violet-900/30', accent: 'dark:border-violet-700' },
  partner_offer: { bg: 'dark:bg-sky-900/30', accent: 'dark:border-sky-700' },
};

export default function NotificationSheet({
  onClose,
  onReadAll,
  readIds,
  onMarkRead,
  onOpenDemoSite,
  demoSites,
}: NotificationSheetProps) {
  const handleAction = (notif: AppNotification) => {
    onMarkRead(notif.id);
    if (notif.actionJobId && onOpenDemoSite) {
      const site = demoSites.find(s => s.id === notif.actionJobId);
      if (site) { onClose(); onOpenDemoSite(site); }
    }
  };

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !readIds.has(n.id)).length;

  const header = (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-neutral-800">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div>
          <span className="font-bold text-gray-900 dark:text-white text-base">Notifications</span>
          {unreadCount > 0 && (
            <span className="ml-2 text-xs font-semibold bg-[hsl(25,100%,50%)] text-white px-1.5 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
      </div>
      {unreadCount > 0 && (
        <button
          type="button"
          onClick={onReadAll}
          className="text-xs font-semibold text-[hsl(25,100%,50%)]"
        >
          Mark all read
        </button>
      )}
    </div>
  );

  return (
    <Sheet onClose={onClose} maxHeight="85vh" zIndexClass="z-50" header={header}>
      <div className="divide-y divide-gray-100 dark:divide-neutral-800">
        {MOCK_NOTIFICATIONS.map((notif) => {
          const cfg = TYPE_CONFIG[notif.type];
          const darkCfg = NOTIFICATION_DARK_CONFIG[notif.type];
          const isRead = readIds.has(notif.id);
          return (
            <div
              key={notif.id}
              className={`flex gap-3 px-4 py-4 ${isRead ? 'bg-white dark:bg-neutral-900' : 'bg-gray-50/60 dark:bg-neutral-800/60'}`}
            >
              {/* Unread accent + icon */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                {!isRead && (
                  <div className="w-2 h-2 rounded-full bg-[hsl(25,100%,50%)] mt-1" />
                )}
                {isRead && <div className="w-2 h-2 mt-1" />}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${cfg.iconBg} ${darkCfg.bg}`}>
                  {cfg.icon}
                </div>
              </div>

              {/* Content */}
              <div className={`flex-1 min-w-0 border-l-2 pl-3 ${isRead ? 'border-gray-100 dark:border-neutral-700' : `${cfg.accent} ${darkCfg.accent}`}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className={`text-sm font-semibold leading-snug ${isRead ? 'text-gray-700 dark:text-neutral-300' : 'text-gray-900 dark:text-white'}`}>
                    {notif.title}
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-neutral-500 shrink-0 mt-0.5">{notif.timestamp}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1 leading-relaxed">{notif.message}</p>
                {notif.actionLabel && (
                  <button
                    type="button"
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
    </Sheet>
  );
}
