# TCP Mobile App — User Stories

**Version:** 1.0  
**Date:** 2026-06-26  
**Derived from:** tcp-mobile-poc-spec.md v1.3  
**User:** AWP enterprise customer — field supervisor, project coordinator, or utility crew member (Lumos, Verizon, Duke Energy, etc.)

---

## Epic 1: Authentication

**US-101 — Login**  
As an AWP enterprise customer, I want to log in with my email and password so that I can access my organization's traffic control estimates securely.

*Acceptance criteria:*
- Firebase email/password login
- Invalid credentials show a clear error message
- Successful login redirects to the home dashboard
- Session persists across browser restarts (Firebase `setPersistence(LOCAL)`)

**US-102 — Auth guard**  
As an unauthenticated user, I want to be redirected to the login screen when I try to access any protected route so that my organization's data stays private.

*Acceptance criteria:*
- All routes except `/login` redirect to `/login` if not authenticated
- After login, user is sent to the page they originally requested (or `/home`)

**US-103 — Logout**  
As a logged-in user, I want to be able to sign out so that my account is secure when I hand off a shared device.

*Acceptance criteria:*
- Accessible from the home screen (profile icon or menu)
- Clears Firebase session and redirects to `/login`

---

## Epic 2: Home Dashboard

**US-201 — View feature cards**  
As an AWP enterprise customer, I want to see a clear home screen with the available features so that I can quickly navigate to what I need.

*Acceptance criteria:*
- Three live feature cards: Request an Estimate, Inbox, Ask AWP Traffic Safety AI
- One "Future Feature" placeholder card with a Coming Soon badge
- AWP branding (logo, Unitext font, orange primary color)

**US-202 — Inbox badge**  
As an AWP enterprise customer, I want to see a count of unviewed ready estimates on the Inbox card so that I know when new results are available without opening the inbox.

*Acceptance criteria:*
- Badge shows count of `estimate_response.status === 'success'` docs not yet viewed this session
- Badge disappears when inbox is opened
- Powered by the org-scoped Firestore `onSnapshot()` subscription

**US-203 — Future Feature teaser**  
As an AWP stakeholder viewing a demo, I want to see a "Future Feature" placeholder card so that I understand this app is a platform for multiple AWP products, not a one-off tool.

*Acceptance criteria:*
- Card is visually distinct (muted/outlined style, Coming Soon pill)
- Tapping opens `ComingSoonSheet` with platform vision messaging
- No navigation, no API call

---

## Epic 3: Request an Estimate

**US-301 — Enter job details**  
As an AWP enterprise customer, I want to enter my work order number, job address, time of day, and construction type so that the system has enough context to generate the right traffic control plan.

*Acceptance criteria:*
- Required fields: Work Order #, Address (free-text), Time of Day (Day/Night), Construction Type (Underground/Overhead/Other)
- All fields required — Next button disabled until complete
- Values persist in `sessionStorage` across steps

**US-302 — Place map pins**  
As an AWP enterprise customer, I want to place two pins on a map to define the start and end of my work zone so that the pipeline knows exactly where to generate the plan.

*Acceptance criteria:*
- Map auto-centers on the address entered in Step 1
- First tap places Pin A (start), second tap places Pin B (end)
- Both pins draggable after placement
- Street view (OpenStreetMap) and satellite view (Mapbox) toggle
- Distance and direction auto-calculate from pin positions (Haversine + bearing)
- Direction pre-populates Step 3 field
- Next button disabled until both pins placed

**US-303 — Select work type**  
As an AWP enterprise customer, I want to select the type of work I'm doing so that the system generates the correct traffic control plan type.

*Acceptance criteria:*
- Two active options: Flagging, Lane Closure
- Shoulder Closure visible but disabled — tapping opens `ComingSoonSheet`
- Selecting Lane Closure reveals a "Which lane?" toggle (Left / Right)
- Direction field pre-populated from Step 2 bearing, user can override
- Next disabled until work type and (for lane closure) lane side are selected

**US-304 — Review and submit**  
As an AWP enterprise customer, I want to review all my job details before submitting so that I can catch mistakes before the estimate is generated.

