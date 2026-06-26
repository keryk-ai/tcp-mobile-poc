import type { WorkType, LaneSide } from '@/types/estimate';

export function buildEstimateWork(workType: WorkType, direction: string, selectedLane?: LaneSide) {
  if (workType === 'flagging') {
    return {
      description: 'Flagging Operation',
      taNumber: 'ta-10',
      duration: 'Short-Term' as const,
      isRoadCrossing: false as const,
      dynamicFields: { direction },
    };
  }
  return {
    description: 'Lane Closure',
    taNumber: null,
    duration: 'Short-Term' as const,
    isRoadCrossing: false as const,
    dynamicFields: { direction, selected_lane: selectedLane },
  };
}
