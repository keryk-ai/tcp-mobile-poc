import type { SVGProps } from 'react';

// Inline SVGs matching Ionicons v7 path data — same extraction approach as
// TabBar.tsx (Task 1). Shared between the Apps tile list and the offering
// detail sheet since both need the per-offering glyph plus a couple of
// fixed ones (chevron, checkmark).

function FlashOutline(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M315.27 33L96 304h128l-31.51 173.23a2.36 2.36 0 002.33 2.77h0a2.36 2.36 0 001.89-.95L416 208H288l31.66-173.25a2.45 2.45 0 00-2.44-2.75h0a2.42 2.42 0 00-1.95 1z" />
    </svg>
  );
}

function DocumentTextOutline(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="32" {...props}>
      <path d="M416 221.25V416a48 48 0 01-48 48H144a48 48 0 01-48-48V96a48 48 0 0148-48h98.75a32 32 0 0122.62 9.37l141.26 141.26a32 32 0 019.37 22.62z" strokeLinejoin="round" />
      <path d="M256 56v120a32 32 0 0032 32h120M176 288h160M176 368h160" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MegaphoneOutline(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M407.94 52.22S321.3 160 240 160H80a16 16 0 00-16 16v96a16 16 0 0016 16h160c81.3 0 167.94 108.23 167.94 108.23 6.06 8 24.06 2.52 24.06-9.83V62c0-12.31-17-18.82-24.06-9.78zM64 256s-16-6-16-32 16-32 16-32M448 246s16-4.33 16-22-16-22-16-22M256 160v128M112 160v128" />
      <path d="M144 288v168a8 8 0 008 8h53a16 16 0 0015.29-20.73C211.91 416.39 192 386.08 192 336h16a16 16 0 0016-16v-16a16 16 0 00-16-16h-16" />
    </svg>
  );
}

function ShieldCheckmarkOutline(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M336 176L225.2 304 176 255.8" />
      <path d="M463.1 112.37C373.68 96.33 336.71 84.45 256 48c-80.71 36.45-117.68 48.33-207.1 64.37C32.7 369.13 240.58 457.79 256 464c15.42-6.21 223.3-94.87 207.1-351.63z" />
    </svg>
  );
}

function ConstructOutline(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" {...props}>
      <path d="M436.67 184.11a27.17 27.17 0 01-38.3 0l-22.48-22.49a27.15 27.15 0 010-38.29l50.89-50.89a.85.85 0 00-.26-1.38C393.68 57 351.09 64.15 324.05 91c-25.88 25.69-27.35 64.27-17.87 98a27 27 0 01-7.67 27.14l-173 160.76a40.76 40.76 0 1057.57 57.54l162.15-173.3a27 27 0 0126.77-7.7c33.46 8.94 71.49 7.26 97.07-17.94 27.49-27.08 33.42-74.94 20.1-102.33a.85.85 0 00-1.36-.22z" strokeMiterlimit="10" />
      <path d="M224 284c-17.48-17-25.49-24.91-31-30.29a18.24 18.24 0 01-3.33-21.35 20.76 20.76 0 013.5-4.62l15.68-15.29a18.66 18.66 0 015.63-3.87 18.11 18.11 0 0120 3.62c5.45 5.29 15.43 15 33.41 32.52M317.07 291.3c40.95 38.1 90.62 83.27 110 99.41a13.46 13.46 0 01.94 19.92L394.63 444a14 14 0 01-20.29-.76c-16.53-19.18-61.09-67.11-99.27-107" strokeLinejoin="round" />
      <path d="M17.34 193.5l29.41-28.74a4.71 4.71 0 013.41-1.35 4.85 4.85 0 013.41 1.35h0a9.86 9.86 0 008.19 2.77c3.83-.42 7.92-1.6 10.57-4.12 6-5.8-.94-17.23 4.34-24.54a207 207 0 0119.78-22.6c6-5.88 29.84-28.32 69.9-44.45A107.31 107.31 0 01206.67 64c22.59 0 40 10 46.26 15.67a89.54 89.54 0 0110.28 11.64 78.92 78.92 0 00-9.21-2.77 68.82 68.82 0 00-20-1.26c-13.33 1.09-29.41 7.26-38 14-13.9 11-19.87 25.72-20.81 44.71-.68 14.12 2.72 22.1 36.1 55.49a6.6 6.6 0 01-.34 9.16l-18.22 18a6.88 6.88 0 01-9.54.09c-21.94-21.94-36.65-33.09-45-38.16s-15.07-6.5-18.3-6.85a30.85 30.85 0 00-18.27 3.87 11.39 11.39 0 00-2.64 2 14.14 14.14 0 00.42 20.08l1.71 1.6a4.63 4.63 0 010 6.64L71.73 246.6a4.71 4.71 0 01-3.41 1.4 4.86 4.86 0 01-3.41-1.35l-47.57-46.43a4.88 4.88 0 010-6.72z" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronForwardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M184 112l144 144-144 144" />
    </svg>
  );
}

export function CheckmarkCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" {...props}>
      <path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm108.25 138.29l-134.4 160a16 16 0 01-12 5.71h-.27a16 16 0 01-11.89-5.3l-57.6-64a16 16 0 1123.78-21.4l45.29 50.32 122.59-145.91a16 16 0 0124.5 20.58z" />
    </svg>
  );
}

const OFFERING_ICONS: Record<string, (props: SVGProps<SVGSVGElement>) => React.JSX.Element> = {
  'flash-outline': FlashOutline,
  'document-text-outline': DocumentTextOutline,
  'megaphone-outline': MegaphoneOutline,
  'shield-checkmark-outline': ShieldCheckmarkOutline,
  'construct-outline': ConstructOutline,
};

export function OfferingIcon({ name, ...props }: { name: string } & SVGProps<SVGSVGElement>) {
  const Cmp = OFFERING_ICONS[name] ?? ConstructOutline;
  return <Cmp {...props} />;
}
