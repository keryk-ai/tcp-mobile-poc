# AWP Traffic Safety Assistant — Feature List

**Version:** 1.0  
**Date:** 2026-06-29  
**Deployment:** `https://awp.dev.keryk.ai`  
**Status:** POC live

---

## Authentication

| Feature | Status |
|---|---|
| Firebase email/password login | Live |
| Session persistence across browser restarts | Live |
| Auth guard — all routes redirect to login if unauthenticated | Live |
| Firebase custom claim `org` — scopes each user to their organization | Live |
| Logout | Live |

---

## Home — Map View

| Feature | Status |
|---|---|
| Leaflet map with colored site pins (orange/amber/green by status) | Live |
| New Sites tab — AI estimates not yet scheduled | Live |
| Scheduled tab — confirmed crew bookings | Live |
| Completed tab — finished jobs | Live |
| Tab pills filter both the map pins and the site list simultaneously | Live |
| Tap map pin or site row to open site detail | Live |
| New Site button on map to start a request | Live |
| Notification bell with unread badge count | Live |
| AWP logo + "Traffic Safety Assistant" header subtitle | Live |
| Keryk AI footer branding | Live |
| Two Coming Soon feature teaser cards (AI field assistants, third-party integrations) | Coming Soon |

---

## Request Flow

| Feature | Status |
|---|---|
| 4-step flow: Details → Map → Work Type → Review | Live |
| Step 1: Work Order #, address, time of day (Day/Night), construction type | Live |
| Step 1: GPS "Use my location" with reverse geocode to street address | Live |
| Step 2: Leaflet A/B pin placement with drag support | Live |
| Step 2: Street (OpenStreetMap) / Satellite (Mapbox) tile toggle | Live |
| Step 2: Distance and direction auto-calculated from pin positions | Live |
| Step 3: Flagging work type (TA-10) | Live |
| Step 3: Lane Closure work type (TA-30/30R/33, resolved by relay from road geometry) | Live |
| Step 3: Left Lane / Right Lane selection for lane closures | Live |
| Step 3: Direction of travel field (pre-filled from Step 2 bearing) | Live |
| Step 3: Complex Job — Request a TCP (bypass estimate, send to AWP engineer) | Live |
| Step 3: Complex Job — sending overlay with spinner, then navigate to home | Live |
| Step 3: Shoulder Closure (visible, not yet active) | Coming Soon |
| Step 3: "Not sure? Ask the AWP AI Expert" link activates voice assistant | Live |
| Step 4: Review screen with all job details and budgetary disclaimer | Live |
| Step 4: Edit button returns to Step 1 with values preserved | Live |
| Step 4: Submit to relay via `/api/estimate-proxy` | Live |
| Submission loading state with spinner | Live |
| Navigate to inbox on successful submission | Live |
| Form state persisted in `sessionStorage` across all steps | Live |
| Form state cleared on submit, Complex Job send, or abandon | Live |

---

## Inbox

| Feature | Status |
|---|---|
| Org-scoped estimate list (filtered by Firebase custom claim `org`) | Live |
| Real-time updates via Firestore `onSnapshot` — no refresh needed | Live |
| Sorted newest first | Live |
| Status badges: Processing, Ready, Error | Live |
| Job cards show WO#, address, work type, TA code, timestamp | Live |
| Tap card to open Job Detail bottom sheet | Live |

---

## Job Detail Sheet

| Feature | Status |
|---|---|
| Full-screen bottom sheet with drag handle and swipe-to-dismiss | Live |
| AI-generated plan image with budgetary disclaimer banner | Live |
| Bill of materials: signs (MUTCD code + quantity), devices, cones, stands, sandbags, flaggers | Live |
| Processing state with spinner (auto-updates via `onSnapshot`) | Live |
| Error state with failure-reason-specific message and Try Again button | Live |
| Analyze Site Risks button | Coming Soon |
| Request a Quote button | Coming Soon |
| Request a TCP button | Live |
| Schedule a Crew button — opens scheduling calendar | Live |

---

## Schedule a Crew

