# TCP Mobile App — POC Specification

**Version:** 2.0  
**Date:** 2026-06-29  
**Status:** POC delivered — see Section 15 for current state vs. original spec  
**Owners:** Morgan Stern (product), Wade (pipeline/relay), TBD (mobile dev)

**Related documents:**
- User stories: `mobile-poc-user-stories.md`
- Agent system prompt: `awp-traffic-safety-ai-system-prompt.md`
- Agent config snapshot: `elevenlabs-agent-config.json`
- Brand reference: `globals.reference.css`, `tailwind.reference.mjs`

---

## 1. Purpose & Scope

This spec defines the customer-facing mobile app that lets AWP's enterprise customers (Lumos, Verizon, Duke, etc.) request traffic control plan estimates from their phone and view results asynchronously.

The delivered POC includes:
1. **Request an Estimate** — 4-step flow (details, map pins, work type, review); submits to relay, navigates to inbox on success
2. **Complex Job — Request a TCP** — bypasses AI estimate, routes directly to AWP engineer; TCP delivered within 72 hours
3. **Home Map View** — three-tab interface (New/Scheduled/Completed) with Leaflet map, colored pins, and a site list
4. **Inbox** — real-time org-scoped Firestore feed with job detail bottom sheet
5. **Schedule a Crew** — two-week calendar with weather, crew availability, and Friday discount
6. **Notifications** — bell icon with five notification types including behavioral prediction alerts and partner offers
7. **Demo Content** — hardcoded scheduled and completed sites with contextual data (weather, nearby work, restrictions, invoice)
8. **Ask AWP Traffic Safety AI** — ElevenLabs `elevenlabs-convai` web component embedded in the request flow

### Platform Vision

The home screen is designed as a **launchpad**, not just a single-purpose tool. Each card on the home screen represents a product or capability AWP offers (or will offer) to enterprise customers. The POC ships with three live features and one visible "Future Feature" placeholder card — demonstrating to customers and AWP stakeholders that this is an extensible platform, not a one-off app. Future cards could represent permit management, inspector scheduling, fleet/flagger tracking, compliance documentation, safety training, and more.

This document covers the input/inbox app only. Pipeline behavior (relay, svc-4-map) is defined in Wade's integration spec (`2026-06-26-mobile-estimate-integration.md`).

---

## 2. Stack Decision

### POC: Next.js PWA (immediate)

Build the POC as a **mobile-first Next.js web app** deployed as a Progressive Web App.

**Rationale:**
- Reuses Firebase auth, API proxy routes, Leaflet maps, and relay payload code directly from `svc-frontend`
- ElevenLabs `@11labs/react` hook works natively in browser — no audio pipeline complexity
- Zero app store friction — share a URL, open in Chrome on demo device
- Same Docker/Coolify deployment pipeline already in place
- Estimated POC delivery: ~2 weeks vs ~4 weeks for React Native

**Constraints:** Demo runs on controlled devices (Chrome on Android or Safari iOS 16.4+). No pervasive device coverage required for POC.

### Production: React Native + Expo (after POC validation)

Migrate to React Native + Expo SDK 52 after the POC is validated with AWP customers. The Next.js POC serves as the UX/design reference. Firebase, relay API, and Firestore patterns carry over unchanged.

---

## 3. Architecture

### Repo

New standalone repo: **`tcp-mobile-poc`**. Not bolted onto `svc-frontend`. Mobile-first CSS from day one.

### Tech Stack (POC)

| Layer | Choice |
|---|---|
| Framework | Next.js 15, App Router, TypeScript |
| Styling | Tailwind CSS v4 (mobile-first breakpoints) |
| Auth | Firebase JS SDK — same project as production |
| Maps | Leaflet 1.9 + Mapbox Satellite Streets (satellite view) + OpenStreetMap (street view) |
| Realtime data | Firebase Firestore `onSnapshot()` |
| Voice AI | ElevenLabs `elevenlabs-convai` web component (replaces `@11labs/react` hook) |
| HTTP | `fetch` with typed wrappers |
| Deploy | Docker + Coolify (same pipeline as other services) |
| PWA | `next-pwa` — manifest + service worker for home screen install |

### Code reused from `svc-frontend`

Copy verbatim (no changes needed):
- `lib/firebase.ts` — Firebase init
- `lib/auth.ts` — `signIn`, `signOut`
- `components/AuthContext.tsx` — `useAuth()` hook
- `app/api/segment-proxy/route.ts` → adapt as `/api/estimate-proxy/route.ts`
- `app/api/geocode/route.ts` — Nominatim + Google Maps fallback
- `lib/mapUtils.ts` — bearing, distance, direction calculations

