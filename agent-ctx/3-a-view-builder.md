# Task ID: 3-a — NMS View Components (Fleet Dashboard + Network Topology)

## Agent: View Builder
## Status: COMPLETED

### Objective
Build two primary NMS view components — Fleet Dashboard and Network Topology — and wire them into the existing layout/shell system.

---

## Files Created

### 1. `/src/components/nms/views/fleet-view.tsx` (347 lines)
**Fleet Dashboard** — the main radio fleet overview screen.

**Features built:**
- **Header section**: Title "Fleet Dashboard" with amber accent, subtitle with live radio count, "Add Radio" button
- **Site filter buttons**: All Sites, Alpha, Bravo, Charlie, Delta, Echo — connected to Zustand `setSiteFilter`
- **Status filter chips**: All, Online, Degraded, Offline — with StatusDot indicators, connected to `setStateFilter`
- **Search input**: Filters on callsign, MAC, and site name — connected to `setSearchQuery`
- **KPI strip** (5 responsive cards):
  - Total Radios — with sparkline trend and delta indicator
  - Online — with percentage and count
  - Avg SNR (dB) — with cyan sparkline
  - Avg Throughput (Mbps) — with amber sparkline
  - Active Alerts — with critical count and red sparkline
- **Radio Fleet Table** (10 columns):
  - Status dot, Callsign (mono font), Site badge (amber), Band, Form Factor, SNR with SignalBars, Throughput, Firmware, Config State (StatusChip), Last Seen (relative time)
  - All columns sortable via click (client-side ascending/descending sort)
  - Alternating hover effect on rows (`bg-[#161c27]`)
  - Row click → `selectRadio(id)` → navigates to radio detail view
  - Pagination with 15 rows per page, prev/next controls, page counter
- **Responsive**: Table scrolls horizontally on mobile, filter row wraps on small screens, KPI cards 2→3→5 columns

### 2. `/src/components/nms/views/topology-view.tsx` (342 lines)
**Network Topology** — SVG-based mesh network visualization.

**Features built:**
- **Header section**: Title "Network Topology" with amber accent, subtitle with node/link counts
- **View mode toggle**: Graph View / Map View (segmented control, amber active state)
- **Link quality legend**: OK (green), Warn (amber), Error (red) line indicators
- **SVG Canvas** (800×560 viewBox):
  - Subtle grid background pattern
  - **5 site clusters** positioned in a pentagon layout (Alpha top-left, Bravo top-right, Charlie center, Delta bottom-left, Echo bottom-right)
  - **Site labels**: Amber text badges above each cluster
  - **Links**: Lines between connected radios, color-coded by quality (ok/warn/err), thickness based on SNR, dimming when a node is selected
  - **Nodes**: Glowing circles with state-based colors, inner dot, callsign label below, SNR value on selected node
  - **SVG glow filters**: `nodeGlow` and `nodeGlowStrong` for highlighted nodes
  - **Interaction**: Hover highlights node + connected links, click selects radio via `selectRadio(id)`
  - Non-selected nodes/links dim when a node is active
- **Side Panel** (300px, right side, hidden on mobile):
  - Radio header: callsign, status dot, site badge, form factor, band
  - Status chip with color
  - 10 metric rows: SNR, Throughput, Neighbors, TX Power, CPU, Temperature, Battery, Uptime, Firmware, Config State — all color-coded
  - Active Links section: List of peer callsigns with SNR per link
  - SNR Trend sparkline (24h)
  - Throughput Trend sparkline (24h)
  - Empty state when no node selected: icon + instructions

### 3. `/src/components/nms/nms-shell.tsx` (Updated)
- Added conditional view rendering based on `useNMSStore().currentView`
- `fleet` → renders `FleetView`
- `topology` → renders `TopologyView`
- Other views → `null` (falls through to existing `PlaceholderView` in NMSLayout)

---

## Technical Details

- Both files start with `'use client'` directive
- TypeScript strict typing throughout
- All mock data imported from `@/lib/nms-data/mock-data`
- Store integration via `useNMSStore` for filters, navigation, and selection
- Utility components from `@/components/nms/nms-utils`: StatusDot, StatusChip, SignalBars, Sparkline, KPICard, PanelHeader, MetricRow, color constants
- No shadcn/ui imports used (as instructed)
- All precise color values use inline styles per design spec
- Layout uses Tailwind classes
- `font-mono` used for all numeric/data values
- ESLint passes cleanly on all new files (0 errors)
- Dev server compiles and serves GET / 200 successfully