*Acceptance criteria:*
- Displays: WO#, address, time, construction type, work type, lane (if lane closure), direction, distance
- Budgetary disclaimer banner: "Draft estimate — for budgeting & planning only. Not a compliant TCP."
- Edit button returns to Step 1 with all values preserved
- Submit calls `POST /api/estimate-proxy`

**US-305 — Submission loading state**  
As an AWP enterprise customer, I want to see a loading indicator while my estimate is being generated so that I know the request is in progress.

*Acceptance criteria:*
- Spinner and "Generating your estimate… This takes about 3–5 seconds." shown while fetch resolves
- On `200`, navigate to the inbox with the new job's detail sheet open
- On error, show inline error with a retry option

**US-306 — Abandon and resume**  
As an AWP enterprise customer, I want my form progress saved as I move between steps so that I don't lose my work if I navigate away mid-flow.

*Acceptance criteria:*
- `sessionStorage` preserves all form values across Step 1–4
- Cleared on successful submit or explicit abandon

---

## Epic 4: Inbox

**US-401 — View all org estimates**  
As an AWP enterprise customer, I want to see all estimates submitted by my organization so that my team can review each other's work and stay informed.

*Acceptance criteria:*
- List filtered by `metadata.customer_org` matching the logged-in user's Firebase custom claim
- Sorted newest first
- Each card shows: WO#, org name, address, work type · TA code, status badge, timestamp
- Real-time updates via `onSnapshot()` — no pull-to-refresh needed

**US-402 — Status at a glance**  
As an AWP enterprise customer, I want each job card to show a clear status so that I can immediately see which estimates are ready, still processing, or failed.

*Acceptance criteria:*
- 🟡 Processing — `estimate_response` absent
- 🟢 Ready — `estimate_response.status === 'success'`
- 🔴 Error — `estimate_response.status === 'failed'` with `failure_reason`
- Status updates in real-time without a page refresh

**US-403 — Open job detail**  
As an AWP enterprise customer, I want to tap a job card and see the full estimate detail so that I can review the plan and take action on it.

*Acceptance criteria:*
- Tapping a card slides up `JobDetailSheet` as a full-screen bottom sheet
- Inbox dimmed behind the sheet
- Drag handle visible at top — swipe down or tap to dismiss
- Sheet loads the correct job doc from Firestore

---

## Epic 5: Job Detail

**US-501 — View plan image**  
As an AWP enterprise customer, I want to see the rendered traffic control plan image so that I can visually understand the proposed layout for my work zone.

*Acceptance criteria:*
- Full-width image loaded from `estimate_response.image_signed_url`
- Pinch-to-zoom and pan supported
- Budgetary disclaimer banner persistent above image: "Draft estimate — for budgeting & planning only. Not a compliant TCP."
- Download icon overlaid on image top-right corner

**US-502 — Download plan image**  
As an AWP enterprise customer, I want to download the plan image to my device so that I can share it with my crew or include it in documentation.

*Acceptance criteria:*
- Tapping the download icon triggers a browser file download (`<a download>`)
- File downloaded from `estimate_response.image_signed_url`
- Works on mobile Chrome (Android) and Safari (iOS)

**US-503 — View bill of materials**  
As an AWP enterprise customer, I want to see the full bill of materials for my plan so that I know exactly what equipment and devices are required for the job.

*Acceptance criteria:*
- Displays all BOM fields: signs (with MUTCD code and quantity), devices, cones, sign stands, sandbags, flaggers (if present)
- Reads from `estimate_response.bom`
- Scrollable within the sheet

**US-504 — Request a quote (Coming Soon)**  
As an AWP enterprise customer, I want to request a pricing quote for my traffic control work so that I can budget accurately before committing.

*Acceptance criteria:*
- "Quote" button visible and tappable on all job detail sheets
- Tapping opens `ComingSoonSheet`: "Pricing quotes will be available in a future update. Contact AWP directly to request a quote."
- No API call, no form — POC only

**US-505 — Order a TCP (Coming Soon)**  
As an AWP enterprise customer, I want to order an MUTCD-compliant traffic control plan reviewed by an AWP engineer so that I have a field-ready plan that meets all regulatory requirements.