### Directory Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root — AuthProvider, PWA meta tags, viewport
│   ├── page.tsx                    # Redirect → /home or /login
│   ├── login/
│   │   └── page.tsx                # Firebase email/password login
│   ├── home/
│   │   └── page.tsx                # Map view — New/Scheduled/Completed tabs, notification bell
│   ├── request/
│   │   ├── layout.tsx              # Step flow wrapper + ElevenLabsWidget
│   │   ├── details/page.tsx        # Step 1: WO#, address (GPS), time, construction type
│   │   ├── map/page.tsx            # Step 2: Leaflet 2-pin picker
│   │   ├── work-type/page.tsx      # Step 3: Flagging / Lane Closure / Complex Job / Shoulder Closure
│   │   └── review/page.tsx         # Step 4: Confirm + submit (skipped for Complex Job)
│   ├── inbox/
│   │   └── page.tsx                # Firestore org-scoped job list + JobDetailSheet
│   ├── ai/
│   │   └── page.tsx                # Standalone AI page (secondary entry point)
│   └── api/
│       ├── estimate-proxy/
│       │   └── route.ts            # POST /estimate proxy (injects auth header)
│       └── geocode/
│           ├── route.ts            # Address search
│           └── reverse/
│               └── route.ts        # Reverse geocode (lat/lng → street address)
├── components/
│   ├── AuthContext.tsx              # useAuth() hook — Firebase auth state
│   ├── PinMap.tsx                  # Leaflet map — A/B pin placement
│   ├── SiteMapView.tsx             # Home map — colored site pins, tab-aware filtering
│   ├── JobDetailSheet.tsx          # Bottom sheet — plan image, BOM, action buttons
│   ├── DemoSiteSheet.tsx           # Bottom sheet — scheduled/completed demo site detail
│   ├── AWPDocumentView.tsx         # Styled AWP estimate/invoice renderer (mode: estimate|invoice)
│   ├── ScheduleCalendarSheet.tsx   # 2-week crew booking calendar with weather + Friday discount
│   ├── NotificationSheet.tsx       # Bell notification panel — 5 types, read/unread state
│   ├── ElevenLabsWidget.tsx        # elevenlabs-convai web component wrapper with dynamic vars
│   ├── StepNav.tsx                 # Progress bar + back/next buttons
│   ├── StatusBadge.tsx             # Processing / Ready / Failed badge
│   └── ComingSoonSheet.tsx         # Reusable bottom sheet for Coming Soon features
├── lib/
│   ├── firebase.ts                 # Firebase init
│   ├── auth.ts                     # signIn, signOut
│   ├── api.ts                      # buildEstimatePayload() + postEstimate()
│   ├── mapUtils.ts                 # Haversine distance, bearing, cardinal direction
│   ├── formState.ts                # sessionStorage form state (get/set/clear)
│   ├── taLogic.ts                  # buildEstimateWork() — work type → relay payload
│   ├── demoData.ts                 # DEMO_SITES — hardcoded scheduled/completed sites
│   └── notifications.ts            # MOCK_NOTIFICATIONS — 5 types, TYPE_CONFIG
├── types/
│   └── estimate.ts                 # EstimatePayload, EstimateDoc, BOMResult, FormState, WorkType
└── public/
    ├── manifest.json               # PWA manifest
    ├── keryk-ai-logo.png           # Keryk AI footer logo
    ├── awp-estimate-placeholder.png # Placeholder estimate image for scheduled demo site
    └── icons/                      # 192×192, 512×512 app icons
```

---

## 4. Auth Model

### Firebase Auth

Users authenticate with email + password via Firebase. Same Firebase project as the rest of TCP.

### Customer Org (`customer_org`)

Each user belongs to an organization (e.g., `"lumos"`, `"verizon"`, `"duke"`). AWP provisions accounts manually. The org is stored as a **Firebase custom claim** set at provisioning time:

```
auth.token.org = "lumos"
```

Relay reads this from the verified ID token on every `POST /estimate` request and writes it into `metadata.customer_org` on the Firestore doc.

**Why custom claims:** Zero infrastructure beyond the provisioning step. Tamper-proof (baked into the signed token). No extra Firestore read per request. Updates require token refresh (user re-login), which is acceptable for an org change.

### Firestore Security Rules

**Scoping: per-org.** All users at Lumos see all Lumos estimates. This supports team collaboration (crew supervisors covering for teammates, etc.).

```javascript
match /tcp_estimates_V1/{estimateId} {
  allow read: if request.auth.token.org == resource.data.metadata.customer_org;
  allow write: if false;  // relay writes only; client is read-only
}
```

The inbox query filters by `metadata.customer_org == currentUser.token.org`. A "Mine" toggle can filter further by `metadata.submitted_by_uid`.

---

## 5. API Contract

### Submit Estimate

**Endpoint (relay):** `POST /estimate`  
**Proxied via:** `POST /api/estimate-proxy` (Next.js route — injects Bearer token, hides relay URL)

**Request headers:**
```
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Request body:**
```typescript
{
  workOrderId: string;          // user-entered WO# (e.g., "WO-2024-001")
  segmentId:   string;          // same as workOrderId or generate uuid
  client:      string;          // customer_org from Firebase custom claim (e.g., "lumos")
  work: {
    description:  string;       // "Flagging Operation" | "Lane Closure" | "Shoulder Closure"
    taNumber:     string | null; // "ta-10" for flagging; null for lane closure (relay derives from OSM)
    duration:     "Short-Term";
    timeOfDay:    "Day" | "Night";
    constructionType: string;   // "underground" | "overhead" | "other"
    isRoadCrossing:   false;
    dynamicFields: {
      direction:      string;   // "Northbound" | "Southbound" | "Eastbound" | "Westbound"
      selected_lane?: "left" | "right"; // lane closure only — relay uses this to resolve TA-30 vs TA-30R
    }
  };
  location: {
    startLat: number;
    startLon: number;
    endLat:   number;
    endLon:   number;
    address:  string;           // user-entered work address
  };
}
```

