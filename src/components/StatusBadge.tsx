interface StatusBadgeProps {
  status: 'processing' | 'success' | 'error';
  small?: boolean;
}

const CONFIG = {
  processing: { emoji: '🟡', label: 'Processing', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  success: { emoji: '🟢', label: 'Ready', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  error: { emoji: '🔴', label: 'Error', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export default function StatusBadge({ status, small = false }: StatusBadgeProps) {
  const cfg = CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${cfg.bg} ${cfg.text} ${cfg.border} ${
        small ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
    >
      {cfg.emoji} {cfg.label}
    </span>
  );
}
