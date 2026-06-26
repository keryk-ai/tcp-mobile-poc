'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/components/AuthContext';
import ComingSoonSheet from '@/components/ComingSoonSheet';

export default function HomePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showFutureFeature, setShowFutureFeature] = useState(false);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'there';

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 border-b border-gray-100">
        <Image
          src="/awp-logo-horizontal.jpg"
          alt="AWP Safety"
          width={100}
          height={30}
          className="object-contain"
        />
        <div className="flex items-center gap-2 relative">
          <div className="text-right mr-1">
            <div className="text-xs font-semibold text-gray-900">Hi, {displayName}</div>
          </div>
          <button
            onClick={() => setShowLogoutMenu(!showLogoutMenu)}
            className="w-9 h-9 rounded-full bg-[hsl(25,100%,50%)] text-white font-bold text-sm flex items-center justify-center"
            aria-label="Profile"
          >
            {displayName.charAt(0).toUpperCase()}
          </button>

          {showLogoutMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowLogoutMenu(false)} />
              <div className="absolute right-0 top-11 z-20 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-w-[140px]">
                <div className="px-4 py-2.5 text-xs text-gray-500 border-b border-gray-100">
                  {user?.email}
                </div>
                <button
                  onClick={async () => { setShowLogoutMenu(false); await signOut(); }}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Cards */}
      <div className="flex-1 px-4 py-5 space-y-3">
        {/* Request Estimate */}
        <button
          onClick={() => router.push('/request/details')}
          className="w-full p-5 rounded-2xl bg-[hsl(25,100%,50%)] text-white text-left active:opacity-85"
        >
          <div className="text-3xl mb-1">+</div>
          <div className="font-bold text-xl">Request a Site</div>
          <div className="text-orange-100 text-sm mt-1">Get a work zone configuration for your site</div>
        </button>

        {/* Inbox */}
        <button
          onClick={() => router.push('/inbox')}
          className="w-full p-5 rounded-2xl bg-gray-50 border border-gray-200 text-left active:bg-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl mb-1">📬</div>
              <div className="font-bold text-gray-900 text-lg">Inbox</div>
              <div className="text-gray-500 text-sm mt-0.5">View your sites</div>
            </div>
          </div>
        </button>

        {/* Ask AWP AI */}
        <button
          onClick={() => router.push('/ai')}
          className="w-full p-5 rounded-2xl bg-gray-50 border border-gray-200 text-left active:bg-gray-100"
        >
          <div className="text-2xl mb-1">🎙</div>
          <div className="font-bold text-gray-900 text-lg">Ask AWP Traffic Safety AI</div>
          <div className="text-gray-500 text-sm mt-0.5">Voice conversation with our AI assistant</div>
        </button>

        {/* Future Feature (Coming Soon) */}
        <button
          onClick={() => setShowFutureFeature(true)}
          className="w-full p-5 rounded-2xl border-2 border-dashed border-gray-300 text-left active:bg-gray-50"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-2xl mb-1">✦</div>
              <div className="font-semibold text-gray-500 text-lg">Future Feature</div>
              <div className="text-gray-400 text-sm mt-0.5">More AWP tools coming to this platform</div>
            </div>
            <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-1 rounded-full mt-1">
              Coming Soon
            </span>
          </div>
        </button>
      </div>

      <ComingSoonSheet
        isOpen={showFutureFeature}
        onClose={() => setShowFutureFeature(false)}
        title="Coming Soon"
        message="AWP is building more tools on this platform. Upcoming features include permit management, inspector scheduling, compliance documentation, and more."
      />
    </div>
  );
}