**Per work type:**
| Work Type | `taNumber` | `selected_lane` |
|---|---|---|
| Flagging | `"ta-10"` | omitted |
| Lane Closure | `null` | `"left"` or `"right"` (required — determines TA-30 vs TA-30R vs TA-33) |
| Shoulder Closure | Coming Soon — not supported in v1 | — |
```

**Success response (200, sync ~3–5s):**
```json
{
  "transaction_id": "<uuid>",
  "status": "accepted"
}
```

The relay holds the HTTP connection open for the full pipeline (svc1 → svc3 → svc4-map). The `200` response means the estimate is written to Firestore and the `estimate_response` field is present. The app can navigate directly to the job detail view on receipt.

**Error responses:**
```json
{ "error": "unauthorized", "details": "..." }   // 401
{ "error": "invalid_payload", "details": "..." } // 400
```

### ElevenLabs Signed URL

**Endpoint:** `POST /api/elevenlabs/signed-url`  
**Auth:** Firebase session (same middleware as estimate-proxy)

**Request:**
```json
{ "agentId": "<awp-traffic-safety-agent-id>", "tenantId": "awp" }
```

**Response:**
```json
{ "signedUrl": "wss://...", "expiresIn": 900 }
```

Server-side route uses `ELEVENLABS_API_KEY` (never exposed to client) to call ElevenLabs SDK and return the signed WebSocket URL.

---

## 6. Firestore Schema

**Collection:** `tcp_estimates_V1`  
**Doc ID:** `transaction_id` (UUID, returned by relay on submit)  
**Firebase project:** same as production (`relay_transactions_V2`)

### Doc lifecycle

**Created by relay on POST /estimate:**
```json
{
  "id": "<uuid>",
  "service1_input": { "payload": "<json string>" },
  "metadata": {
    "status":             "estimate_pending",
    "created_at":         "2026-06-26T14:00:00Z",
    "updated_at":         "2026-06-26T14:00:00Z",
    "submitted_by_uid":   "<firebase-uid>",
    "submitted_by_email": "sarah@lumos.com",
    "customer_org":       "lumos"
  }
}
```

**Pipeline appends as stages complete:**
```json
{
  "service1_response": { "payload": "<json>", "responded_at": "...", "status_code": 200 },
  "service3_response": { "payload": "<json>", "responded_at": "...", "status_code": 200 },
  "metadata": { "status": "service3_complete", "updated_at": "..." }
}
```

**svc-4-map writes the result (success):**
```json
{
  "estimate_response": {
    "status":             "success",
    "image_storage_path": "estimates/<jobId>/<timestamp>.png",
    "image_signed_url":   "https://storage.googleapis.com/...",
    "image_dimensions":   { "width": 1920, "height": 1080 },
    "plan_extent_meters": { "width": 240, "height": 135 },
    "feet_per_inch":      117.5,
    "bom": {
      "totals": {
        "signCount": 12, "deviceCount": 4, "flaggerCount": 0,
        "coneCount": 80, "rawConeCount": 76,
        "standCount": 8, "sandbagCount": 16
      },
      "signs":   [{ "label": "ROAD_WORK_AHEAD", "mutcdCode": "W20-1", "quantity": 4 }],
      "devices": [{ "type": "TYPE_III_BARRICADE", "quantity": 4 }]
    },
    "generated_at":       "2026-06-26T14:00:05Z",
    "generation_time_ms": 2847
  }
}
```

**svc-4-map writes the result (failure):**
```json
{
  "estimate_response": {
    "status":             "failed",
    "failure_reason":     "no_road_data",
    "error":              "Overpass returned 0 roads for bbox(...)",
    "generated_at":       "2026-06-26T14:00:01Z",
    "generation_time_ms": 412
  }
}
```

**`failure_reason` values:**
`no_road_data | pipeline_error | storage_upload_failed | job_not_found | unknown`

### Inbox query

```typescript
// All estimates for the user's org, newest first
db.collection('tcp_estimates_V1')
  .where('metadata.customer_org', '==', currentUser.token.org)
  .orderBy('metadata.created_at', 'desc')
  .limit(50)

// Real-time watch on a single estimate after submit
db.collection('tcp_estimates_V1').doc(transactionId).onSnapshot(handler)
```

### "Is it done?" logic

```typescript
const isDone    = doc.estimate_response != null;
const isSuccess = doc.estimate_response?.status === 'success';
const isFailed  = doc.estimate_response?.status === 'failed';
```

`metadata.review_status` is **not** used in the estimate flow — that field is reserved for human-review outcomes in the production flow.

---

## 7. TA Derivation Logic

The user selects a work type and, for lane closures, which lane is being closed. The relay then derives the exact TA code by combining the user's lane selection with OSM road geometry from the pin coordinates.

### Work types (user-facing)

| User selection | `taNumber` sent | TA resolved by | Notes |
|---|---|---|---|
| Flagging | `"ta-10"` | Client (deterministic) | Always TA-10 |
| Lane Closure | `null` | Relay (OSM geometry + `selected_lane`) | Relay resolves TA-30, TA-30R, or TA-33 |
| Complex Job — Request a TCP | — | Not submitted to relay | Bypasses estimate; sends site to AWP engineer; overlay shown then navigate to home |
| Shoulder Closure | — | Not supported in v1 | Card opens ComingSoonSheet |

**Relay TA resolution for lane closure (from `relay.py: derive_ta_code()`):**
- `road_type=multi-lane-road + selected_lane=left` → **TA-30** (left lane closure, undivided road)
- `road_type=multi-lane-road + selected_lane=right` → **TA-30R** (right lane closure, undivided road)
- `road_type=divided-highway or freeway` → **TA-33** (either lane; dual sign deployment — shoulder + median)

The relay reads road type from OSM via the geocoder at the pin coordinates. The app sends `selected_lane` so the relay can distinguish TA-30 from TA-30R on undivided roads. The app does **not** ask the user about median presence — TA-33 is derived entirely from road geometry.

### `taLogic.ts`

```typescript
type WorkType = 'flagging' | 'lane-closure' | 'tcp-request';
type LaneSide = 'left' | 'right';

export function buildEstimateWork(
  workType: WorkType,
  direction: string,
  selectedLane?: LaneSide,
) {
  if (workType === 'flagging') {
    return {
      description:     'Flagging Operation',
      taNumber:        'ta-10',
      duration:        'Short-Term',
      isRoadCrossing:  false,
      dynamicFields:   { direction },
    };
  }
  // Lane closure — relay derives TA from OSM + selected_lane
  return {
    description:     'Lane Closure',
    taNumber:        null,
    duration:        'Short-Term',
    isRoadCrossing:  false,
    dynamicFields:   { direction, selected_lane: selectedLane },
  };
  // Note: 'tcp-request' never calls buildEstimateWork — it bypasses the relay entirely.
}
```

---

## 8. UI Screens

### Navigation structure

```
/login              → Login
/home               → Map view — New/Scheduled/Completed tabs
/request/details    → Step 1: Job details
/request/map        → Step 2: Pin placement
/request/work-type  → Step 3: Work type (Flagging / Lane Closure / Complex Job / Shoulder Closure)
/request/review     → Step 4: Confirm + submit (skipped for Complex Job — goes home after overlay)
/inbox              → Estimate list (Firestore onSnapshot, org-scoped)
/ai                 → Standalone AI page (secondary entry point)
```

Step flow uses URL-based navigation with shared state in `sessionStorage` (form data persists across steps, cleared on submit or abandon).

---

### Screen: Login

```
┌────────────────────────────────┐
│                                │
│         [AWP Logo]             │
│    Traffic Control Plans       │
│                                │
│  Email                         │
│  ┌──────────────────────────┐  │
│  │ name@company.com         │  │
│  └──────────────────────────┘  │
│                                │
│  Password                      │
│  ┌──────────────────────────┐  │
│  │ ••••••••                 │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │         Sign In          │  │
│  └──────────────────────────┘  │
│                                │
│      Forgot password?          │
│                                │
└────────────────────────────────┘
```

Firebase email/password. On success, redirect to `/home`. Persist session with Firebase `setPersistence(LOCAL)`.

---

### Screen: Home Dashboard

```
┌────────────────────────────────┐
│ [AWP]           Hi, Sarah [👤] │
│                 Lumos Networks │
│────────────────────────────────│
│                                │
│  ┌──────────────────────────┐  │
│  │                          │  │
│  │   +  Request an          │  │
│  │      Estimate            │  │
│  │                          │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │  📬  Inbox          [3]  │  │
│  └──────────────────────────┘  │
│       ↑ count of unviewed      │
│         ready estimates        │
│                                │
│  ┌──────────────────────────┐  │
│  │  🎙  Ask AWP Traffic     │  │
│  │      Safety AI           │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │  ✦  Future Feature  Coming│  │
│  │                     Soon  │  │  ← platform teaser card
│  └──────────────────────────┘  │
│                                │
└────────────────────────────────┘
```

Inbox badge count = estimates where `estimate_response.status === 'success'` that the user hasn't viewed this session. Computed from the org's Firestore subscription on home mount.

**Future Feature card:** Visually distinct from the three live cards — muted/outlined style with a "Coming Soon" pill badge. Tapping it opens a bottom sheet:

```
┌────────────────────────────────┐
│  Coming Soon                   │
│────────────────────────────────│
│                                │
│  AWP is building more tools    │
│  on this platform. Upcoming    │
│  features include permit        │
│  management, inspector          │
│  scheduling, compliance         │
│  documentation, and more.      │
│                                │
│  ┌──────────────────────────┐  │
│  │         Got It           │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

