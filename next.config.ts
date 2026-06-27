import type { NextConfig } from 'next';
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  env: {
    // MAPBOX_TOKEN is server-side in Infisical (matching svc-4-map convention).
    // Expose to client for Leaflet tile layers.
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.MAPBOX_TOKEN ?? '',
    // RELAY_URL not in Infisical — default to Coolify dev relay.
    RELAY_URL: process.env.RELAY_URL ?? 'https://tcp-relay.dev.keryk.ai',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
})(nextConfig);
