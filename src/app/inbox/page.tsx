'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import JobDetailSheet from '@/components/JobDetailSheet';
import StatusBadge from '@/components/StatusBadge';
import type { EstimateDoc } from '@/types/estimate';
import { getJobStatus, parseJobInput, formatOrg } from '@/types/estimate';
import { getFirestoreDb } from '@/lib/firebase';

function InboxContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<EstimateDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe pt-4 pb-3 border-b border-gray-100">
        <button onClick={() => router.push('/home')} className="text-gray-500 font-medium text-sm">
          ← Home
        </button>
        <h1 className="font-bold text-gray-900 text-lg">Inbox</h1>
      </div>

      {/* List */}
      <div className="flex-1">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-3 border-[hsl(25,100%,50%)] border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="font-bold text-gray-900 text-lg mb-1">No sites yet</h2>
            <p className="text-gray-500 text-sm">Submit your first site request to get started.</p>
            <button
              onClick={() => router.push('/request/details')}
              className="mt-6 px-6 py-3 rounded-xl bg-[hsl(25,100%,50%)] text-white font-semibold text-sm"
            >
              Request a Site
            </button>
          </div>
        )}

        {!loading && jobs.map((job) => {
          const status = getJobStatus(job);
          const input = parseJobInput(job);
          const address = input.location?.address || '—';
          const workType = input.work?.description || '—';
          const org = formatOrg(job.metadata?.customer_org || '');
          const taCode = job.metadata?.rulesContext?.taCode;
          const createdAt = job.metadata?.created_at
            ? new Date(job.metadata.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
              })
            : '';

          return (
            <button
              key={job.id}
              onClick={() => setActiveJobId(job.id)}
              className="w-full text-left px-4 py-4 border-b border-gray-100 active:bg-gray-50"
            >
              <div className="flex items-start justify-between mb-1">
                <span className="font-bold text-gray-900">{input.workOrderId || job.id.slice(0, 8)}</span>
                <StatusBadge status={status} small />
              </div>
              <div className="text-sm text-gray-500">{org} · {address}</div>
              <div className="text-sm text-gray-500">{workType}{taCode ? ` · ${taCode}` : ''}</div>
              <div className="text-xs text-gray-400 mt-1">{createdAt}</div>
            </button>
          );
        })}
      </div>

      {/* Job detail sheet */}
      {activeJobId && (
        <JobDetailSheet
          isOpen
          onClose={() => {
            setActiveJobId(null);
            // Remove ?new= param without navigation
            if (newJobId) {
              const url = new URL(window.location.href);
              url.searchParams.delete('new');
              window.history.replaceState({}, '', url.toString());
            }
          }}
          jobId={activeJobId}
        />
      )}
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 rounded-full border-3 border-[hsl(25,100%,50%)] border-t-transparent animate-spin" /></div>}>
      <InboxContent />
    </Suspense>
  );
}
