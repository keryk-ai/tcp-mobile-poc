import type { SVGProps } from 'react';

// Inline SVGs matching Ionicons v7 path data — same extraction approach as
// TabBar.tsx (Task 1) / MarketplaceIcons.tsx (Task 4).

export function HourglassOutlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" {...props}>
      <path
        d="M145.61 464h220.78c19.8 0 35.55-16.29 33.42-35.06C386.06 308 304 310 304 256s83.11-51 95.8-172.94c2-18.78-13.61-35.06-33.41-35.06H145.61c-19.8 0-35.37 16.28-33.41 35.06C124.89 205 208 201 208 256s-82.06 52-95.8 172.94c-2.14 18.77 13.61 35.06 33.41 35.06z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path
        fill="currentColor"
        d="M343.3 432H169.13c-15.6 0-20-18-9.06-29.16C186.55 376 240 356.78 240 326V224c0-19.85-38-35-61.51-67.2-3.88-5.31-3.49-12.8 6.37-12.8h142.73c8.41 0 10.23 7.43 6.4 12.75C310.82 189 272 204.05 272 224v102c0 30.53 55.71 47 80.4 76.87 9.95 12.04 6.47 29.13-9.1 29.13z"
      />
    </svg>
  );
}

export function AlertCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" {...props}>
      <path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm0 319.91a20 20 0 1120-20 20 20 0 01-20 20zm21.72-201.15l-5.74 122a16 16 0 01-32 0l-5.74-121.94v-.05a21.74 21.74 0 1143.44 0z" />
    </svg>
  );
}

export function LocationOutlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M256 48c-79.5 0-144 61.39-144 137 0 87 96 224.87 131.25 272.49a15.77 15.77 0 0025.5 0C304 409.89 400 272.07 400 185c0-75.61-64.5-137-144-137z" />
      <circle cx="256" cy="192" r="48" />
    </svg>
  );
}

export function FileTrayOutlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="32" {...props}>
      <path d="M384 80H128c-26 0-43 14-48 40L48 272v112a48.14 48.14 0 0048 48h320a48.14 48.14 0 0048-48V272l-32-152c-5-27-23-40-48-40z" strokeLinejoin="round" />
      <path d="M48 272h144M320 272h144M192 272a64 64 0 00128 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckmarkDoneOutlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M464 128L240 384l-96-96M144 384l-96-96M368 128L232 284" />
    </svg>
  );
}

export function CalendarOutlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" {...props}>
      <rect fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="32" x="48" y="80" width="416" height="384" rx="48" />
      <circle cx="296" cy="232" r="24" fill="currentColor" />
      <circle cx="376" cy="232" r="24" fill="currentColor" />
      <circle cx="296" cy="312" r="24" fill="currentColor" />
      <circle cx="376" cy="312" r="24" fill="currentColor" />
      <circle cx="136" cy="312" r="24" fill="currentColor" />
      <circle cx="216" cy="312" r="24" fill="currentColor" />
      <circle cx="136" cy="392" r="24" fill="currentColor" />
      <circle cx="216" cy="392" r="24" fill="currentColor" />
      <circle cx="296" cy="392" r="24" fill="currentColor" />
      <path fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="32" strokeLinecap="round" d="M128 48v32M384 48v32" />
      <path fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="32" d="M464 160H48" />
    </svg>
  );
}
