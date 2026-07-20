// TA pre-submit compatibility check — mirrors relay.py categorize_road() logic.
// Keep in sync with relay.py's categorize_road()/derive_ta_code() functions.
// (Ported from svc-frontend/src/lib/taCompatibility.ts.)

export type RoadType =
  | '2-lane-2-way'
  | '2-lane-road'
  | 'multi-lane-road'
  | 'divided-highway'
  | 'freeway';

interface RoadAttributes {
  type?: string;
  lanes?: number | null;
  isOneWay?: boolean;
  isDivided?: boolean;
  hasMedian?: boolean;
}

export function categorizeRoad(road: RoadAttributes): RoadType {
  const osmType = (road.type || '').toLowerCase();
  const isOneWay = road.isOneWay ?? false;
  const isDivided = (road.isDivided ?? false) || ((road.hasMedian ?? false) && isOneWay);
  const lanes = road.lanes != null ? Math.floor(road.lanes) : 2;

  if (osmType === 'motorway' || osmType === 'motorway_link') return 'freeway';
  // AGE-89: residential is always flagging-eligible (Morgan 2026-07-08) — upstream lane data can be mis-attributed on minor roads
  if (osmType === 'residential') return '2-lane-2-way';
  if (isDivided && isOneWay) return 'divided-highway';
  if (lanes <= 2 && !isOneWay) return '2-lane-2-way';
  if (lanes > 2 && isDivided) return 'divided-highway';
  if (lanes > 2) return 'multi-lane-road';
  return '2-lane-road';
}

const ROAD_TYPE_LABELS: Record<string, string> = {
  'multi-lane-road': 'multi-lane road',
  'divided-highway': 'divided highway',
  freeway: 'freeway',
  '2-lane-2-way': '2-lane road',
  '2-lane-road': '2-lane road',
};

// Only Flagging (TA-10) has a road-type constraint among the app's
// user-selectable work types. Lane Closure has no fixed portal TA — relay
// derives ta-30/ta-30r/ta-33 from road geometry after submission.
const TA10_ELIGIBLE = new Set<RoadType>(['2-lane-2-way', '2-lane-road']);

export interface TACompatibilityResult {
  compatible: boolean;
  roadType: RoadType;
  roadLabel: string;
  lanes: number;
}

export function checkTACompatibility(
  portalTA: string | null,
  road: RoadAttributes
): TACompatibilityResult | null {
  if (!portalTA || portalTA.toUpperCase() !== 'TA-10') return null;

  const roadType = categorizeRoad(road);
  const lanes = road.lanes != null ? Math.floor(road.lanes) : 2;
  return {
    compatible: TA10_ELIGIBLE.has(roadType),
    roadType,
    roadLabel: ROAD_TYPE_LABELS[roadType] || roadType,
    lanes,
  };
}
