import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthContext';

export const metadata: Metadata = {
  title: 'AWP Mobile',
  description: 'Request traffic control plan estimates',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AWP Mobile',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#121214',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/awp-icon-180.png" />
      </head>
      <body className="min-h-screen bg-[#121214]">
        <AuthProvider>
          <main className="max-w-md mx-auto min-h-screen">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
