import type { ReactNode } from 'react';
import TabBar from './TabBar';
import AlphaNotice from './AlphaNotice';

interface AppShellProps {
  children: ReactNode;
  /** Wizard-style routes (e.g. /request) show their own bottom bar (StepNav)
   *  instead of the tab bar — set this to omit TabBar without duplicating
   *  the phone-column frame. */
  hideTabBar?: boolean;
}

export default function AppShell({ children, hideTabBar = false }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-[#121214]">
      <div className="mx-auto max-w-[430px] min-h-dvh bg-white dark:bg-neutral-900 flex flex-col relative">
        <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
        {!hideTabBar && (
          <div className="sticky bottom-0">
            <TabBar />
          </div>
        )}
        <AlphaNotice />
      </div>
    </div>
  );
}