No navigation, no API call. The card exists to communicate platform vision during demos.

---

### Screen: Request — Step 1 (Job Details)

```
┌────────────────────────────────┐
│ ←   Request an Estimate        │
│  ●────○────○────○              │
│  Details Map  Type  Review     │
│────────────────────────────────│
│                                │
│  Work Order #                  │
│  ┌──────────────────────────┐  │
│  │ WO-2024-001              │  │
│  └──────────────────────────┘  │
│                                │
│  Work Address                  │
│  ┌──────────────────────────┐  │
│  │ 123 Main St, Charlotte   │  │
│  └──────────────────────────┘  │
│                                │
│  Time of Day                   │
│  ┌──────────┐  ┌────────────┐  │
│  │  ● Day   │  │  ○ Night   │  │
│  └──────────┘  └────────────┘  │
│                                │
│  Construction Type             │
│  ○ Underground                 │
│  ○ Overhead                    │
│  ○ Other                       │
│                                │
│  ┌──────────────────────────┐  │
│  │          Next →          │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

All fields required. Address is free-text (geocoded in Step 2 when user places pins on map, or when the map auto-centers on the address).

---

### Screen: Request — Step 2 (Map — Pin Placement)

```
┌────────────────────────────────┐
│ ←   Request an Estimate        │
│  ●────●────○────○              │
│────────────────────────────────│
│  [Street]  [Satellite]         │
│┌──────────────────────────────┐│
││                              ││
││  Tap to place start point    ││  ← instruction banner
││                              ││
││  [OpenStreetMap tiles]       ││
││                              ││
││  📍A                        ││  ← placed after first tap
││         📍B                 ││  ← placed after second tap, draggable
││                              ││
│└──────────────────────────────┘│
│  Map height: ~55% of screen    │
│────────────────────────────────│
│  Start:   123 Main St          │
│  End:     tap map to set       │
│  Distance: 850 ft              │
│  Direction: Northbound         │
│────────────────────────────────│
│  ┌──────────────────────────┐  │
│  │          Next →          │  │  disabled until both pins placed
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

**Pin placement phases (B → A → C in priority order):**
- **B (current):** Tap map to place pin A, tap again to place pin B. Both pins draggable.
- **A (Phase 2):** Search bar — type address, jump map to location, auto-place pin A.
- **C (Phase 2):** "Use my location" button — device GPS sets pin A.

Distance and direction auto-calculate from pin positions using `mapUtils.ts` (Haversine + bearing). Map auto-centers on geocoded address from Step 1 on mount.

**Tile layers:** Street view uses OpenStreetMap tiles (free, no key). Satellite view uses Mapbox Satellite Streets (`mapbox/satellite-streets-v12`) via `NEXT_PUBLIC_MAPBOX_TOKEN`. Mapbox was chosen over Google Maps for better Leaflet integration (standard tile URL pattern, no separate SDK), a generous free tier (50k loads/month), and predictable billing if production usage grows. The `[Street] [Satellite]` toggle switches between tile providers at runtime — no page reload.

---

### Screen: Request — Step 3 (Work Type)

Default state (no selection):
```
┌────────────────────────────────┐
│ ←   Request an Estimate        │
│  ●────●────●────○              │
│────────────────────────────────│
│                                │
│  Work Type                     │
│  ┌──────────────────────────┐  │
│  │  🚩  Flagging            │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  🚧  Lane Closure        │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  🛞  Shoulder Closure    │  │  ← opens ComingSoonSheet on tap
│  │              Coming Soon │  │
│  └──────────────────────────┘  │
│────────────────────────────────│
│  ...                           │
└────────────────────────────────┘
```

