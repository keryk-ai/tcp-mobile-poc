import { ReactNode } from 'react';

export default function RequestLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Shared header for all request steps */}
      <div className="px-4 pt-safe pt-4 pb-2">
        <h1 className="text-base font-bold text-gray-900">Request a Site</h1>
      </div>
      {children}
    </div>
  );
}
