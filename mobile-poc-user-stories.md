# TCP Mobile App — User Stories

**Version:** 2.0  
**Date:** 2026-06-29  
**Derived from:** tcp-mobile-poc-spec.md v2.0  
**Status:** Updated to reflect delivered POC state  
**User:** AWP enterprise customer — field supervisor, project coordinator, or utility crew member (Verizon, Duke Energy, Lumos, etc.)

---

## Epic 1: Authentication

**US-101 — Login**  
As an AWP enterprise customer, I want to log in with my email and password so that I can access my organization's traffic control estimates securely.

*Acceptance criteria:*
- Firebase email/password login
- Invalid credentials show a clear error message
- Successful login redirects to the home map view
- Session persists across browser restarts (Firebase `setPersistence(LOCAL)`)

**US-102 — Auth guard**  
As an unauthenticated user, I want to be redirected to the login screen when I try to access any protected route so that my organization's data stays private.

*Acceptance criteria:*
- All routes except `/login` redirect to `/login` if not authenticated
- After login, user is sent to `/home`

**US-103 — Logout**  
As a logged-in user, I want to be able to sign out so that my account is secure when I hand off a shared device.

*Acceptance criteria:*
- Accessible from the home screen header
- Clears Firebase session and redirects to `/login`

---

## Epic 2: Home — Map View

**US-201 — View site map**  
As an AWP enterprise customer, I want to see all of my organization's sites on a map when I open the app so that I can understand the geographic spread of my work at a glance.

*Acceptance criteria:*
- Leaflet map shown at the top of the home screen
- Colored pins for each site: orange (new), amber (scheduled), green (completed)
- Tapping a pin opens the site detail sheet for that site
- AWP logo and "Traffic Safety Assistant" subtitle in the header
- "New Site" button on the map to start a request

**US-202 — Tab navigation**  
As an AWP enterprise customer, I want to filter my sites by status using tab pills so that I can focus on what's relevant at any given moment.

*Acceptance criteria:*
- Three tabs at the top of the site list: New Sites (orange), Scheduled (amber), Completed (green)
- Active tab is highlighted in its corresponding color
- Site list below updates to show only sites matching the active tab
- Map pins also filter to match the active tab

**US-203 — New Sites list**  
As an AWP enterprise customer, I want to see all sites where an AI estimate has been generated but work has not yet been scheduled so that I can review and act on them.

*Acceptance criteria:*
- Populated from demo data (`DEMO_SITES` array, type `'scheduled'` and real inbox estimates)
- Each row shows job name, address, customer, and status
- Tapping a row opens `DemoSiteSheet` (demo sites) or `JobDetailSheet` (real estimates)

**US-204 — Scheduled Sites list**  
As an AWP enterprise customer, I want to see all sites with a confirmed crew booking so that I can plan around upcoming work.

*Acceptance criteria:*
- Shows `type: 'scheduled'` demo sites with scheduled date
- Tapping opens `DemoSiteSheet` showing weather forecast, nearby work, and permit restrictions

**US-205 — Completed Sites list**  
As an AWP enterprise customer, I want to see all completed jobs so that I can review invoices and track finished work.

*Acceptance criteria:*
- Shows `type: 'completed'` demo sites
- Tapping opens `DemoSiteSheet` showing the completed invoice via `AWPDocumentView`

**US-206 — Upcoming features teaser**  
As an AWP stakeholder viewing a demo, I want to see preview cards for upcoming platform features so that I understand the product roadmap.

*Acceptance criteria:*
- Two "Coming Soon" cards below the site list
- First card: references AI field assistants, risk analysis, schedule optimization
- Second card: references third-party integrations and partner ecosystem
- Tapping either card opens `ComingSoonSheet`
- Keryk AI footer at the bottom of the home screen

---

## Epic 3: Request Flow

**US-301 — Enter job details**  
As an AWP enterprise customer, I want to enter my work order number, job address, time of day, and construction type so that the system has enough context to generate the right traffic control plan.

