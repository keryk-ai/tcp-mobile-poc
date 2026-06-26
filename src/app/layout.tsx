import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthContext';

export const metadata: Metadata = {
  title: 'AWP Traffic Plans',
  description: 'Request traffic control plan estimates',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TCP Plans',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FF6B00',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/awp-logo.jpg" />
      </head>
      <body className="min-h-screen bg-white">
        <AuthProvider>
          <main className="max-w-md mx-auto min-h-screen">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
