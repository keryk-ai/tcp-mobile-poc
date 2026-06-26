# tcp-mobile-poc

Customer-facing mobile PWA for AWP enterprise customers to request traffic control plan estimates.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- Firebase JS SDK (auth + Firestore)
- Leaflet 1.9 (map with A/B pin placement)
- next-pwa (installable PWA)

## Setup

### 1. Clone and install

```bash
git clone https://github.com/keryk-ai/tcp-mobile-poc
cd tcp-mobile-poc
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local` with:
- Firebase project config (from Firebase console → Project settings → Your apps)
- `RELAY_URL` — TCP relay endpoint
- `SERVICE_AUTH_KEY` — relay service auth key
- `NEXT_PUBLIC_MAPBOX_TOKEN` — from Infisical (TCP project)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — from Infisical (TCP project)

### 3. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on a mobile browser or use Chrome DevTools mobile emulation.

## Firebase Emulator (optional)

To test auth without real Firebase credentials:

```bash
firebase emulators:start --only auth,firestore
```

Set `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost:9099` and configure emulator in `src/lib/firebase.ts`.

## Week 1 Features (this build)

- **Auth**: Firebase email/password login, session persistence, auth guard, logout
- **Home**: 4-card dashboard with AWP branding
- **Request flow**: 4-step form (Job Details → Map → Work Type → Review)
- **Map**: Leaflet pin placement with street/satellite toggle, distance/direction auto-calc
- **Submit**: POST to relay via `/api/estimate-proxy`, loading state, navigate to inbox on success
- **Inbox**: Org-scoped job list, job detail bottom sheet

## Week 2 Features (upcoming)

- Full inbox with real-time Firestore updates
- Job detail: pinch-zoom plan image, full BOM, download
- ElevenLabs voice AI assistant

## PWA Icons

The manifest currently references `awp-logo.jpg` as a placeholder. For production-quality PWA installability, replace with proper 192×192 and 512×512 PNG files at `public/icons/icon-192.png` and `public/icons/icon-512.png`, then update `public/manifest.json`.

## Architecture Notes

- Auth guard: Next.js middleware checks `firebase-auth` cookie (set after login, cleared on logout)
- Form state: `sessionStorage` via `src/lib/formState.ts`, cleared on submit or abandon
- Estimate submission: client → `/api/estimate-proxy` → relay (relay holds connection ~3–5s, returns `transaction_id` on success)
- Job detail: Firestore `onSnapshot` on `tcp_estimates_V1/{transactionId}`
