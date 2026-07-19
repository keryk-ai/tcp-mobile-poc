'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useAuth } from '@/components/AuthContext';
import AppShell from '@/components/AppShell';
import JobDetailSheet from '@/components/JobDetailSheet';
import DemoSiteSheet from '@/components/DemoSiteSheet';
import NotificationSheet from '@/components/NotificationSheet';
import StatusBadge from '@/components/StatusBadge';
import VoiceAgent from '@/components/VoiceAgent';
import type { EstimateDoc } from '@/types/estimate';
import { getJobStatus, parseJobInput, formatOrg } from '@/types/estimate';
import { getFirestoreDb } from '@/lib/firebase';
import { clearFormState } from '@/lib/formState';
import type { SitePin } from '@/components/SiteMapView';
import { DEMO_SITES, type DemoSite } from '@/lib/demoData';
import { MOCK_NOTIFICATIONS } from '@/lib/notifications';

const SiteMapView = dynamic(() => import('@/components/SiteMapView'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-gray-100 dark:bg-neutral-800 animate-pulse" />,
});

type HomeTab = 'new' | 'scheduled' | 'completed';

export default function HomePage() {
  const { user, signOut } = useAuth();
  const [jobs, setJobs] = useState<EstimateDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeDemoSite, setActiveDemoSite] = useState<DemoSite | null>(null);
  const [activeTab, setActiveTab] = useState<HomeTab>('new');
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState<Set<string>>(new Set());

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !readNotifIds.has(n.id)).length;
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [userOrg, setUserOrg] = useState('');
  const [agentActive, setAgentActive] = useState(false);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'there';

  // Subscribe to org jobs
  useEffect(() => {
    if (!user) return;

    const subscribe = async () => {
      const db = await getFirestoreDb();
      if (!db) { setLoading(false); return; }

      const { collection, query, where, orderBy, limit, onSnapshot } = await import('firebase/firestore');
      const idTokenResult = await user.getIdTokenResult();
      const org = idTokenResult.claims.org as string;
      if (org) setUserOrg(org);

      if (!org) { setLoading(false); return; }

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

  const pins = useMemo<SitePin[]>(() => {
    if (activeTab === 'scheduled') {
      return DEMO_SITES.filter(s => s.type === 'scheduled').map((s, i) => ({
        lat: s.lat, lng: s.lng, label: String(i + 1), jobId: s.id, color: '#F59E0B',
      }));
    }
    if (activeTab === 'completed') {
      return DEMO_SITES.filter(s => s.type === 'completed').map((s, i) => ({
        lat: s.lat, lng: s.lng, label: String(i + 1), jobId: s.id, color: '#10B981',
      }));
    }
    // new tab: all successful Firestore jobs with coordinates
    const result: SitePin[] = [];
    for (const job of jobs) {
      if (getJobStatus(job) !== 'success') continue;
      const input = parseJobInput(job);
      const lat = input.location?.startLat;
      const lng = input.location?.startLon;
      if (lat && lng) {
        result.push({ lat, lng, label: String(result.length + 1), jobId: job.id, color: '#FF6B00' });
      }
    }
    return result;
  }, [jobs, activeTab]);

  const tabLabel = (tab: HomeTab) =>
    tab === 'new' ? 'New Sites' : tab === 'scheduled' ? 'Scheduled' : 'Completed';

  return (
    <AppShell>
      {/* Header */}
      <header className="shrink-0 relative flex items-center justify-between px-4 pt-safe pt-4 pb-3 border-b border-gray-100 dark:border-neutral-800">
        <div className="flex flex-col gap-0.5">
          <Image
            src="/awp-logo-horizontal.jpg"
            alt="AWP Safety"
            width={100}
            height={30}
            className="object-contain"
          />
          <span className="text-[10px] font-semibold text-gray-400 tracking-wide uppercase leading-none">Traffic Safety Assistant</span>
        </div>
        <div className="flex items-center gap-2 relative">
          {/* Notification bell */}
          <button
            type="button"
            onClick={() => setShowNotifications(true)}
            className="relative w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 active:bg-gray-200 dark:active:bg-neutral-700"
            aria-label="Notifications"
          >
            <span className="text-base">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[hsl(25,100%,50%)] flex items-center justify-center">
                <span className="text-[9px] font-bold text-white">{unreadCount}</span>
              </span>
            )}
          </button>

          <div className="text-right mr-1">
            <div className="text-xs font-semibold text-gray-900 dark:text-white">Hi, {displayName}</div>
            {userOrg && (
              <div className="text-[10px] text-gray-400 leading-tight">{formatOrg(userOrg)}</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowLogoutMenu(!showLogoutMenu)}
            className="w-9 h-9 rounded-full bg-[hsl(25,100%,50%)] text-white font-bold text-sm flex items-center justify-center"
            aria-label="Profile"
          >
            {displayName.charAt(0).toUpperCase()}
          </button>

          {showLogoutMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowLogoutMenu(false)} />
              <div className="absolute right-0 top-11 z-20 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-700 overflow-hidden min-w-[140px]">
                <div className="px-4 py-2.5 text-xs text-gray-500 border-b border-gray-100 dark:border-neutral-700">
                  {user?.email}
                </div>
                <button
                  type="button"
                  onClick={async () => { setShowLogoutMenu(false); await signOut(); }}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Tab pills */}
      <div className="shrink-0 flex gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-neutral-800">
        {(['new', 'scheduled', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeTab === tab
                ? tab === 'new' ? 'bg-[hsl(25,100%,50%)] text-white'
                  : tab === 'scheduled' ? 'bg-amber-500 text-white'
                  : 'bg-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-neutral-800 text-gray-500'
            }`}
          >
            {tabLabel(tab)}
          </button>
        ))}
      </div>

      {/* Site Map — the hero element: absorbs whatever space the compact list/
          footer below it don't need, with a floor so tiny screens still get a
          usable map. */}
      <div className="flex-1 min-h-[220px] w-full border-b border-gray-200 dark:border-neutral-800 relative">
        <SiteMapView
          pins={pins}
          onPinClick={(jobId) => {
            const demo = DEMO_SITES.find(s => s.id === jobId);
            if (demo) { setActiveDemoSite(demo); } else { setActiveJobId(jobId); }
          }}
        />
        {activeTab === 'new' && (
          <Link
            href="/request/details"
            onClick={() => clearFormState()}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1.5 bg-[hsl(25,100%,50%)] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg active:opacity-85"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            ＋ Add New Site
          </Link>
        )}
      </div>

      {/* Site list — compact fixed height (~3 rows) now that the map is the
          hero; the only scrolling region on this screen besides the map. */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {activeTab === 'new' ? 'New Sites' : activeTab === 'scheduled' ? 'Scheduled Sites' : 'Completed Sites'}
          </span>
          {activeTab === 'new' && jobs.length > 0 && (
            <span className="text-xs text-gray-400">{jobs.length} site{jobs.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        <div className="h-44 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {/* Demo: scheduled / completed sites */}
            {activeTab !== 'new' && DEMO_SITES.filter(s => s.type === activeTab).map((site) => (
              <button
                key={site.id}
                type="button"
                onClick={() => setActiveDemoSite(site)}
                className="w-full text-left px-4 py-3.5 active:bg-gray-50 dark:active:bg-neutral-800 flex items-center gap-3 border-b border-gray-100 dark:border-neutral-800"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">Job {site.jobName}</div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">{site.address}, {site.city}</div>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{activeTab === 'scheduled' ? site.scheduledDate : site.completedDate}</span>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${activeTab === 'scheduled' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                  {activeTab === 'scheduled' ? 'Scheduled' : 'Completed'}
                </span>
              </button>
            ))}

            {/* New sites: Firestore jobs */}
            {activeTab === 'new' && loading && (
              [0, 1, 2].map((i) => (
                <div key={i} className="px-4 py-3.5 flex items-center gap-3 border-b border-gray-100 dark:border-neutral-800">
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-24 bg-gray-100 dark:bg-neutral-800 rounded animate-pulse" />
                    <div className="h-3 w-40 bg-gray-100 dark:bg-neutral-800 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-16 bg-gray-100 dark:bg-neutral-800 rounded-full animate-pulse" />
                </div>
              ))
            )}

            {activeTab === 'new' && !loading && jobs.length === 0 && (
              <div className="py-8 text-center px-4">
                <p className="text-gray-400 text-sm">No sites yet.</p>
                <p className="text-gray-400 text-xs mt-1">Tap <strong className="font-bold">Add New Site</strong> on the map to get started.</p>
              </div>
            )}

            {activeTab === 'new' && !loading && jobs.map((job) => {
              const status = getJobStatus(job);
              const input = parseJobInput(job);
              const address = input.location?.address || '—';
              const workOrderId = input.workOrderId || job.id.slice(0, 8);
              const rawDate = job.metadata?.created_at;
              const createdAt = (() => {
                if (!rawDate) return '';
                const ms = typeof rawDate === 'object' && 'seconds' in rawDate
                  ? (rawDate as { seconds: number }).seconds * 1000
                  : Date.parse(rawDate as string);
                return isNaN(ms) ? '' : new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              })();
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => setActiveJobId(job.id)}
                  className="w-full text-left px-4 py-3.5 active:bg-gray-50 dark:active:bg-neutral-800 flex items-center gap-3 border-b border-gray-100 dark:border-neutral-800"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">{workOrderId}</div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">{address}</div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{createdAt}</span>
                  <StatusBadge status={status} small />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Keryk AI footer */}
      <div className="shrink-0 flex items-center justify-center gap-1.5 py-2 pb-3">
        <span className="text-[10px] text-gray-300">Powered by</span>
        <Image src="/keryk-ai-logo.png" alt="Keryk AI" width={14} height={14} className="rounded-sm opacity-40" />
        <span className="text-[10px] font-semibold text-gray-300">Keryk AI</span>
      </div>

      {/* Sheets */}
      {activeJobId && (
        <JobDetailSheet
          isOpen
          onClose={() => setActiveJobId(null)}
          jobId={activeJobId}
        />
      )}

      {activeDemoSite && (
        <DemoSiteSheet
          site={activeDemoSite}
          onClose={() => setActiveDemoSite(null)}
        />
      )}

      {showNotifications && (
        <NotificationSheet
          onClose={() => setShowNotifications(false)}
          readIds={readNotifIds}
          onReadAll={() => setReadNotifIds(new Set(MOCK_NOTIFICATIONS.map(n => n.id)))}
          onMarkRead={(id) => setReadNotifIds(prev => new Set([...prev, id]))}
          onOpenDemoSite={(site) => setActiveDemoSite(site)}
          demoSites={DEMO_SITES}
        />
      )}

      {/* Backdrop behind agent widget during active call */}
      {agentActive && (
        <div
          className="fixed inset-0 bg-black/50 z-[998] backdrop-blur-sm"
          onClick={() => setAgentActive(false)}
        />
      )}

      {/* Auth-enabled floating voice agent (AGE-83) */}
      <VoiceAgent
        userEmail={user?.email ?? ''}
        org={userOrg}
        onActiveChange={setAgentActive}
      />
    </AppShell>
  );
}
