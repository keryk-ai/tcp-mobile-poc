export type NotificationType = 'job_complete' | 'tcp_ready' | 'incentive' | 'estimate_ready';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionJobId?: string;
}

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-001',
    type: 'job_complete',
    title: 'Work Complete — Job 48392017',
    message: 'Crew has completed traffic control at 4400 Sharon Rd, Charlotte. Invoice INV-2847 is ready for review.',
    timestamp: '2 hours ago',
    read: false,
    actionLabel: 'View Invoice',
    actionJobId: 'demo-completed-001',
  },
  {
    id: 'notif-002',
    type: 'tcp_ready',
    title: 'TCP Plan Approved — Job 59258992',
    message: 'Your traffic control plan for 7936 Old Salisbury Rd, Linwood has been reviewed and approved. Crew is scheduled for July 15 at 7:00 AM.',
    timestamp: 'Yesterday',
    read: false,
    actionLabel: 'View Schedule',
    actionJobId: 'demo-scheduled-001',
  },
  {
    id: 'notif-003',
    type: 'incentive',
    title: 'Save 5% — Book a Friday',
    message: 'AWP has high crew availability on Fridays. Schedule your next traffic control job on a Friday and receive a 5% discount on crew costs.',
    timestamp: '2 days ago',
    read: false,
  },
  {
    id: 'notif-004',
    type: 'estimate_ready',
    title: 'Site Estimate Ready',
    message: 'Your AI-generated site configuration is ready to review. Bill of materials includes 110 cones, 12 sign stands, and flagging crew.',
    timestamp: '3 days ago',
    read: true,
  },
];

export const TYPE_CONFIG: Record<NotificationType, { icon: string; accent: string; iconBg: string }> = {
  job_complete:   { icon: '✓',  accent: 'border-emerald-400', iconBg: 'bg-emerald-100 text-emerald-700' },
  tcp_ready:      { icon: '📋', accent: 'border-blue-400',    iconBg: 'bg-blue-100 text-blue-700'      },
  incentive:      { icon: '%',  accent: 'border-[hsl(25,100%,50%)]', iconBg: 'bg-orange-100 text-orange-600' },
  estimate_ready: { icon: '⚡', accent: 'border-purple-400',  iconBg: 'bg-purple-100 text-purple-700'  },
};