| Feature | Status |
|---|---|
| Two-week weekday calendar (10 slots, Mon–Fri) | Live |
| Weather forecast per day (icon + temperature range) | Live (demo data) |
| Crew availability indicator per day: High / Medium / Low | Live (demo data) |
| Friday highlight with amber border and 5% discount badge | Live |
| Friday promotional banner above calendar | Live |
| Day selection with highlighted state | Live |
| Confirm booking with 1.8s green success state then auto-close | Live |

---

## Notifications

| Feature | Status |
|---|---|
| Bell icon in home header with orange unread badge | Live |
| Notification panel as bottom sheet (swipe to dismiss) | Live |
| Mark all read | Live |
| Mark individual notification read on action tap | Live |
| Job Complete — crew finished, invoice ready, deep-links to completed site | Live |
| TCP Ready — reviewed plan approved, deep-links to scheduled site | Live |
| Incentive — scheduling discount offer (Friday 5% promotion) | Live |
| Predicted Job Alert — behavioral analytics engine anticipates upcoming jobs and offers pre-booking | Live (demo) |
| Partner Offer — targeted supply deal from AWP-vetted partner based on job type and geography | Live (demo) |

---

## Demo Content

| Feature | Status |
|---|---|
| Scheduled demo site: Duke Energy, 7936 Old Salisbury Rd, Linwood NC (July 15 2026) | Live |
| Scheduled site: weather forecast with advisory (partly cloudy, 87°F, storm risk) | Live |
| Scheduled site: nearby competing work cards (Rowan County, Piedmont Gas) | Live |
| Scheduled site: permit and restriction notices (town ordinance, county permit, utility notification) | Live |
| Scheduled site: estimate placeholder image | Live |
| Completed demo site: Verizon, 4400 Sharon Rd, Charlotte NC (June 15 2026) | Live |
| Completed site: styled AWP invoice with full line items, quantities, subtotal, tax, total | Live |

---

## AI Voice Assistant

| Feature | Status |
|---|---|
| ElevenLabs `elevenlabs-convai` web component embedded in request flow | Live |
| Available on all four request steps | Live |
| Dynamic variables injected: user email, org, session ID, job ID, location | Live |
| Work type selection guidance via decision tree | Live |
| Immediate Complex Job routing — stops at intersection/highway/mobile op/detour, no follow-up questions | Live |
| App navigation guidance — all tabs, request flow, scheduling, notifications | Live |
| MUTCD domain knowledge — TA codes, BOM items, taper lengths, thresholds | Live |
| Plan and BOM explanation grounded in active job context | Live |
| Safety guidance — stop-work triggers, PPE requirements | Live |
| Draft estimate disclaimer behavior | Live |
| Agent system prompt v1.7 | Pending deploy to ElevenLabs |
| Agent eval suite — 33 tests, 23 P0 | Ready |

---

## PWA

| Feature | Status |
|---|---|
| PWA manifest — name, icons, start_url, display: standalone | Live |
| Installable on iOS Safari and Android Chrome | Live |
| Mobile-first layout — fits 390px viewport, no horizontal scroll | Live |
| Touch targets minimum 44×44px | Live |
| `maximum-scale=1` prevents unwanted zoom on iOS input focus | Live |

---

## Infrastructure

| Feature | Status |
|---|---|
| Deployed at `awp.dev.keryk.ai` via Coolify | Live |
| Multi-stage Docker build, `linux/amd64` platform | Live |
| `NEXT_PUBLIC_*` vars baked at build time via Coolify build args | Live |
| Firebase authorized domain: `awp.dev.keryk.ai` | Live |
| Google API key HTTP referrer restriction: `awp.dev.keryk.ai` | Live |
| Firebase custom claims (`org: 'verizon'`) on demo accounts | Live |
| CI: TypeScript strict check (`tsc --noEmit`) passes on all merges | Live |

---

## Coming Next (Post-POC)

| Feature | Notes |
|---|---|
| Shoulder Closure work type | Requires new TA code in relay |
| Request a TCP — backend fulfillment | API, Firestore schema, 72-hour SLA tracking |
| Request a Quote — formal quoting flow | AWP quoting system integration |
| Analyze Site Risks — AI risk scoring | ML model, site data inputs |
| Push notifications | Planned for React Native phase |
| React Native / Expo migration | After POC validation with AWP customers |

---

*Feature list v1.0 — AWP Traffic Safety Assistant — tcp-mobile-poc — 2026-06-29*