*Acceptance criteria:*
- "TCP" button visible and tappable on all job detail sheets
- Tapping opens `ComingSoonSheet`: "TCP ordering will be available in a future update. An AWP traffic engineer will review your location and deliver a compliant, field-ready plan within 72 hours."
- No API call — POC only

**US-506 — Schedule a job (Coming Soon)**  
As an AWP enterprise customer, I want to request AWP to schedule and deploy the traffic control setup for my job so that I don't have to coordinate equipment and crew separately.

*Acceptance criteria:*
- "Schedule" button visible and tappable on all job detail sheets
- Tapping opens `ComingSoonSheet`: "Job scheduling will be available in a future update. Contact AWP directly to schedule your traffic control setup."
- No API call — POC only

**US-507 — Retry a failed estimate**  
As an AWP enterprise customer, I want to retry a failed estimate with my original inputs pre-filled so that I can correct the issue and resubmit without re-entering everything.

*Acceptance criteria:*
- Error state shows `failure_reason`-specific message
- "Try Again" pre-fills Step 1–3 with values from `service1_input.payload`
- Navigates to `/request/details`
- Action buttons (Quote, TCP, Schedule) disabled in error state

**US-508 — Processing state in sheet**  
As an AWP enterprise customer, I want to see a loading state in the job detail sheet while my estimate is being generated so that I know the plan isn't ready yet.

*Acceptance criteria:*
- Spinner and "Generating your estimate… Usually takes 3–5 seconds." shown when `estimate_response` is absent
- Sheet auto-updates to Ready or Error state via `onSnapshot()` when complete
- Action buttons disabled while processing

---

## Epic 6: AI Assistant

**US-601 — General AI session**  
As an AWP enterprise customer, I want to ask the AWP Traffic Safety AI general questions about traffic control and MUTCD standards so that I can get expert guidance without calling AWP directly.

*Acceptance criteria:*
- Accessible from the home screen "Ask AWP Traffic Safety AI" card
- Navigates to `/ai`
- Agent greets with general opening: "Hi [name]! I'm the AWP Traffic Safety AI…"
- Voice conversation via ElevenLabs `useConversation()` hook
- Transcript visible and scrollable

**US-602 — Job-context AI session**  
As an AWP enterprise customer, I want to ask the AI specific questions about an estimate I'm viewing so that I can understand my plan without searching for answers manually.

*Acceptance criteria:*
- "Ask AI about this plan" link in `JobDetailSheet`
- Navigates to `/ai?jobId=<id>`
- Agent's opening line acknowledges the specific job: "Hi [name]! I can see you're looking at work order [WO#]…"
- Dynamic variables pre-loaded: WO#, TA code, address, BOM summary
- Agent answers questions grounded in the specific plan

**US-603 — Mic permission handling**  
As an AWP enterprise customer, I want to see a clear message if microphone access is blocked so that I understand why the AI isn't working and how to fix it.

*Acceptance criteria:*
- If mic permission denied or WebSocket fails, show error state with icon and message
- Message: "Microphone access is required. Allow access in your browser settings to use the AI assistant."
- "Try Again" button re-attempts `startSession()`

---

## Epic 7: PWA

**US-701 — Install to home screen**  
As an AWP enterprise customer, I want to install the app to my phone's home screen so that I can access it like a native app without opening a browser.

*Acceptance criteria:*
- PWA manifest configured: name, icons, start_url, display: standalone
- Meets Chrome/Safari installability criteria
- App icon uses AWP branding (192×192 and 512×512)

**US-702 — Mobile-optimized layout**  
As an AWP enterprise customer using my phone in the field, I want the app to be fully usable on a mobile screen so that I can complete tasks with one hand without zooming or horizontal scrolling.

*Acceptance criteria:*
- All screens fit within 390px viewport without horizontal scroll
- Touch targets minimum 44×44px
- `maximum-scale=1` prevents unintentional zoom on input focus (iOS)
- Font sizes readable without zooming

---

*User stories derived from tcp-mobile-poc-spec.md v1.3 — 2026-06-26*
