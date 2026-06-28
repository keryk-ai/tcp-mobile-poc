'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useAuth } from '@/components/AuthContext';
import ComingSoonSheet from '@/components/ComingSoonSheet';
import JobDetailSheet from '@/components/JobDetailSheet';
import DemoSiteSheet from '@/components/DemoSiteSheet';
import NotificationSheet from '@/components/NotificationSheet';
import StatusBadge from '@/components/StatusBadge';
import ElevenLabsWidget from '@/components/ElevenLabsWidget';
import type { EstimateDoc } from '@/types/estimate';
import { getJobStatus, parseJobInput, formatOrg } from '@/types/estimate';
import { getFirestoreDb } from '@/lib/firebase';
import { clearFormState } from '@/lib/formState';
import type { SitePin } from '@/components/SiteMapView';
import { DEMO_SITES, type DemoSite } from '@/lib/demoData';
import { MOCK_NOTIFICATIONS } from '@/lib/notifications';

const SiteMapView = dynamic(() => import('@/components/SiteMapView'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" />,
});

const AWP_AGENT_ID = process.env.NEXT_PUBLIC_AWP_AGENT_ID ?? 'agent_8301kw2ea0h1ex0af3yjjee8kwef';

export default function HomePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<EstimateDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeDemoSite, setActiveDemoSite] = useState<DemoSite | null>(null);
  const [activeTab, setActiveTab] = useState<'new' | 'scheduled' | 'completed'>('new');
  const [showFutureFeature, setShowFutureFeature] = useState(false);
  const [showThirdPartyFeature, setShowThirdPartyFeature] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState<Set<string>>(new Set());

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !readNotifIds.has(n.id)).length;
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [userOrg, setUserOrg] = useState('');
  const [agentActive, setAgentActive] = useState(false);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'there';

  // Listen for ElevenLabs widget call start/end to show a backdrop
  useEffect(() => {
    const attach = () => {
      const widget = document.querySelector('elevenlabs-convai');
      if (!widget) return;
      widget.addEventListener('elevenlabs-convai:call', () => setAgentActive(true));
      widget.addEventListener('elevenlabs-convai:disconnect', () => setAgentActive(false));
      widget.addEventListener('elevenlabs-convai:close', () => setAgentActive(false));
    };
    // Retry a few times to catch the lazily-loaded widget
    attach();
    const t1 = setTimeout(attach, 1000);
    const t2 = setTimeout(attach, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

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
    // new tab: 5 most recent successful Firestore jobs with coordinates
    const result: SitePin[] = [];
    for (const job of jobs) {
      if (result.length >= 5) break;
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

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 border-b border-gray-100 bg-white z-10">
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
            onClick={() => setShowNotifications(true)}
            className="relative w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 active:bg-gray-200"
            aria-label="Notifications"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 17H9m6 0a2 2 0 01-4 0m4 0H9m6 0V11a6 6 0 10-12 0v6m12 0H9" />
              <path d="M18 8a6 6 0 00-12 0v6l-1.5 1.5h15L18 14V8z" strokeLinejoin="round" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[hsl(25,100%,50%)] text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="text-right mr-1">
            <div className="text-xs font-semibold text-gray-900">Hi, {displayName}</div>
            {userOrg && (
              <div className="text-[10px] text-gray-400 leading-tight">{formatOrg(userOrg)}</div>
            )}
          </div>
          <button
            onClick={() => setShowLogoutMenu(!showLogoutMenu)}
            className="w-9 h-9 rounded-full bg-[hsl(25,100%,50%)] text-white font-bold text-sm flex items-center justify-center"
            aria-label="Profile"
          >
            {displayName.charAt(0).toUpperCase()}
          </button>

          {showLogoutMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowLogoutMenu(false)} />
              <div className="absolute right-0 top-11 z-20 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-w-[140px]">
                <div className="px-4 py-2.5 text-xs text-gray-500 border-b border-gray-100">
                  {user?.email}
                </div>
                <button
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
      <div className="flex gap-2 px-4 py-2.5 border-b border-gray-100 bg-white">
        {(['new', 'scheduled', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeTab === tab
                ? tab === 'new' ? 'bg-[hsl(25,100%,50%)] text-white'
                  : tab === 'scheduled' ? 'bg-amber-500 text-white'
                  : 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {tab === 'new' ? 'New Sites' : tab === 'scheduled' ? 'Scheduled' : 'Completed'}
          </button>
        ))}
      </div>

      {/* Site Map */}
      <div className="relative h-[40vh] w-full border-b border-gray-200">
        <SiteMapView
          pins={pins}
          onPinClick={(jobId) => {
            const demo = DEMO_SITES.find(s => s.id === jobId);
            if (demo) { setActiveDemoSite(demo); } else { setActiveJobId(jobId); }
          }}
        />
        {/* Map overlay CTA */}
        <button
          onClick={() => { clearFormState(); router.push('/request/details'); }}
          className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 bg-[hsl(25,100%,50%)] text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg active:opacity-85"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Site
        </button>
      </div>

      {/* Site list */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {activeTab === 'new' ? 'New Sites' : activeTab === 'scheduled' ? 'Scheduled Sites' : 'Completed Sites'}
          </span>
          {activeTab === 'new' && jobs.length > 0 && (
            <span className="text-xs text-gray-400">{jobs.length} site{jobs.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Demo: scheduled sites */}
          {activeTab === 'scheduled' && (
            <div className="divide-y divide-gray-100">
              {DEMO_SITES.filter(s => s.type === 'scheduled').map((site) => (
                <button
                  key={site.id}
                  onClick={() => setActiveDemoSite(site)}
                  className="w-full text-left px-4 py-3.5 active:bg-gray-50 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">Job {site.jobName}</div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">{site.address}, {site.city}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">{site.scheduledDate}</span>
                    <span className="inline-flex items-center gap-1 rounded-full border font-semibold px-2 py-0.5 text-xs bg-amber-50 text-amber-700 border-amber-200">Scheduled</span>
                    <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Demo: completed sites */}
          {activeTab === 'completed' && (
            <div className="divide-y divide-gray-100">
              {DEMO_SITES.filter(s => s.type === 'completed').map((site) => (
                <button
                  key={site.id}
                  onClick={() => setActiveDemoSite(site)}
                  className="w-full text-left px-4 py-3.5 active:bg-gray-50 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">Job {site.jobName}</div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">{site.address}, {site.city}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">{site.completedDate}</span>
                    <span className="inline-flex items-center gap-1 rounded-full border font-semibold px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700 border-emerald-200">Completed</span>
                    <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* New sites: Firestore jobs */}
          {activeTab === 'new' && loading && (
            <div className="divide-y divide-gray-100">
              {[0, 1, 2].map((i) => (
                <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'new' && !loading && jobs.length === 0 && (
            <div className="py-8 text-center px-4">
              <p className="text-gray-400 text-sm">No sites yet.</p>
              <p className="text-gray-400 text-xs mt-1">Tap <strong>+ New Site</strong> on the map to get started.</p>
            </div>
          )}

          {activeTab === 'new' && !loading && jobs.length > 0 && (
            <div className="divide-y divide-gray-100 max-h-[13.5rem] overflow-y-auto">
              {jobs.map((job) => {
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
                    onClick={() => setActiveJobId(job.id)}
                    className="w-full text-left px-4 py-3.5 active:bg-gray-50 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">{workOrderId}</div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">{address}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {createdAt && <span className="text-xs text-gray-400">{createdAt}</span>}
                      <StatusBadge status={status} small />
                      <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Future Feature cards */}
      <div className="px-4 pt-3 grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowFutureFeature(true)}
          className="rounded-xl border-2 border-dashed border-gray-200 p-4 text-left active:bg-gray-50 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-base">✦</span>
            <span className="text-[10px] font-semibold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">Soon</span>
          </div>
          <div>
            <div className="font-semibold text-gray-400 text-sm leading-tight">Future Feature</div>
            <div className="text-xs text-gray-400 mt-0.5 leading-tight">Download from the AWP App Store</div>
          </div>
        </button>

        <button
          onClick={() => setShowThirdPartyFeature(true)}
          className="rounded-xl border-2 border-dashed border-gray-200 p-4 text-left active:bg-gray-50 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-base">✦</span>
            <span className="text-[10px] font-semibold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">Soon</span>
          </div>
          <div>
            <div className="font-semibold text-gray-400 text-sm leading-tight">Future Feature — 3rd Party</div>
            <div className="text-xs text-gray-400 mt-0.5 leading-tight">Download from the AWP App Store</div>
          </div>
        </button>
      </div>

      {/* Keryk AI footer */}
      <div className="flex items-center justify-center gap-1.5 py-4 pb-24">
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

      <ComingSoonSheet
        isOpen={showFutureFeature}
        onClose={() => setShowFutureFeature(false)}
        title="Coming Soon"
        message="AWP is building more tools on this platform. Upcoming features include AI field assistants, automated site risk analysis, schedule optimization, permit management, compliance documentation, and more."
      />

      <ComingSoonSheet
        isOpen={showThirdPartyFeature}
        onClose={() => setShowThirdPartyFeature(false)}
        title="Coming Soon — 3rd Party"
        message="AWP is partnering with leading field technology providers to bring third-party tools directly into this platform. Upcoming integrations include partner apps for inspection, permitting, crew management, and compliance — all accessible from the AWP App Store."
      />

      {/* Backdrop behind agent widget during active call */}
      {agentActive && (
        <div
          className="fixed inset-0 bg-black/50 z-[998] backdrop-blur-sm"
          onClick={() => setAgentActive(false)}
        />
      )}

      {/* ElevenLabs floating voice widget */}
      <ElevenLabsWidget
        agentId={AWP_AGENT_ID}
        userEmail={user?.email ?? ''}
        org={userOrg}
      />
    </div>
  );
}
