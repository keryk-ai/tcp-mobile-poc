import type { ReactNode } from 'react';
import TabBar from './TabBar';
import AlphaNotice from './AlphaNotice';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#121214]">
      <div className="mx-auto max-w-[430px] min-h-dvh bg-white dark:bg-neutral-900 flex flex-col relative">
        <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
        <div className="sticky bottom-0">
          <TabBar />
        </div>
        <AlphaNotice />
      </div>
    </div>
  );
}