Lane Closure selected (reveals lane and direction fields):
```
┌────────────────────────────────┐
│ ←   Request an Estimate        │
│  ●────●────●────○              │
│────────────────────────────────│
│                                │
│  Work Type                     │
│  ┌──────────────────────────┐  │
│  │  🚩  Flagging            │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  🚧  Lane Closure     ●  │  │  ← selected
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  🛞  Shoulder Closure    │  │
│  │              Coming Soon │  │
│  └──────────────────────────┘  │
│────────────────────────────────│
│  Which lane is being closed?   │
│  ┌──────────┐  ┌────────────┐  │
│  │ ● Left   │  │  ○ Right   │  │
│  └──────────┘  └────────────┘  │
│                                │
│  Direction of travel:          │
│  ┌──────────────────────────┐  │
│  │  Northbound            ▾ │  │  ← pre-filled from Step 2 bearing
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │          Next →          │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

Two selectable work types: **Flagging** and **Lane Closure**. **Shoulder Closure** is visible but disabled — tapping it opens `ComingSoonSheet` (no TA code exists yet; planned for a future release).

**Lane Closure:** Reveals a "Which lane?" toggle (Left / Right). The relay uses this (`selected_lane`) along with OSM road geometry to resolve TA-30, TA-30R, or TA-33 — the user never sees raw TA codes at this step.

**Flagging:** No lane toggle shown. TA-10 is deterministic; direction is the only additional field.

**Direction:** Pre-populated from the bearing auto-calculated in Step 2 (A→B vector → cardinal direction). User can override. Direction is collected for both work types.

---

### Screen: Request — Step 4 (Review & Submit)

```
┌────────────────────────────────┐
│ ←   Request an Estimate        │
│  ●────●────●────●              │
│────────────────────────────────│
│  ┌──────────────────────────┐  │
│  │  [map thumbnail]         │  │
│  │   📍A ─────────── 📍B   │  │
│  └──────────────────────────┘  │
│────────────────────────────────│
│  Work Order   WO-2024-001      │
│  Address      123 Main St      │
│               Charlotte, NC    │
│  Time         Day              │
│  Construction Underground      │
│  Work Type    Lane Closure     │
│  Lane         Left             │  ← shown for lane closure only
│  Direction    Northbound       │
│  Distance     850 ft           │
│────────────────────────────────│
│  ┌──────────────────────────┐  │
│  │  ⓘ Draft budgetary       │  │
│  │    estimate only. For a   │  │
│  │    compliant TCP, order   │  │
│  │    a reviewed plan from   │  │
│  │    the result screen.     │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │   ✏ Edit                 │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │   ✓  Submit Request      │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

"Edit" navigates back to Step 1 preserving all values. "Submit" calls `POST /api/estimate-proxy`, shows inline loading state ("Generating your estimate…" with spinner), then navigates to Job Detail on `200` response.

**Plan (TA) removed from review:** TA code is no longer shown at Step 4 — the pipeline determines it after submission. The job detail screen shows the resolved TA code once the plan is ready.

---

### Screen: Generating (inline on Review or brief interstitial)

```
┌────────────────────────────────┐
│                                │
│                                │
│         ◌  (spinner)           │
│                                │
│    Generating your estimate…   │
│                                │
│    This takes about 3–5        │
│    seconds.                    │
│                                │
│                                │
└────────────────────────────────┘
```

Since relay is sync (~3–5s), this is shown while `await fetch('/api/estimate-proxy')` resolves. On `200`, navigate directly to `/inbox/[transaction_id]`.

---

### Screen: Inbox

```
┌────────────────────────────────┐
│ ←  Inbox                       │
│────────────────────────────────│
│  🔍 Search…         [All ▾]    │
│────────────────────────────────│
│  WO-2024-099                   │
│  Lumos · 456 Oak Ave, Raleigh  │
│  Lane Closure · TA-33          │
│  🟢 Ready                      │
│  Jun 25, 2:34 PM            ›  │
│────────────────────────────────│
│  WO-2024-001                   │
│  Lumos · 123 Main St, Charlotte│
│  Lane Closure · TA-33          │
│  🟡 Processing                 │
│  Jun 25, 2:30 PM            ›  │
│────────────────────────────────│
│  WO-2024-088                   │
│  Lumos · 789 Elm Blvd, Durham  │
│  Flagging · TA-10              │
│  🔴 Error — no road data       │
│  Jun 20, 9:10 AM            ›  │
│────────────────────────────────│
```

**Status badge logic:**
| `estimate_response` state | Badge |
|---|---|
| Field absent | 🟡 Processing |
| `status: 'success'` | 🟢 Ready |
| `status: 'failed'` | 🔴 Error |

**Reading address and work type for the card:** These are not top-level metadata fields — they live in `service1_input.payload` (a JSON string written by the relay). Parse on the client in `jobs.ts`:
```typescript
const input = JSON.parse(doc.service1_input?.payload ?? '{}');
const address  = input.location?.address  ?? '—';
const workType = input.work?.description  ?? '—';
```
This is intentional for the POC — no relay changes needed. If the payload shape changes in a future relay version, update this parser.

**Org display name:** `metadata.company` holds the raw `customer_org` claim value (e.g., `"lumos"`). Title-case it client-side with a `formatOrg(org: string)` utility (`"lumos" → "Lumos"`). No lookup table needed for POC.

**TA code in card:** Read from `metadata.rulesContext?.taCode` — populated by the relay after the geocoder step (before `estimate_response` is written). Show `"—"` if absent (job still in early processing).

List uses `onSnapshot()` on the org query — updates in real-time as estimates complete. Tap any row → opens `JobDetailSheet` as a full-screen bottom sheet over the inbox.

---

### Screen: Job Detail Sheet

**Interaction model:** Tapping a job card slides up a full-screen bottom sheet (`JobDetailSheet.tsx`) over the inbox. The inbox is dimmed behind it. Drag handle at the top; swipe down or tap the handle to dismiss. No page navigation — sheet state is managed locally in the inbox component. URL does not change (deep-link via `/inbox/[jobId]` route is a separate full-page fallback for post-submit navigation).

**Job Detail Sheet — Ready state:**
```
┌─────────────────────────────────┐  ← inbox dimmed behind
│           ━━━━━                 │  ← drag handle
│  WO-2024-099          🟢 Ready  │
│  TA-33 · Northbound · 850 ft    │
│─────────────────────────────────│
│  ⓘ Draft estimate — budgeting   │  ← disclaimer, always visible
│    & planning only.             │
│─────────────────────────────────│
│┌───────────────────────────────┐│
││                               ││
││   [rendered plan image]       ││  ← pinch-zoom, pan
││                          [⬇]  ││  ← download icon, top-right of image
││                               ││
│└───────────────────────────────┘│
│  Image height: ~40% of screen   │
│─────────────────────────────────│
│  Bill of Materials              │
│                                 │
│  Signs                          │
│  ROAD WORK AHEAD (W20-1)     4  │
│  END ROAD WORK (G20-2)       4  │
│  LANE CLOSED AHEAD (R4-11)   2  │
│                                 │
│  Devices                        │
│  Type III Barricade          4  │
│                                 │
│  Cones                      80  │
│  Sign Stands                 8  │
│  Sandbags                   16  │
│─────────────────────────────────│
│  🎙 Ask AI about this plan  →   │  ← text link, navigates to /ai?jobId=...
│─────────────────────────────────│
│  Submitted Jun 25, 2:34 PM      │
│  By: sarah@lumos.com            │
│─────────────────────────────────│
│  ┌─────────┐┌─────────┐┌──────┐ │
│  │  Quote  ││   TCP   ││ Sched│ │  ← all Coming Soon
│  └─────────┘└─────────┘└──────┘ │
└─────────────────────────────────┘
```

