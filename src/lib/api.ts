import type { FormState, EstimatePayload, TimeOfDay, ConstructionType, WorkType, LaneSide } from '@/types/estimate';
import { buildEstimateWork } from './taLogic';

export function buildEstimatePayload(form: FormState, customerOrg: string): EstimatePayload {
  const workDetails = buildEstimateWork(
    form.workType as WorkType,
    form.direction,
    (form.selectedLane as LaneSide) ?? undefined,
  );

  return {
    workOrderId: form.workOrderId,
    segmentId: form.workOrderId,
    client: customerOrg,
    work: {
      ...workDetails,
      timeOfDay: form.timeOfDay as TimeOfDay,
      constructionType: form.constructionType as ConstructionType,
    },
    location: {
      startLat: form.pinA!.lat,
      startLon: form.pinA!.lng,
      endLat: form.pinB!.lat,
      endLon: form.pinB!.lng,
      address: form.address,
    },
  };
}

export async function postEstimate(
  payload: EstimatePayload,
  idToken: string,
): Promise<{ transactionId: string }> {
  const res = await fetch('/api/estimate-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || `Request failed: ${res.status}`);
  }

  const data = await res.json() as { transaction_id: string };
  return { transactionId: data.transaction_id };
}
