export type TimeOfDay = 'Day' | 'Night';
export type ConstructionType = 'underground' | 'overhead' | 'other';
export type WorkType = 'flagging' | 'lane-closure';
export type LaneSide = 'left' | 'right';

export interface EstimatePayload {
  workOrderId: string;
  segmentId: string;
  client: string;
  work: {
    description: string;
    taNumber: string | null;
    duration: 'Short-Term';
    timeOfDay: TimeOfDay;
    constructionType: ConstructionType;
    isRoadCrossing: false;
    dynamicFields: {
      direction: string;
      selected_lane?: LaneSide;
    };
  };
  location: {
    startLat: number;
    startLon: number;
    endLat: number;
    endLon: number;
    address: string;
  };
}

export interface BOMTotals {
  signCount: number;
  deviceCount: number;
  flaggerCount: number;
  coneCount: number;
  rawConeCount: number;
  standCount?: number;
  sandbagCount?: number;
}

export interface BOMSign {
  label: string;
  mutcdCode: string;
  quantity: number;
}

export interface BOMDevice {
  type: string;
  quantity: number;
}

export interface BOMResult {
  totals: BOMTotals;
  signs: BOMSign[];
  devices: BOMDevice[];
}

export interface EstimateResponse {
  status: 'success' | 'failed';
  image_storage_path?: string;
  image_signed_url?: string;
  image_dimensions?: { width: number; height: number };
  plan_extent_meters?: { width: number; height: number };
  feet_per_inch?: number;
  bom?: BOMResult;
  generated_at: string;
  generation_time_ms: number;
  failure_reason?: 'no_road_data' | 'pipeline_error' | 'storage_upload_failed' | 'job_not_found' | 'unknown';
  error?: string;
}

export interface EstimateDoc {
  id: string;
  service1_input?: { payload: string };
  service1_response?: { payload: string; responded_at: string; status_code: number };
  service3_response?: { payload: string; responded_at: string; status_code: number };
  estimate_response?: EstimateResponse;
  metadata: {
    status: string;
    created_at: string;
    updated_at: string;
    submitted_by_uid: string;
    submitted_by_email: string;
    customer_org: string;
    company?: string;
    rulesContext?: { taCode?: string };
  };
}

export interface FormState {
  workOrderId: string;
  address: string;
  timeOfDay: TimeOfDay | '';
  constructionType: ConstructionType | '';
  pinA: { lat: number; lng: number } | null;
  pinB: { lat: number; lng: number } | null;
  distance: number | null;
  direction: string;
  workType: WorkType | null;
  selectedLane: LaneSide | null;
}

export function parseJobInput(doc: EstimateDoc) {
  try {
    return JSON.parse(doc.service1_input?.payload ?? '{}');
  } catch {
    return {};
  }
}

export function getJobStatus(doc: EstimateDoc): 'processing' | 'success' | 'error' {
  if (!doc.estimate_response) return 'processing';
  if (doc.estimate_response.status === 'success') return 'success';
  return 'error';
}

export function formatOrg(org: string): string {
  return org.charAt(0).toUpperCase() + org.slice(1);
}