**Job Detail Sheet — Processing state:**
```
┌─────────────────────────────────┐
│           ━━━━━                 │
│  WO-2024-001       🟡 Processing│
│─────────────────────────────────│
│                                 │
│         ◌  (spinner)            │
│    Generating your estimate…    │
│    Usually takes 3–5 seconds.   │
│                                 │
│─────────────────────────────────│
│  ┌─────────┐┌─────────┐┌──────┐ │
│  │  Quote  ││   TCP   ││ Sched│ │  ← disabled while processing
│  └─────────┘└─────────┘└──────┘ │
└─────────────────────────────────┘
```

**Job Detail Sheet — Error state:**
```
┌─────────────────────────────────┐
│           ━━━━━                 │
│  WO-2024-088          🔴 Error  │
│─────────────────────────────────│
│                                 │
│              ⚠                  │
│    Couldn't generate this       │
│    estimate.                    │
│                                 │
│    We couldn't find a road      │
│    at that location. Try a      │
│    nearby address.              │
│                                 │
│  ┌───────────────────────────┐  │
│  │        Try Again          │  │
│  └───────────────────────────┘  │
│─────────────────────────────────│
│  ┌─────────┐┌─────────┐┌──────┐ │
│  │  Quote  ││   TCP   ││ Sched│ │  ← disabled on error
│  └─────────┘└─────────┘└──────┘ │
└─────────────────────────────────┘
```

**Action buttons — all Coming Soon in POC:**

| Button | Intent | POC behavior |
|---|---|---|
| Quote | Request a pricing quote for the traffic control work | Opens `ComingSoonSheet` |
| TCP | Order an MUTCD-compliant, engineer-reviewed traffic control plan | Opens `ComingSoonSheet` |
| Schedule | Request AWP to schedule and deploy the traffic control setup | Opens `ComingSoonSheet` |

Each Coming Soon sheet uses the shared `ComingSoonSheet.tsx` component with button-specific copy:
- **Quote:** "Pricing quotes will be available in a future update. Contact AWP directly to request a quote."
- **TCP:** "TCP ordering will be available in a future update. An AWP traffic engineer will review your location and deliver a compliant, field-ready plan within 72 hours."
- **Schedule:** "Job scheduling will be available in a future update. Contact AWP directly to schedule your traffic control setup."

**Download Image:** Icon button `[⬇]` overlaid on the top-right corner of the plan image. `<a download>` — fetches `image_signed_url` and triggers browser download.

**Ask AI about this plan:** Text link below the BOM. Navigates to `/ai?jobId=<id>` — voice agent pre-loaded with this estimate's context.

**Disclaimer banner:** Persistent, non-dismissible. Text: "Draft estimate — for budgeting & planning only. Not a compliant TCP."

**Error messages by `failure_reason`:**
| `failure_reason` | User-facing message |
|---|---|
| `no_road_data` | "We couldn't find a road at that location. Try a nearby address." |
| `pipeline_error` | "Something went wrong generating this estimate. Please try again." |
| `storage_upload_failed` | "The plan was generated but couldn't be saved. Please try again." |
| `job_not_found` | "This estimate could not be found. Please try again." |
| `unknown` | "Something went wrong. Please try again." |

**"Try Again"** navigates to `/request/details` with all previous values pre-filled from `service1_input.payload`.

**Expired signed URL (edge case):** If the image fails to load (7-day URL expiry), show a "Refresh" button in place of the image. Low priority — implement only if it surfaces during testing.

**PDF:** Not in scope for v1.

---

### Screen: Voice Agent (AWP Traffic Safety AI)

```
┌────────────────────────────────┐
│ ←  AWP Traffic Safety AI       │
│────────────────────────────────│
│                                │
│                                │
│         [AWP Logo / Icon]      │
│                                │
│      AWP Traffic Safety AI     │
│                                │
│                                │
│          ╭─────────╮           │
│          │         │           │
│          │  🔵 orb │           │  ← pulses/animates when speaking
│          │         │           │
│          ╰─────────╯           │
│                                │
│  Agent: "What's the minimum    │
│  buffer length for 45 mph?"    │  ← transcript, scrollable
│                                │
│  You: "for a lane closure"     │
│                                │
│  ●●● (agent processing)        │
│                                │
│  ┌──────────────────────────┐  │
│  │   🎙  Tap to Speak       │  │  ← or VAD (voice activity detection)
│  └──────────────────────────┘  │
│                                │
│     ● Listening  ─  Speaking   │
│                                │
│         [End Session]          │
└────────────────────────────────┘
```

When launched from Job Detail (`/ai?jobId=<id>`), the job context is injected as dynamic variables at session start — the agent already knows the WO#, address, TA code, and BOM totals without the user having to say anything.

---

## 9. ElevenLabs Voice Integration

### Architecture

1. On session start, client calls `POST /api/elevenlabs/signed-url` (server-side proxy, uses `ELEVENLABS_API_KEY`)
2. Server calls ElevenLabs SDK: `client.conversationalAi.conversations.getSignedUrl({ agentId })`
3. Returns `{ signedUrl }` to client (valid 15 min)
4. Client connects via `useConversation({ signedUrl })` from `@11labs/react`
5. Browser handles mic/speaker via Web Audio API natively

### `VoiceAgent.tsx`

