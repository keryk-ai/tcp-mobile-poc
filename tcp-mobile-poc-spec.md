# TCP Mobile App — POC Specification

**Version:** 1.1  
**Date:** 2026-06-26  
**Status:** Ready for development  
**Owners:** Morgan Stern (product), Wade (pipeline/relay), TBD (mobile dev)

---

## 1. Purpose & Scope

This spec defines the customer-facing mobile app that lets AWP's enterprise customers (Lumos, Verizon, Duke, etc.) request traffic control plan estimates from their phone and view results asynchronously.

The app has three primary features:
1. **Request an Estimate** — submit a work zone location and type; receive a rendered plan image + bill of materials
2. **Inbox** — view and download completed estimates
3. **Ask AWP Traffic Safety AI** — voice conversation with an ElevenLabs agent for traffic control guidance

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
| Maps | Leaflet 1.9 + OpenStreetMap (simplified from svc-frontend) |
| Realtime data | Firebase Firestore `onSnapshot()` |
| Voice AI | `@11labs/react` — `useConversation()` hook |
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
│   │   └── page.tsx                # Dashboard — 3 feature cards
│   ├── request/
│   │   ├── layout.tsx              # Step flow wrapper + progress bar
│   │   ├── details/page.tsx        # Step 1: WO#, address, time, construction type
│   │   ├── map/page.tsx            # Step 2: Leaflet 2-pin picker
│   │   ├── work-type/page.tsx      # Step 3: Flagging / Lane Closure / Shoulder Closure + direction
│   │   └── review/page.tsx         # Step 4: Confirm + submit (with budgetary disclaimer)
│   ├── inbox/
│   │   ├── page.tsx                # Job list — Firestore subscription by org
│   │   └── [jobId]/
│   │       └── page.tsx            # Job detail — image, BOM, download, AI entry point
│   ├── ai/
│   │   └── page.tsx                # Voice agent screen
│   └── api/
│       ├── estimate-proxy/
│       │   └── route.ts            # POST /estimate proxy (injects auth header)
│       ├── tcp-order/
│       │   └── route.ts            # POST /tcp-order — submits human-review TCP request
│       ├── geocode/
│       │   └── route.ts            # Address search (copy from svc-frontend)
│       └── elevenlabs/
│           └── signed-url/
│               └── route.ts        # Returns signed URL for ElevenLabs agent session
├── components/
│   ├── AuthContext.tsx              # (copied from svc-frontend)
│   ├── PinMap.tsx                  # Leaflet map — A/B pin placement only
│   ├── JobCard.tsx                 # Inbox list item with status badge
│   ├── BOMDisplay.tsx              # Structured BOM — signs, devices, cones, stands, sandbags
│   ├── VoiceAgent.tsx              # ElevenLabs conversation UI — orb + transcript
│   ├── StepNav.tsx                 # Progress bar + back/next buttons
│   └── StatusBadge.tsx             # Processing / Ready / Failed badge
├── lib/
│   ├── firebase.ts                 # (copied from svc-frontend)
│   ├── auth.ts                     # (copied from svc-frontend)
│   ├── api.ts                      # buildEstimatePayload() + postEstimate()
│   ├── jobs.ts                     # subscribeToEstimates(), subscribeToEstimate(id)
│   └── taLogic.ts                  # deriveTA() — road type + lane → TA code
├── types/
│   └── estimate.ts                 # EstimatePayload, EstimateDoc, BOMResult types
└── public/
    ├── manifest.json               # PWA manifest
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
  client:      string;          // user's company name (informational)
  work: {
    taNumber:     string;       // derived — see TA Logic section
    description:  string;       // human-readable (e.g., "Lane Closure — TA-33")
    duration:     "Short-Term";
    timeOfDay:    "Day" | "Night";
    workLocation: "left" | "right";   // closed lane side
    lanesClosed:  1;
    constructionType: string;   // "underground" | "overhead" | "other"
    isRoadCrossing:   false;
    dynamicFields: {
      direction:     string;    // "Northbound" | "Southbound" | "Eastbound" | "Westbound"
      selected_lane?: string;   // "left" | "right" (TA-33 only)
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

The user selects one of three work types. The app sends the work type and direction to the relay; **the pipeline auto-detects the specific TA code from road geometry** (OSM data). The user never selects a TA code directly, and does not need to know whether the road has a median.

### Work types (user-facing)

| User selection | `workType` sent to relay | TA resolved by pipeline |
|---|---|---|
| Flagging | `"flagging"` | `ta-10` (always) |
| Lane Closure | `"lane-closure"` | `ta-30`, `ta-30r`, or `ta-33` — pipeline detects from OSM road geometry |
| Shoulder Closure | `"shoulder-closure"` | `ta-shoulder` (TBD — see Open Item #8) |

**Pipeline TA resolution for lane closure:**
- **TA-30**: Left lane closure, two-lane road without median
- **TA-30R**: Right lane closure, two-lane road without median
- **TA-33**: Either lane, divided highway with median — dual sign deployment (shoulder + median)

The pipeline determines median presence and lane position from the pin coordinates and OSM road data. The app does not ask the user about road geometry.

### `taLogic.ts` (simplified — work type only)

```typescript
type WorkType = 'flagging' | 'lane-closure' | 'shoulder-closure';

export function buildWorkTypePayload(workType: WorkType, direction: string) {
  return {
    workType,
    work: {
      duration:    'Short-Term',
      direction,
      // taNumber resolved server-side by pipeline for lane-closure and shoulder-closure
      ...(workType === 'flagging' && { taNumber: 'ta-10', workLocation: 'right' }),
    }
  };
}
```

> **Note:** For flagging, `ta-10` is deterministic so the app sets it directly. For lane closure and shoulder closure, `taNumber` is omitted from the client payload and set by the relay after OSM analysis. Confirm exact payload contract with Wade (Open Item #8).

---

## 8. UI Screens

### Navigation structure

```
/login              → Login
/home               → Dashboard (3 cards)
/request/details    → Step 1: Job details
/request/map        → Step 2: Pin placement
/request/work-type  → Step 3: Work type + TA derivation
/request/review     → Step 4: Confirm + submit
/inbox              → Estimate list
/inbox/[jobId]      → Estimate detail
/ai                 → Voice agent
/ai?jobId=[jobId]   → Voice agent with job context pre-loaded
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
└────────────────────────────────┘
```

Inbox badge count = estimates where `estimate_response.status === 'success'` that the user hasn't viewed this session. Computed from the org's Firestore subscription on home mount.

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

---

### Screen: Request — Step 3 (Work Type)

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
│  └──────────────────────────┘  │
│────────────────────────────────│
│  Direction of travel:          │
│  ┌──────────────────────────┐  │
│  │  Northbound            ▾ │  │
│  └──────────────────────────┘  │
│                                │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  ⓘ Plan type will be           │
│     determined from road data  │  ← replaces manual TA preview
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                │
│  ┌──────────────────────────┐  │
│  │          Next →          │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

Three work types: **Flagging**, **Lane Closure**, **Shoulder Closure**. The pipeline auto-detects the specific TA code (TA-30, TA-30R, TA-33, etc.) from road geometry — the user does not select a median type or lane side.

Direction options: Northbound / Southbound / Eastbound / Westbound. Pre-populated from the bearing calculated in Step 2 (can be overridden). Direction is collected for all three work types.

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

List uses `onSnapshot()` on the org query — updates in real-time as estimates complete. Tap any row → `/inbox/[jobId]`.

---

### Screen: Job Detail (Ready)

```
┌────────────────────────────────┐
│ ←  WO-2024-099      🟢 Ready  │
│────────────────────────────────│
│  ⓘ Draft budgetary estimate    │  ← disclaimer banner, always visible
│────────────────────────────────│
│┌──────────────────────────────┐│
││                              ││
││   [rendered plan image]      ││  ← pinch-zoom, pan
││   image_signed_url           ││
││   1920×1080, full width      ││
││                              ││
│└──────────────────────────────┘│
│  Image height: ~45% of screen  │
│────────────────────────────────│
│  Bill of Materials             │
│                                │
│  Signs                         │
│  ROAD WORK AHEAD (W20-1)    4  │
│  END ROAD WORK (G20-2)      4  │
│  LANE CLOSED AHEAD (R4-11)  2  │
│                                │
│  Devices                       │
│  Type III Barricade         4  │
│                                │
│  Cones                     80  │
│  Sign Stands                8  │
│  Sandbags                  16  │
│────────────────────────────────│
│  ┌──────────────────────────┐  │
│  │  ⬇  Download Image      │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  🎙  Ask AI about this   │  │  ← navigates to /ai?jobId=...
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  📋  Order a Reviewed    │  │  ← new
│  │      TCP from AWP        │  │
│  └──────────────────────────┘  │
│────────────────────────────────│
│  TA-33 · Northbound            │
│  Distance: 850 ft              │
│  Submitted: Jun 25, 2:34 PM    │
│  By: sarah@lumos.com           │
└────────────────────────────────┘
```

**Budgetary disclaimer banner:** Persistent, non-dismissible banner at top of job detail. Text: "Draft estimate — for budgeting & planning only. Not a compliant TCP."

**Download Image:** `<a download>` (web) — fetches `image_signed_url` and triggers browser download.

**Ask AI about this:** Navigates to `/ai?jobId=<id>`. The voice agent is pre-loaded with this estimate's context as dynamic variables (WO#, address, TA code, BOM totals).

**Order a Reviewed TCP from AWP:** Opens a bottom sheet confirmation:
```
┌────────────────────────────────┐
│  Order a Reviewed TCP          │
│────────────────────────────────│
│  An AWP traffic engineer will  │
│  review this location and      │
│  deliver a compliant, field-   │
│  ready TCP within 72 hours.    │
│                                │
│  Work Order: WO-2024-099       │
│  Address: 456 Oak Ave, Raleigh │
│                                │
│  ┌──────────────────────────┐  │
│  │   Submit TCP Request     │  │
│  └──────────────────────────┘  │
│         Cancel                 │
└────────────────────────────────┘
```
On confirm: calls `POST /api/tcp-order` with the job ID. On success, shows inline confirmation: "Your TCP request has been submitted. AWP will deliver your plan within 72 hours." Backend details TBD (Open Item #9).

**PDF:** Not available in v1. Out of scope per Wade's spec.

**Expired signed URL (edge case):** If `image_signed_url` fails to load (7-day expiry), show a "Refresh image" button that calls a new `/api/estimate-proxy/refresh-url?jobId=<id>` endpoint. Regenerates signed URL from `image_storage_path`. Low priority — implement only if needed.

---

### Screen: Job Detail (Error)

```
┌────────────────────────────────┐
│ ←  WO-2024-088      🔴 Error  │
│────────────────────────────────│
│                                │
│         ⚠                      │
│                                │
│    Couldn't generate this      │
│    estimate.                   │
│                                │
│    We couldn't find a road     │  ← failure_reason: no_road_data
│    at that location. Try a     │
│    nearby address.             │
│                                │
│  ┌──────────────────────────┐  │
│  │   Try Again              │  │
│  └──────────────────────────┘  │
│                                │
│  TA-10 · Northbound            │
│  123 Main St, Charlotte NC     │
│  Submitted: Jun 20, 9:10 AM    │
└────────────────────────────────┘
```

**Error messages by `failure_reason`:**
| `failure_reason` | User-facing message |
|---|---|
| `no_road_data` | "We couldn't find a road at that location. Try a nearby address." |
| `pipeline_error` | "Something went wrong generating this estimate. Please try again." |
| `storage_upload_failed` | "The plan was generated but couldn't be saved. Please try again." |
| `job_not_found` | "This estimate could not be found. Please try again." |
| `unknown` | "Something went wrong. Please try again." |

"Try Again" navigates to `/request/details` with all previous values pre-filled from the doc.

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

    await conversation.startSession({
      signedUrl,
      dynamicVariables: {
        user_name:           user.displayName,
        user_email:          user.email,
        customer_org:        user.token.org,
        // job context (when launched from detail screen)
        current_work_order:  jobContext?.workOrderId  ?? '',
        current_ta_code:     jobContext?.taNumber     ?? '',
        current_address:     jobContext?.address      ?? '',
        current_bom_summary: jobContext?.bomSummary   ?? '',
      }
    });
  };
  // ...
}
```

### Agent setup (pre-dev task)

A new ElevenLabs agent must be created for this project before the AI screen can be built. Required configuration:
- **Agent name:** AWP Traffic Safety AI
- **System prompt:** Focused on MUTCD standards, TCP work zone guidance, TA plan questions
- **Voice:** TBD (select from existing ElevenLabs voices)
- **Dynamic variable references:** `{{user_name}}`, `{{customer_org}}`, `{{current_ta_code}}`, `{{current_address}}`, `{{current_bom_summary}}`

Once created, the `elevenLabsAgentId` is stored as `NEXT_PUBLIC_AWP_AGENT_ID` in env config.

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
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=              # geocode fallback

# ElevenLabs
ELEVENLABS_API_KEY=                           # server-side only, never exposed
NEXT_PUBLIC_AWP_AGENT_ID=agent_xxxxx          # ElevenLabs agent ID for AWP Traffic Safety AI
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

### Week 1 — Core submission loop

| Day | Deliverable |
|---|---|
| 1 | Repo setup: Next.js 15, Tailwind, Firebase config, PWA manifest, mobile viewport, login screen, auth guard |
| 2 | Home dashboard, step flow shell (`/request/layout.tsx`), `StepNav` progress bar component, `sessionStorage` form state |
| 3 | Step 1 (details form) + Step 3 (work type — Flagging / Lane Closure / Shoulder Closure, direction selector, budgetary disclaimer info block) |
| 4 | Step 2 (Leaflet pin map — `PinMap.tsx`, 2-pin placement, auto-center on Step 1 address, distance/direction auto-calc) |
| 5 | Step 4 (review screen + budgetary disclaimer banner) + `POST /api/estimate-proxy` route + submission loading state + confirmation navigation |

### Week 2 — Inbox, job detail, AI

| Day | Deliverable |
|---|---|
| 6 | `jobs.ts` Firestore subscriptions, Inbox list (`onSnapshot` org query), `JobCard`, `StatusBadge` |
| 7 | Job detail — image display (pinch-zoom), `BOMDisplay` (all fields including stands/sandbags), Download Image, budgetary disclaimer banner, "Order a TCP" button + bottom sheet + `POST /api/tcp-order` route |
| 8 | `/api/elevenlabs/signed-url` route, `VoiceAgent.tsx` component, AI screen (`/ai`) |
| 9 | AI context from Job Detail (`/ai?jobId=...`), dynamic variables injection, orb animation |
| 10 | End-to-end smoke test on demo device, mobile CSS polish, error states (failed estimate, network error, expired session) |

### Parallel dependency (Wade)

Week 1 can be built and tested entirely against mock data. Before Day 6, agree on a Firestore doc in `tcp_estimates_V1` with real data (one success, one failure) so inbox and job detail can be built against the actual schema.

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
- TCP order status tracking in-app — v1 shows confirmation message only; tracking the 72-hour delivery is out of scope for POC

---

## 14. Open Items

| # | Item | Owner | Status |
|---|---|---|---|
| 1 | Create AWP Traffic Safety AI agent in ElevenLabs; capture `elevenLabsAgentId` | Morgan / AWP | Blocking AI screen — system prompt drafted |
| 2 | Confirm Firebase custom claims provisioning flow for `customer_org` | Morgan → Wade | Blocking Firestore security rules |
| 3 | Confirm per-org scoping (`customer_org` field) | Morgan → Wade | Blocking Firestore security rules |
| 4 | TA-30/30R/33 auto-detection by pipeline from OSM road geometry | Wade | Blocking lane closure plan accuracy — confirm pipeline capability |
| 5 | Seed one success + one failure doc in `tcp_estimates_V1` for dev testing | Wade | Needed before Day 6 |
| 6 | AWP branding assets — logo, primary color, icon files | Morgan / AWP | Needed before Day 1 |
| 7 | Firebase project config values for mobile app env | Morgan | Needed before Day 1 |
| 8 | Shoulder closure TA selection and relay payload contract (`taNumber` value, any additional fields) | Wade | Blocking shoulder closure submission |
| 9 | "Order a TCP" backend — relay endpoint or new service, Firestore schema for TCP orders, 72-hour SLA fulfillment flow | Wade / Morgan | Blocking Day 7 TCP order feature |

---

*Spec produced from codebase analysis of `svc-frontend`, `svc-4-map`, `relay`, `tcp-portal`, and `runtime-shell`, integrated with Wade's contract doc `2026-06-26-mobile-estimate-integration.md`.*
