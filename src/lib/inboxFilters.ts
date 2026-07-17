import type { EstimateDoc } from '@/types/estimate';
import { getJobStatus } from '@/types/estimate';

export type JobStatusFilter = 'all' | 'success' | 'processing' | 'error';
export type JobFilter = JobStatusFilter | 'scheduled' | 'completed' | 'notifications';

export const JOB_STATUS_FILTERS: JobStatusFilter[] = ['all', 'success', 'processing', 'error'];

export const FILTERS: { key: JobFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'success', label: 'Ready' },
  { key: 'processing', label: 'Processing' },
  { key: 'error', label: 'Error' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'completed', label: 'Completed' },
  { key: 'notifications', label: 'Notifications' },
];

// Port of tcp-mobile's Inbox.tsx `counts` useMemo, as a pure helper. Job-status
// counts (success/processing/error) come from tallying getJobStatus() over the
// live Firestore jobs; scheduled/completed/notifications are fixed totals the
// caller supplies (demoData site counts, MOCK_NOTIFICATIONS.length).
export function computeInboxCounts(
  jobs: EstimateDoc[],
  scheduledCount: number,
  completedCount: number,
  notificationsCount: number,
): Record<JobFilter, number> {
  const counts: Record<JobFilter, number> = {
    all: jobs.length,
    success: 0,
    processing: 0,
    error: 0,
    scheduled: scheduledCount,
    completed: completedCount,
    notifications: notificationsCount,
  };
  for (const job of jobs) {
    counts[getJobStatus(job)]++;
  }
  return counts;
}