```typescript
import { useConversation } from '@11labs/react';

export function VoiceAgent({ jobContext }: { jobContext?: EstimateContext }) {
  const conversation = useConversation({
    onConnect:    () => setStatus('connected'),
    onDisconnect: () => setStatus('disconnected'),
    onMessage:    (msg) => appendTranscript(msg),
    onError:      (err) => setError(err),
  });

  const start = async () => {
    const { signedUrl } = await fetch('/api/elevenlabs/signed-url', {
      method: 'POST',
      body: JSON.stringify({ agentId: AWP_AGENT_ID, tenantId: 'awp' })
    }).then(r => r.json());

    try {
      await conversation.startSession({
        signedUrl,
        // Override first_message when launched from a job — agent greets with job context
        ...(jobContext && {
          overrides: {
            agent: {
              firstMessage: `Hi ${user.displayName}! I can see you're looking at work order ${jobContext.workOrderId} — a ${jobContext.taCode} plan at ${jobContext.address}. What questions do you have?`,
            }
          }
        }),
        dynamicVariables: {
          user_name:           user.displayName ?? '',
          user_email:          user.email       ?? '',
          customer_org:        user.token.org   ?? '',
          current_work_order:  jobContext?.workOrderId       ?? '',
          current_ta_code:     jobContext?.taCode            ?? '',
          current_address:     jobContext?.address           ?? '',
          current_bom_summary: jobContext ? formatBomSummary(jobContext.bom) : '',
        }
      });
    } catch (err) {
      // Mic permission denied or WebSocket failure
      setError(err instanceof Error ? err.message : 'Could not start session');
    }
  };
  // ...
}
```

**`formatBomSummary(bom: BOMResult): string`** — converts structured BOM to a single spoken line injected as `current_bom_summary`:
```typescript
export function formatBomSummary(bom: BOMResult): string {
  const t = bom.totals;
  const parts = [
    `${t.signCount} signs`,
    `${t.deviceCount} devices`,
    `${t.coneCount} cones`,
    `${t.standCount} stands`,
    `${t.sandbagCount} sandbags`,
    ...(t.flaggerCount > 0 ? [`${t.flaggerCount} flaggers`] : []),
  ];
  return parts.join(', ');
  // → "12 signs, 4 devices, 80 cones, 8 stands, 16 sandbags"
}
```

**Mic permission error state:** If `startSession()` throws (mic denied, WebSocket failure), the AI screen shows:
```
┌────────────────────────────────┐
│                                │
│         🎙                     │
│                                │
│   Microphone access required   │
│                                │
│   Allow microphone access in   │
│   your browser settings to     │
│   use the AI assistant.        │
│                                │
│  ┌──────────────────────────┐  │
│  │   Try Again              │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

### Agent setup

Agent is created: `agent_8301kw2ea0h1ex0af3yjjee8kwef` — system prompt v1.4, all 7 dynamic variables configured. Stored as `NEXT_PUBLIC_AWP_AGENT_ID`. See `awp-traffic-safety-ai-system-prompt.md` and `elevenlabs-agent-config.json`.

---

## 10. Environment Variables

```env
# Firebase (client-side — same project as production)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server-side — for session verification)
FIREBASE_SERVICE_ACCOUNT_BASE64=

# Relay
RELAY_URL=https://tcp-relay.keryk.ai          # server-side only
SERVICE_AUTH_KEY=                              # added by estimate-proxy route

# Maps
NEXT_PUBLIC_MAPBOX_TOKEN=                     # Mapbox satellite tile layer (PinMap.tsx) — already in Infisical (TCP project)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=              # geocode fallback (address search in /api/geocode) — already in Infisical (TCP project)

# ElevenLabs
ELEVENLABS_API_KEY=                           # server-side only, never exposed
NEXT_PUBLIC_AWP_AGENT_ID=agent_8301kw2ea0h1ex0af3yjjee8kwef  # AWP Traffic Safety AI
```

---

## 11. PWA Configuration

**`public/manifest.json`:**
```json
{
  "name": "AWP Traffic Plans",
  "short_name": "TCP Plans",
  "start_url": "/home",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a1a2e",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**`next.config.ts`:** Add `next-pwa` plugin with `dest: 'public'` and cache strategy for static assets. Service worker caches app shell; Firestore and API calls always go to network.

**Mobile viewport meta (in `layout.tsx`):**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```

---

## 12. Build Plan

### ✅ Delivered — Core submission loop (Week 1)

| Feature | Status |
|---|---|
| Repo setup: Next.js 15, Tailwind, Firebase, PWA manifest, auth guard | ✅ Done |
| Step flow shell, `StepNav`, `sessionStorage` form state, `ComingSoonSheet` | ✅ Done |
| Step 1 (details, GPS), Step 3 (work type), Step 4 (review + submit) | ✅ Done |
| Step 2 (Leaflet pin map, distance/direction auto-calc) | ✅ Done |
| `POST /api/estimate-proxy` route, loading state, navigation | ✅ Done |

### ✅ Delivered — Inbox, job detail, AI (Week 2)

| Feature | Status |
|---|---|
| Inbox — Firestore `onSnapshot`, `StatusBadge` | ✅ Done |
| `JobDetailSheet` — plan image, BOM, Analyze/Quote/TCP/Schedule buttons | ✅ Done |
| ElevenLabs `elevenlabs-convai` widget embedded in request layout | ✅ Done (replaced `VoiceAgent.tsx` + signed-url route) |
| Demo data — scheduled/completed sites, `DemoSiteSheet`, `AWPDocumentView` | ✅ Done |
| `ScheduleCalendarSheet` — 2-week calendar, weather, Friday discount | ✅ Done |
| `NotificationSheet` — bell icon, 5 notification types, unread state | ✅ Done |
| Home map view — `SiteMapView`, tab pills (New/Scheduled/Completed) | ✅ Done |
| Complex Job — Request a TCP (bypass review, overlay, navigate home) | ✅ Done |
| Reverse geocode API (`/api/geocode/reverse`) | ✅ Done |
| Firebase custom claims provisioning for demo accounts | ✅ Done |
| Coolify deployment at `awp.dev.keryk.ai` | ✅ Done |

---

## 13. Out of Scope (v1 POC)