*Acceptance criteria:*
- Required fields: Work Order #, Address (free-text or GPS), Time of Day (Day/Night), Construction Type (Underground/Overhead/Other)
- "Use my location" button triggers GPS and reverse-geocodes to a street address
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
As an AWP enterprise customer, I want to select the type of work I'm doing so that the system generates the correct traffic control plan or routes my request to an AWP engineer.

*Acceptance criteria:*
- Four options visible: Flagging, Lane Closure, Complex Job — Request a TCP, Shoulder Closure
- Flagging and Lane Closure produce an AI estimate
- Complex Job — Request a TCP bypasses the AI estimate (see US-308)
- Shoulder Closure opens `ComingSoonSheet`
- Selecting Lane Closure reveals Left Lane / Right Lane buttons
- Direction field shown for Flagging and Lane Closure; hidden for Complex Job
- Info banner shown when Complex Job is selected: "An AWP traffic engineer will review your site details and deliver a compliant, field-ready TCP within 72 hours."
- "Not sure? Ask the AWP AI Expert" link at the bottom activates the ElevenLabs widget

**US-304 — Review and submit**  
As an AWP enterprise customer, I want to review all my job details before submitting so that I can catch mistakes before the estimate is generated.

*Acceptance criteria:*
- Displays: WO#, address, time, construction type, work type, lane (if lane closure), direction, distance
- Budgetary disclaimer banner visible
- Edit button returns to Step 1 with all values preserved
- Submit calls `POST /api/estimate-proxy`
- Not shown for Complex Job path (US-308 bypasses review)

**US-305 — Submission loading state**  
As an AWP enterprise customer, I want to see a loading indicator while my estimate is being generated so that I know the request is in progress.

*Acceptance criteria:*
- Spinner and "Generating your estimate…" shown while fetch resolves
- On `200`, navigate to the inbox with the new job's detail sheet open
- On error, show inline error with a retry option

**US-306 — Abandon and resume**  
As an AWP enterprise customer, I want my form progress saved as I move between steps so that I don't lose my work if I navigate away mid-flow.

*Acceptance criteria:*
- `sessionStorage` preserves all form values across Step 1–4
- Cleared on successful submit, Complex Job submission, or explicit abandon

**US-307 — AI expert help on work type selection**  
As an AWP enterprise customer who is unsure which work type to pick, I want to ask the AI assistant directly from the work type screen so that I don't have to navigate away to get guidance.

*Acceptance criteria:*
- "Not sure? Ask the AWP AI Expert" link shown at the bottom of the work type screen
- Tapping activates the embedded `ElevenLabsWidget` (opens the voice UI)
- Widget is embedded in the request layout and available throughout all steps

**US-308 — Complex Job TCP request**  
As an AWP enterprise customer with a non-standard work zone (intersection, highway, mobile operation, detour), I want to request a custom TCP from an AWP engineer without going through the automated estimate flow so that I get a plan that's appropriate for my complex site.

