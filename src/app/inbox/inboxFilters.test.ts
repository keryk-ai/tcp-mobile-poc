import { describe, it, expect } from 'vitest';
import { computeInboxCounts } from '@/lib/inboxFilters';
import type { EstimateDoc } from '@/types/estimate';

function job(status: 'processing' | 'success' | 'error'): EstimateDoc {
  if (status === 'processing') {
    return { id: `job-${status}-${Math.random()}` } as EstimateDoc;
  }
  return {
    id: `job-${status}-${Math.random()}`,
    estimate_response: { status: status === 'success' ? 'success' : 'error' },
  } as EstimateDoc;
}

describe('computeInboxCounts', () => {
  it('counts jobs per status plus all, given fixed scheduled/completed/notifications totals', () => {
    const jobs = [job('success'), job('success'), job('processing'), job('error')];
    const counts = computeInboxCounts(jobs, 2, 3, 5);

    expect(counts).toEqual({
      all: 4,
      success: 2,
      processing: 1,
      error: 1,
      scheduled: 2,
      completed: 3,
      notifications: 5,
    });
  });

  it('handles an empty job list', () => {
    const counts = computeInboxCounts([], 0, 0, 0);
    expect(counts).toEqual({
      all: 0,
      success: 0,
      processing: 0,
      error: 0,
      scheduled: 0,
      completed: 0,
      notifications: 0,
    });
  });
});