Per Wade's spec and product decisions:
- PDF output — image only in v1
- Multi-segment jobs — single segment only
- Re-render of existing estimates — resubmit to create a new doc
- Multi-page / tiled images — capped at 1920×1080 PNG
- Push notifications — not in PWA scope; add in React Native phase
- Address search bar on map (Phase 2)
- GPS-based start pin (Phase 2)
- Signed URL refresh endpoint (implement only if edge case surfaces during testing)
- BOM download as CSV/PDF
- Shoulder Closure work type — card is visible but opens "Coming Soon" sheet; no TA code exists yet in the relay; full support post-POC (Open Item #8)
- TCP order backend — "Order a TCP" button shows "Coming Soon" in POC; full ordering flow (API, fulfillment, status tracking) is post-POC (Open Item #9)
- Future Feature card backend — home screen teaser card is a static Coming Soon placeholder; actual feature TBD by AWP

---

## 14. Open Items

| # | Item | Owner | Status |
|---|---|---|---|
| 1 | ~~Create AWP Traffic Safety AI agent in ElevenLabs~~ | ✅ Done | `agent_id: agent_8301kw2ea0h1ex0af3yjjee8kwef` → `NEXT_PUBLIC_AWP_AGENT_ID`. System prompt v1.7. |
| 2 | ~~Firebase custom claims provisioning flow for `customer_org`~~ | ✅ Done | Script at `scratchpad/set-claims.mjs`. Demo accounts: john.candelaria@awpsafety.com, josh.shipman@awpsafety.com — both `org: 'verizon'`. |
| 3 | ~~Confirm per-org scoping (`customer_org` field)~~ | ✅ Done | Firestore security rules in place. Inbox query scoped to `metadata.customer_org`. |
| 4 | ~~TA-30/30R/33 auto-detection by pipeline from OSM road geometry~~ | ✅ Confirmed | Relay `derive_ta_code()` uses OSM road type + `selected_lane` from payload. |
| 5 | ~~Seed test docs in `tcp_estimates_V1`~~ | ✅ Done | Real estimates available. Demo sites use hardcoded `DEMO_SITES` array. |
| 6 | ~~AWP branding assets — logo, primary color, icon files~~ | ✅ Done | Logos, Unitext font, #FF6B00 primary, #0A1525 dark bg. |
| 7 | ~~Firebase project config values for mobile app env~~ | ✅ Done | Configured in Coolify. `awp.dev.keryk.ai` added to Firebase authorized domains and Google API key referrer restrictions. |
| 8 | Shoulder closure TA — no TA code exists yet | Wade | Deferred: Shoulder Closure card shows "Coming Soon"; full support post-POC |
| 9 | "Request a TCP" backend — full fulfillment flow, Firestore schema for TCP orders | Wade / Morgan | Complex Job path currently simulated (overlay + navigate home). Full backend post-POC. |
| 10 | Future Feature cards — define next AWP products to build on this platform | Morgan / AWP | Two teaser cards on home screen (AI field assistants, third-party integrations). Details TBD. |
| 11 | Agent prompt — update ElevenLabs agent with v1.7 system prompt | Morgan | Pending — paste `awp-traffic-safety-ai-system-prompt.md` into ElevenLabs dashboard |
| 12 | PWA testing — install and test on iOS Safari and Android Chrome | Morgan | Pending |

---

## 15. Current State vs. Original Spec

This section documents where the delivered POC diverges from the original v1.3 spec.

### Changed from spec

| Area | Spec (v1.3) | Delivered (v2.0) |
|---|---|---|
| Home screen | 4-card dashboard (Request, Inbox, AI, Future Feature) | Map view with New/Scheduled/Completed tab pills, notification bell, Keryk AI footer |
| Work types | Flagging, Lane Closure, Shoulder Closure (Coming Soon) | Added: Complex Job — Request a TCP (bypasses estimate, overlay, navigates home) |
| Work type screen | Emoji icons on each option (🚩🚧🛞) | Emojis removed; text-only options |
| TCP/Schedule buttons | Both "Coming Soon" in Job Detail | Request a TCP: live. Schedule a Crew: live (opens `ScheduleCalendarSheet`). |
| Download plan image | Download button overlaid on plan image | Removed from `JobDetailSheet` |
| ElevenLabs integration | `@11labs/react` `useConversation()` hook, `VoiceAgent.tsx`, `/api/elevenlabs/signed-url` | `elevenlabs-convai` web component; dynamic vars as JSON attribute; embedded in request layout |
| AI entry point | `/ai` page navigated from Job Detail `?jobId=` | Widget embedded in request flow; activated from "Ask AWP AI Expert" on work-type step |
| Signed URL route | `/api/elevenlabs/signed-url` server route | Not built; ElevenLabs widget connects directly (no server-side signed URL in POC) |
| Inbox route | `/inbox/[jobId]` dynamic route for deep-link | Removed; `JobDetailSheet` opened as a sheet from `/inbox` page |

### Added beyond spec

| Addition | Description |
|---|---|
| `DemoSiteSheet` | Bottom sheet for scheduled/completed demo sites; shows weather, nearby work, restrictions, estimate placeholder, or invoice |
| `AWPDocumentView` | Styled AWP estimate/invoice renderer; used for completed demo site and print-ready download |
| `ScheduleCalendarSheet` | 2-week booking calendar with weather forecast, crew availability, Friday 5% discount |
| `NotificationSheet` | Bell icon panel with 5 notification types: job_complete, tcp_ready, incentive, algo_insight, partner_offer |
| `SiteMapView` | Home screen map component with tab-aware colored site pins |
| `demoData.ts` | Two hardcoded demo sites (Duke Energy scheduled, Verizon completed) with full line items and context |
| `notifications.ts` | Mock notifications including behavioral prediction (algo_insight) and partner offer types |
| Reverse geocode API | `/api/geocode/reverse` — GPS lat/lng → street address for Step 1 GPS button |
| Agent system prompt | v1.7 at `awp-traffic-safety-ai-system-prompt.md`; covers app navigation, work type guidance, demo features |
| Agent eval suite | 33 tests (23 P0) at `elevenlabs-agent-evals.md` |
| Firebase domain fixes | `awp.dev.keryk.ai` added to Firebase authorized domains and Google API key HTTP referrer restrictions |
| Custom claims provisioning | Script and process for setting `org` claim on Firebase users |

### Still coming soon (post-POC)

- Shoulder Closure work type (no relay TA code yet)
- Request a TCP backend (fulfillment API, Firestore schema, 72-hour SLA tracking)
- Request a Quote (formal quoting flow)
- Analyze Site Risks (AI-powered risk scoring)
- Push notifications (planned for React Native phase)
- Production React Native migration

---

*Spec v2.0 — updated 2026-06-29 to reflect delivered POC state*  
*Originally produced from codebase analysis of `svc-frontend`, `svc-4-map`, `relay`, and `tcp-portal`, integrated with Wade's contract doc `2026-06-26-mobile-estimate-integration.md`.*
