'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import AppShell from '@/components/AppShell';
import JobDetailSheet from '@/components/JobDetailSheet';
import DemoSiteSheet from '@/components/DemoSiteSheet';
import StatusBadge from '@/components/StatusBadge';
import { CheckmarkCircleIcon } from '@/components/MarketplaceIcons';
import {
  HourglassOutlineIcon,
  AlertCircleIcon,
  LocationOutlineIcon,
  FileTrayOutlineIcon,
  CheckmarkDoneOutlineIcon,
  CalendarOutlineIcon,
} from '@/components/InboxIcons';
import type { EstimateDoc } from '@/types/estimate';
import { getJobStatus, parseJobInput, formatOrg } from '@/types/estimate';
import { getFirestoreDb } from '@/lib/firebase';
import { DEMO_SITES, type DemoSite } from '@/lib/demoData';
import { MOCK_NOTIFICATIONS, TYPE_CONFIG, type AppNotification, type NotificationType } from '@/lib/notifications';
import { computeInboxCounts, FILTERS, JOB_STATUS_FILTERS, type JobFilter } from '@/lib/inboxFilters';

const SCHEDULED_SITES = DEMO_SITES.filter((s) => s.type === 'scheduled');
const COMPLETED_SITES = DEMO_SITES.filter((s) => s.type === 'completed');

const STATUS_ICON_CONFIG: Record<
  'success' | 'processing' | 'error',
  { Icon: typeof CheckmarkCircleIcon; bg: string; color: string }
> = {
  success: { Icon: CheckmarkCircleIcon, bg: 'bg-emerald-50 dark:bg-emerald-900/30', color: 'text-emerald-600' },
  processing: { Icon: HourglassOutlineIcon, bg: 'bg-amber-50 dark:bg-amber-900/30', color: 'text-amber-600' },
  error: { Icon: AlertCircleIcon, bg: 'bg-red-50 dark:bg-red-900/30', color: 'text-red-600' },
};

// TYPE_CONFIG (src/lib/notifications.ts) is light-mode-only — its other consumer,
// NotificationSheet, isn't dark-aware either, so we don't touch the shared config
// and instead layer dark: classes on top here, same approach tcp-mobile's Inbox
// screen uses for the same reason.
const NOTIFICATION_DARK_CONFIG: Record<NotificationType, { bg: string; text: string }> = {
  job_complete: { bg: 'dark:bg-emerald-900/30', text: 'dark:text-emerald-400' },
  tcp_ready: { bg: 'dark:bg-blue-900/30', text: 'dark:text-blue-400' },
  incentive: { bg: 'dark:bg-orange-900/30', text: 'dark:text-orange-400' },
  algo_insight: { bg: 'dark:bg-violet-900/30', text: 'dark:text-violet-400' },
  partner_offer: { bg: 'dark:bg-sky-900/30', text: 'dark:text-sky-400' },
};

const CARD_CLASSES =
  'w-full text-left mx-4 my-1.5 rounded-xl border border-gray-200 dark:border-neutral-700 p-3 active:bg-gray-50 dark:active:bg-neutral-800 flex items-center gap-3';

function InboxContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<EstimateDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [filter, setFilter] = useState<JobFilter>('all');
  const [activeDemoSite, setActiveDemoSite] = useState<DemoSite | null>(null);

  const newJobId = searchParams.get('new');

  // Auto-open new job from submission
  useEffect(() => {
    if (newJobId) setActiveJobId(newJobId);
  }, [newJobId]);

  // Subscribe to org jobs
  useEffect(() => {
    if (!user) return;

    const subscribe = async () => {
      const db = await getFirestoreDb();
      if (!db) { setLoading(false); return; }

      const { collection, query, where, orderBy, limit, onSnapshot } = await import('firebase/firestore');

      const idTokenResult = await user.getIdTokenResult();
      const org = idTokenResult.claims.org as string;

      if (!org) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, 'tcp_estimates'),
        where('metadata.customer_org', '==', org),
        orderBy('metadata.created_at', 'desc'),
        limit(50),
      );

      const unsub = onSnapshot(q, (snap) => {
        setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EstimateDoc));
        setLoading(false);
      });

      return unsub;
    };

    let unsub: (() => void) | undefined;
    subscribe().then((u) => { unsub = u; });
    return () => { unsub?.(); };
  }, [user]);

  const counts = useMemo(
    () => computeInboxCounts(jobs, SCHEDULED_SITES.length, COMPLETED_SITES.length, MOCK_NOTIFICATIONS.length),
    [jobs],
  );

  const filteredJobs = useMemo(
    () => (filter === 'all' ? jobs : jobs.filter((job) => getJobStatus(job) === filter)),
    [jobs, filter],
  );

  const isJobFilter = (JOB_STATUS_FILTERS as JobFilter[]).includes(filter);
  const activeFilterLabel = FILTERS.find((f) => f.key === filter)?.label;
  const emptyMessage = filter === 'notifications' ? 'No notifications.' : `No ${activeFilterLabel} sites.`;

  const handleNotificationPress = (notif: AppNotification) => {
    if (!notif.actionJobId) return;
    const site = DEMO_SITES.find((s) => s.id === notif.actionJobId);
    if (site) setActiveDemoSite(site);
  };

  const closeSheet = () => {
    setActiveJobId(null);
    // Remove ?new= param without navigation
    if (newJobId) {
      const url = new URL(window.location.href);
      url.searchParams.delete('new');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const renderJobRow = (job: EstimateDoc) => {
    const status = getJobStatus(job);
    const input = parseJobInput(job);
    const address = input.location?.address || '—';
    const workType = input.work?.description || '—';
    const org = formatOrg(job.metadata?.customer_org || '');
    const taCode = job.metadata?.rulesContext?.taCode;
    const rawDate = job.metadata?.created_at;
    const createdAt = (() => {
      if (!rawDate) return '';
      const ms = typeof rawDate === 'object' && 'seconds' in rawDate
        ? (rawDate as { seconds: number }).seconds * 1000
        : Date.parse(rawDate as string);
      return isNaN(ms) ? '' : new Date(ms).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
      });
    })();
    const iconCfg = STATUS_ICON_CONFIG[status];

    return (
      <button key={job.id} type="button" onClick={() => setActiveJobId(job.id)} className={CARD_CLASSES}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconCfg.bg}`}>
          <iconCfg.Icon className={`w-5 h-5 ${iconCfg.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 dark:text-white truncate">{input.workOrderId || job.id.slice(0, 8)}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <LocationOutlineIcon className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-500 dark:text-neutral-400 truncate">{org} · {address}</span>
          </div>
          <div className="mt-1">
            <span className="inline-block bg-gray-100 dark:bg-neutral-800 px-1.5 rounded text-[10px] text-gray-500 dark:text-neutral-400">
              {workType}{taCode ? ` · ${taCode}` : ''}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <StatusBadge status={status} small />
          <span className="text-xs text-gray-400">{createdAt}</span>
        </div>
      </button>
    );
  };

  const renderDemoSiteRow = (site: DemoSite) => {
    const isCompleted = site.type === 'completed';
    return (
      <button key={site.id} type="button" onClick={() => setActiveDemoSite(site)} className={CARD_CLASSES}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-amber-50 dark:bg-amber-900/30'}`}>
          {isCompleted
            ? <CheckmarkDoneOutlineIcon className="w-5 h-5 text-emerald-600" />
            : <CalendarOutlineIcon className="w-5 h-5 text-amber-600" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 dark:text-white truncate">Job {site.jobName}</div>
          <div className="text-sm text-gray-500 dark:text-neutral-400 truncate">{site.address}, {site.city}</div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
            isCompleted
              ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
          }`}>
            {isCompleted ? 'Completed' : 'Scheduled'}
          </span>
          <span className="text-xs text-gray-400">{isCompleted ? site.completedDate : site.scheduledDate}</span>
        </div>
      </button>
    );
  };

  const renderNotificationRow = (notif: AppNotification) => {
    const cfg = TYPE_CONFIG[notif.type];
    const darkCfg = NOTIFICATION_DARK_CONFIG[notif.type];
    return (
      <button key={notif.id} type="button" onClick={() => handleNotificationPress(notif)} className={CARD_CLASSES}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${cfg.iconBg} ${darkCfg.bg}`}>
          <span className={`text-sm font-bold ${darkCfg.text}`}>{cfg.icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">{notif.title}</div>
          <div className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5 line-clamp-2">{notif.message}</div>
        </div>

        <span className="text-xs text-gray-400 self-start shrink-0">{notif.timestamp}</span>
      </button>
    );
  };

  const renderContent = () => {
    if (isJobFilter) {
      if (jobs.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-[hsl(25,100%,95%)] dark:bg-neutral-800 flex items-center justify-center mb-4">
              <FileTrayOutlineIcon className="w-9 h-9 text-[hsl(25,100%,50%)]" />
            </div>
            <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-1">No sites yet</h2>
            <p className="text-gray-500 text-sm">Submit your first site request to get started.</p>
            <button
              type="button"
              onClick={() => router.push('/request/details')}
              className="mt-6 px-6 py-3 rounded-xl bg-[hsl(25,100%,50%)] text-white font-semibold text-sm"
            >
              Request a Site
            </button>
          </div>
        );
      }
      if (filteredJobs.length === 0) {
        return (
          <div className="flex items-center justify-center py-10">
            <span className="text-gray-400 dark:text-neutral-500 text-sm">{emptyMessage}</span>
          </div>
        );
      }
      return <div>{filteredJobs.map(renderJobRow)}</div>;
    }

    if (filter === 'scheduled' || filter === 'completed') {
      const sites = filter === 'scheduled' ? SCHEDULED_SITES : COMPLETED_SITES;
      if (sites.length === 0) {
        return (
          <div className="flex items-center justify-center py-10">
            <span className="text-gray-400 dark:text-neutral-500 text-sm">{emptyMessage}</span>
          </div>
        );
      }
      return <div>{sites.map(renderDemoSiteRow)}</div>;
    }

    // notifications
    if (MOCK_NOTIFICATIONS.length === 0) {
      return (
        <div className="flex items-center justify-center py-10">
          <span className="text-gray-400 dark:text-neutral-500 text-sm">{emptyMessage}</span>
        </div>
      );
    }
    return <div>{MOCK_NOTIFICATIONS.map(renderNotificationRow)}</div>;
  };

  return (
    <>
      {/* Header */}
      <div className="shrink-0 px-4 pt-safe pt-4 pb-3 border-b border-gray-100 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-gray-900 dark:text-white text-lg">Inbox</h1>
          {!loading && (
            <span className="inline-flex items-center rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5">
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">● Live</span>
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-neutral-500 mt-0.5">
          {jobs.length} site{jobs.length !== 1 ? 's' : ''} · updates in real time
        </p>
      </div>

      {/* Filter chips */}
      {!loading && (
        <div className="shrink-0 border-b border-gray-100 dark:border-neutral-800 py-2">
          <div className="overflow-x-auto flex items-center gap-2 px-4">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`shrink-0 h-8 px-3 rounded-full flex items-center justify-center ${
                  filter === f.key ? 'bg-[hsl(25,100%,50%)]' : 'bg-gray-100 dark:bg-neutral-800'
                }`}
              >
                <span className={`text-xs font-semibold whitespace-nowrap ${filter === f.key ? 'text-white' : 'text-gray-600 dark:text-neutral-300'}`}>
                  {f.label} {counts[f.key]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-3 border-[hsl(25,100%,50%)] border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && <div className="flex-1 overflow-y-auto">{renderContent()}</div>}

      {/* Job detail sheet */}
      {activeJobId && (
        <JobDetailSheet
          isOpen
          onClose={closeSheet}
          jobId={activeJobId}
        />
      )}

      {activeDemoSite && (
        <DemoSiteSheet
          site={activeDemoSite}
          onClose={() => setActiveDemoSite(null)}
        />
      )}
    </>
  );
}

export default function InboxPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 rounded-full border-3 border-[hsl(25,100%,50%)] border-t-transparent animate-spin" /></div>}>
        <InboxContent />
      </Suspense>
    </AppShell>
  );
}
