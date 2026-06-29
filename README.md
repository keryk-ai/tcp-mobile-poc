# tcp-mobile-poc

Customer-facing mobile PWA for AWP enterprise customers to request traffic control plan estimates, view site status, schedule crews, and interact with an AI traffic safety expert.

**Live deployment:** `https://awp.dev.keryk.ai`

## Stack

- Next.js 15 (App Router) + TypeScript strict mode
- Tailwind CSS v4
- Firebase JS SDK v11 (auth + Firestore `onSnapshot`)
- Leaflet 1.9 (map with A/B pin placement)
- ElevenLabs Conversational AI widget (`elevenlabs-convai` web component)
- Docker + Coolify deployment

## Setup

### 1. Clone and install

```bash
git clone https://github.com/keryk-ai/tcp-mobile-poc
cd tcp-mobile-poc
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` is required: `react-leaflet@4.2.1` declares a React 18 peer dep but works fine with React 19.

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Firebase (client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Relay
RELAY_URL=https://tcp-relay.dev.keryk.ai   # server-side only
SERVICE_AUTH_KEY=                           # injected by /api/estimate-proxy

# Maps
NEXT_PUBLIC_MAPBOX_TOKEN=                  # Mapbox satellite tile layer
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=           # geocode fallback

# ElevenLabs
NEXT_PUBLIC_AWP_AGENT_ID=agent_8301kw2ea0h1ex0af3yjjee8kwef
```

### 3. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on a mobile browser or use Chrome DevTools mobile emulation (iPhone 14 Pro recommended).

## Features

### Authentication
Firebase email/password login. Custom claim `org` scopes each user to their organization (e.g., `"verizon"`). Auth guard via Next.js middleware.

### Home — Map View
Three-tab interface showing all sites for the user's org:
- **New Sites** (orange) — AI estimates generated, not yet scheduled
- **Scheduled** (amber) — booked crew with date, weather forecast, nearby work, and permit restrictions
- **Completed** (green) — finished jobs with downloadable invoice

Bell icon in header shows unread notifications (job complete, TCP ready, incentive, predicted job alert, partner offer).

### Request Flow (4 steps)
1. **Details** — Work Order #, address (with GPS auto-fill), time of day, construction type
2. **Map** — Leaflet A/B pin placement; distance and direction auto-calculated
3. **Work Type** — Flagging (TA-10), Lane Closure (TA-30/30R/33), Complex Job — Request a TCP, or Shoulder Closure (coming soon)
4. **Review** — Confirm and submit to relay; navigate to inbox on success

**Complex Job path:** Bypasses the AI estimate entirely — sends site details to an AWP engineer who delivers a compliant TCP within 72 hours. Shows a sending overlay and returns to home.

### Job Detail Sheet
Opens as a bottom sheet from the inbox or New Sites list. Shows:
- AI-generated plan image + BOM (signs, devices, cones, stands, sandbags)
- Action buttons: Analyze Site Risks (coming soon), Request a Quote (coming soon), Request a TCP (live), Schedule a Crew (live)

### Schedule a Crew
Two-week calendar with weather forecast and crew availability per day. Fridays include a 5% discount badge. Confirm to book; success state returns to site detail.

### Notifications
Five types: job complete, TCP ready, incentive, predicted job alert (behavioral analytics), partner offer. Unread badge on bell icon. Action links deep-link to relevant demo sites.

### AI Voice Assistant
ElevenLabs `elevenlabs-convai` web component embedded in the request flow. Activated from the "Not sure? Ask the AWP AI Expert" link on the work-type step. Agent system prompt at `awp-traffic-safety-ai-system-prompt.md` (v1.7).

### Demo Data
Two hardcoded demo sites in `src/lib/demoData.ts`:
- `demo-scheduled-001` — Duke Energy, 7936 Old Salisbury Rd, Linwood NC (July 15 2026)
- `demo-completed-001` — Verizon, 4400 Sharon Rd, Charlotte NC (completed June 15 2026)

## Architecture Notes

- **Auth guard:** Next.js middleware checks `firebase-auth` cookie; set after login, cleared on logout
- **Form state:** `sessionStorage` via `src/lib/formState.ts`; cleared on submit or abandon. `clearFormState()` is called after Complex Job submission.
- **Estimate submission:** client → `/api/estimate-proxy` → relay (~3–5s sync); navigates to inbox on `200`
- **Real-time updates:** Firestore `onSnapshot` on org-scoped query and individual job docs
- **ElevenLabs widget:** Dynamic variables injected as JSON attribute: `user_email`, `session_tenant_id`, `session_id`, `job_id`, `session_agent_id`, `location_lat`, `location_lng`
- **Leaflet + React 19:** `_leaflet_id` cleared on map container ref to fix StrictMode double-invoke
- **React 19 JSX:** Custom web component types declared via `declare module 'react' { namespace JSX { ... } }` (not `declare global`)

## Deployment

Docker multi-stage build. **Must use `--platform linux/amd64`** — Coolify runs on amd64; Mac M-series builds arm64 by default.

```bash
docker buildx build --platform linux/amd64 --push \
  -t ghcr.io/keryk-ai/tcp-mobile-poc:latest \
  -f Dockerfile .
```

Build args baked at build time (NEXT_PUBLIC_* vars must be passed as `--build-arg`). See Dockerfile.

## Test Accounts

Two demo accounts provisioned with `org: 'verizon'` Firebase custom claim:
- `john.candelaria@awpsafety.com`
- `josh.shipman@awpsafety.com`

## Related Documents

| Document | Purpose |
|---|---|
| `tcp-mobile-poc-spec.md` | Full product specification |
| `mobile-poc-user-stories.md` | User stories and acceptance criteria |
| `awp-traffic-safety-ai-system-prompt.md` | ElevenLabs agent system prompt (v1.7) |
| `elevenlabs-agent-evals.md` | Agent QA test suite (33 tests, 23 P0) |
| `elevenlabs-agent-config.json` | Agent config snapshot |