*Acceptance criteria:*
- Selecting "Complex Job — Request a TCP" and tapping Next shows a sending overlay ("Sending TCP Request" with spinner)
- No review step — submission happens immediately from the work type screen
- After 2.2 seconds, form state is cleared and user is navigated to `/home`
- AWP receives site details (WO#, address, time of day, construction type, pin coordinates)

---

## Epic 4: Inbox

**US-401 — View all org estimates**  
As an AWP enterprise customer, I want to see all estimates submitted by my organization so that my team can review each other's work.

*Acceptance criteria:*
- List filtered by `metadata.customer_org` matching the logged-in user's Firebase custom claim
- Sorted newest first
- Each card shows: WO#, org name, address, work type · TA code, status badge, timestamp
- Real-time updates via `onSnapshot()`

**US-402 — Status at a glance**  
As an AWP enterprise customer, I want each job card to show a clear status badge so that I know which estimates are ready, processing, or failed.

*Acceptance criteria:*
- Processing — `estimate_response` absent
- Ready — `estimate_response.status === 'success'`
- Error — `estimate_response.status === 'failed'` with `failure_reason`
- Updates in real-time

**US-403 — Open job detail**  
As an AWP enterprise customer, I want to tap a job card and see the full estimate detail so that I can review the plan and take action on it.

*Acceptance criteria:*
- Tapping a card slides up `JobDetailSheet` as a full-screen bottom sheet
- Inbox dimmed behind the sheet
- Drag handle visible at top — swipe down to dismiss

---

## Epic 5: Job Detail

**US-501 — View plan image**  
As an AWP enterprise customer, I want to see the rendered traffic control plan image so that I can visually understand the proposed layout for my work zone.

*Acceptance criteria:*
- Full-width image loaded from `estimate_response.image_signed_url`
- Budgetary disclaimer banner persistent above image

**US-502 — View bill of materials**  
As an AWP enterprise customer, I want to see the full bill of materials for my plan so that I know exactly what equipment and devices are required.

*Acceptance criteria:*
- Displays all BOM fields: signs (with MUTCD code and quantity), devices, cones, sign stands, sandbags, flaggers
- Reads from `estimate_response.bom`; uses null-safe access (`?? 0`) for optional totals fields
- Scrollable within the sheet

**US-503 — Request a Quote**  
As an AWP enterprise customer, I want to request a formal pricing quote for my traffic control work.

*Acceptance criteria:*
- "Request a Quote" button visible on job detail sheet
- Tapping opens `ComingSoonSheet` with quote-specific messaging

**US-504 — Request a TCP**  
As an AWP enterprise customer, I want to request a reviewed, field-ready TCP from an AWP engineer directly from my estimate.

*Acceptance criteria:*
- "Request a TCP" button visible on job detail sheet
- Tapping submits the site to AWP engineering
- User receives a TCP back within 72 hours

**US-505 — Schedule a Crew**  
As an AWP enterprise customer, I want to schedule an AWP crew for a site directly from the job detail sheet.

*Acceptance criteria:*
- "Schedule a Crew" button on the job detail sheet opens `ScheduleCalendarSheet`
- See US-601 through US-604 for scheduling detail

**US-506 — Analyze Site Risks**  
As an AWP enterprise customer, I want an AI-powered risk analysis of my site so that I can identify hazards before work begins.

*Acceptance criteria:*
- "Analyze Site Risks" button visible on job detail sheet
- Tapping opens `ComingSoonSheet` with risk analysis messaging

**US-507 — Retry a failed estimate**  
As an AWP enterprise customer, I want to retry a failed estimate with my original inputs pre-filled so that I can resubmit without re-entering everything.

*Acceptance criteria:*
- Error state shows `failure_reason`-specific message
- "Try Again" pre-fills Step 1–3 with values from `service1_input.payload`
- Navigates to `/request/details`

**US-508 — Processing state in sheet**  
As an AWP enterprise customer, I want to see a loading state in the job detail sheet while my estimate is generating.

*Acceptance criteria:*
- Spinner shown when `estimate_response` is absent
- Sheet auto-updates via `onSnapshot()` when estimate completes
- Action buttons disabled while processing

---

## Epic 6: Schedule a Crew

**US-601 — View scheduling calendar**  
As an AWP enterprise customer, I want to see a two-week calendar of available crew slots so that I can pick the best day for my job.

*Acceptance criteria:*
- Opens as a bottom sheet from the "Schedule a Crew" button on job detail
- Shows 10 weekday slots (Mon–Fri for two weeks), no weekends
- Calendar is computed dynamically from the current date via `getNextWeekdays()`

**US-602 — View weather per day**  
As an AWP enterprise customer, I want to see the weather forecast for each available day so that I can avoid scheduling in bad conditions.

*Acceptance criteria:*
- Each day card shows a weather icon and temperature range
- Sequence: partly cloudy, sunny, rainy, showers, sunny, partly cloudy, sunny, overcast, cold, sunny
- Demo data — not connected to a live weather API

**US-603 — View crew availability**  
As an AWP enterprise customer, I want to see crew availability for each day so that I know which days have capacity.

*Acceptance criteria:*
- Each day shows availability: High, Medium, or Low
- Availability is by day of week: Mon=Medium, Tue=Low, Wed=Medium, Thu=Low, Fri=High

**US-604 — Friday discount**  
As an AWP enterprise customer, I want to know about scheduling discounts so that I can save money when my schedule is flexible.

*Acceptance criteria:*
- Friday slots have an amber border and a "5% OFF" badge
- An orange promotional banner appears above the calendar explaining the Friday discount
- Friday availability is always High

**US-605 — Confirm booking**  
As an AWP enterprise customer, I want to confirm a crew booking so that the slot is reserved for my job.

*Acceptance criteria:*
- Tapping a day selects it (highlighted state)
- Confirm button enabled once a day is selected
- On confirm, green success state shown for 1.8 seconds then sheet closes

---

## Epic 7: Notifications

**US-701 — View notification center**  
As an AWP enterprise customer, I want to see a list of status updates and offers related to my account so that I stay informed without checking the app constantly.

*Acceptance criteria:*
- Bell icon in the home screen header
- Orange badge shows count of unread notifications
- Tapping bell opens `NotificationSheet` as a bottom sheet

**US-702 — Job complete notification**  
As an AWP enterprise customer, I want to be notified when AWP completes a job at one of my sites so that I know the work is done and the invoice is ready.

*Acceptance criteria:*
- Notification type `job_complete` — green accent, checkmark icon
- Message includes job number and invoice reference
- Action link "View Invoice" opens the completed site detail

**US-703 — TCP ready notification**  
As an AWP enterprise customer, I want to be notified when my reviewed TCP plan is approved so that I know it's ready for the field.

*Acceptance criteria:*
- Notification type `tcp_ready` — blue accent
- Message includes job number, address, and scheduled date
- Action link opens the scheduled site detail

**US-704 — Incentive notification**  
As an AWP enterprise customer, I want to receive scheduling discount offers so that I can save money when my timing is flexible.

*Acceptance criteria:*
- Notification type `incentive` — orange accent
- Current incentive: Friday 5% crew cost discount

**US-705 — Predicted job alert**  
As an AWP enterprise customer, I want to receive proactive crew booking suggestions based on my work history so that I can get ahead of upcoming jobs before I even submit a request.

*Acceptance criteria:*
- Notification type `algo_insight` — violet accent, ✦ icon
- Content generated by AWP's behavioral analytics engine based on work cadence and regional patterns
- Example: prediction of a Ballantyne corridor job based on 4 prior jobs in the same zone
- Includes predicted date range, work zone, and a "Pre-Book Crew" action
- Action opens the scheduling calendar

**US-706 — Partner offer notification**  
As an AWP enterprise customer, I want to receive targeted supply offers from AWP-vetted partners so that I can source materials efficiently for my job types.

*Acceptance criteria:*
- Notification type `partner_offer` — sky blue accent, ★ icon
- Offer is targeted based on active job types and geography
- Example: pre-staged TA-30 sign packages from National Traffic Safety Supply for Charlotte jobs
- "View Offer" action tappable

**US-707 — Mark notifications read**  
As an AWP enterprise customer, I want to mark notifications as read so that the unread badge count stays accurate.

*Acceptance criteria:*
- Unread notifications show orange dot and colored left-border accent
- "Mark all read" button clears all unread state
- Tapping an individual action link marks that notification read
- Badge count on the bell icon reflects current unread count in real-time

---

## Epic 8: Demo Content

**US-801 — Scheduled site detail**  
As a demo viewer, I want to see a realistic scheduled site with contextual information so that I understand what AWP provides before a crew shows up.

*Acceptance criteria:*
- Demo site `demo-scheduled-001`: Duke Energy, 7936 Old Salisbury Rd, Linwood NC, July 15 2026
- Site detail sheet shows a status banner (amber — Scheduled)
- Weather card: partly cloudy, 87°F/68°F, 20% afternoon storm risk, advisory to start early
- Nearby work cards: Rowan County resurfacing (0.8 mi), Piedmont Natural Gas closure (0.2 mi)
- Restriction cards: town ordinance (high impact), county permit (medium), Duke notification (low)
- Estimate placeholder image shown below context cards

**US-802 — Completed site detail**  
As a demo viewer, I want to see a completed job with a realistic invoice so that I understand the full lifecycle from estimate to invoice.

*Acceptance criteria:*
- Demo site `demo-completed-001`: Verizon, 4400 Sharon Rd, Charlotte NC, June 15 2026
- Site detail sheet shows status banner (green — Completed)
- `AWPDocumentView` renders a styled AWP invoice with line items, quantities, and totals
- Invoice includes all AWP line item types: cones, signs, sign stands, sandbags, flaggers, delivery, pickup, traffic control employee hours

---

## Epic 9: AI Voice Assistant

**US-901 — Embedded AI widget**  
As an AWP enterprise customer, I want access to the AI traffic safety expert while I'm filling out a request so that I can get help on the spot without losing my progress.

*Acceptance criteria:*
- `ElevenLabsWidget` rendered in the request flow layout (`/request/layout.tsx`)
- Available on all four request steps
- "Not sure? Ask the AWP AI Expert" link on the work type step activates the widget
- Agent: `agent_8301kw2ea0h1ex0af3yjjee8kwef` (system prompt v1.7)

**US-902 — Dynamic variables injection**  
As the AWP AI, I want to receive session context from the app so that I can greet the user by name and reference their active job without them having to repeat themselves.

*Acceptance criteria:*
- Widget receives dynamic variables as a JSON attribute: `user_email`, `session_tenant_id`, `session_id`, `job_id`, `session_agent_id`, `location_lat`, `location_lng`
- Variables sourced from Firebase auth (`useAuth()`) and current form state
- Agent uses these to personalize the conversation

**US-903 — Work type guidance**  
As an AWP enterprise customer who is uncertain which work type to select, I want the AI to guide me to the right choice so that my estimate is generated correctly.

*Acceptance criteria:*
- Agent uses a decision tree: Complex Job check (Step 0) → shoulder check → lane count → flagging vs lane closure
- Agent immediately directs to "Complex Job — Request a TCP" for intersections, highways, mobile operations, detours, or staged closures — no follow-up questions
- Agent asks one clarifying question at a time for standard jobs

---

## Epic 10: PWA

**US-1001 — Install to home screen**  
As an AWP enterprise customer, I want to install the app to my phone's home screen so that I can access it like a native app.

*Acceptance criteria:*
- PWA manifest configured: name, icons, start_url, display: standalone
- Meets Chrome/Safari installability criteria
- App icon uses AWP branding

**US-1002 — Mobile-optimized layout**  
As an AWP enterprise customer using my phone in the field, I want the app to be fully usable on a mobile screen without zooming or horizontal scrolling.

*Acceptance criteria:*
- All screens fit within 390px viewport without horizontal scroll
- Touch targets minimum 44×44px
- `maximum-scale=1` prevents unintentional zoom on input focus (iOS)

---

*User stories v2.0 — updated 2026-06-29 to reflect delivered POC state*  
*Key changes from v1.0: Epic 2 rewritten (home is now map+tabs), Epic 3 updated (Complex Job added), Epics 5–7 updated (Schedule and TCP now live), Epics 6–10 added (Schedule, Notifications, Demo Content, AI Widget, PWA)*
