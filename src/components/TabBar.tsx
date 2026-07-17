'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SVGProps } from 'react';

function MapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M313.27 124.64L198.73 51.36a32 32 0 00-29.28.35L56.51 127.49A16 16 0 0048 141.63v295.8a16 16 0 0023.49 14.14l97.82-63.79a32 32 0 0129.5-.24l111.86 73a32 32 0 0029.27-.11l115.43-75.94a16 16 0 008.63-14.2V74.57a16 16 0 00-23.49-14.14l-98 63.86a32 32 0 01-29.24.35zM328 128v336M184 48v336" />
    </svg>
  );
}

function FileTrayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M384 80H128c-26 0-43 14-48 40L48 272v112a48.14 48.14 0 0048 48h320a48.14 48.14 0 0048-48V272l-32-152c-5-27-23-40-48-40z" strokeLinejoin="round" />
      <path d="M48 272h144M320 272h144M192 272a64 64 0 00128 0" />
    </svg>
  );
}

function GridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="48" y="48" width="176" height="176" rx="20" ry="20" />
      <rect x="288" y="48" width="176" height="176" rx="20" ry="20" />
      <rect x="48" y="288" width="176" height="176" rx="20" ry="20" />
      <rect x="288" y="288" width="176" height="176" rx="20" ry="20" />
    </svg>
  );
}

function MicIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M192 448h128M384 208v32c0 70.4-57.6 128-128 128h0c-70.4 0-128-57.6-128-128v-32M256 368v80" />
      <path d="M256 64a63.68 63.68 0 00-64 64v111c0 35.2 29 65 64 65s64-29 64-65V128c0-36-28-64-64-64z" />
    </svg>
  );
}

const TABS = [
  { href: '/home', label: 'Home', Icon: MapIcon },
  { href: '/inbox', label: 'Inbox', Icon: FileTrayIcon },
  { href: '/apps', label: 'Apps', Icon: GridIcon },
  { href: '/ai', label: 'AI', Icon: MicIcon },
] as const;

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-stretch border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname?.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 ${
              active ? 'text-[hsl(25,100%,50%)]' : 'text-gray-400'
            }`}
          >
            {active && <span className="absolute top-0 inset-x-0 h-0.5 bg-[hsl(25,100%,50%)]" />}
            <Icon className="w-6 h-6" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
