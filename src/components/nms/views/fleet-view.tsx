// =============================================================================
// Mesh Rider NMS — Fleet Dashboard View
// Task ID: 3-a | Main fleet overview with KPIs, filters, and radio table
// =============================================================================

'use client';

import React, { useState, useMemo } from 'react';
import {
  radios,
  links,
  getRadioStats,
  getAlertStats,
  type Radio,
  type RadioState,
} from '@/lib/nms-data/mock-data';
import { useNMSStore } from '@/lib/nms-data/store';
import {
  StatusDot,
  StatusChip,
  SignalBars,
  Sparkline,
  KPICard,
  PanelHeader,
  ProgressBar,
  COLORS,
  BG,
  TEXT,
  BORDER,
} from '@/components/nms/nms-utils';
import { useRealtimeSimulation } from '@/hooks/use-realtime-simulation';

// ─── Constants ──────────────────────────────────────────────────────────────

const SITES = ['All Sites', 'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'] as const;
const STATE_FILTERS = ['All', 'Online', 'Degraded', 'Offline'] as const;

type SortKey = 'callsign' | 'siteName' | 'snr' | 'throughput' | 'firmware' | 'configState' | 'lastSeen' | 'state';
type SortDir = 'asc' | 'desc';

// ─── Sparkline seed data (simulated 24-point trends) ────────────────────────

function seededSparkline(seed: number, variance: number, base: number): number[] {
  const data: number[] = [];
  let v = base;
  for (let i = 0; i < 24; i++) {
    v = base + Math.sin(seed + i * 0.4) * variance + Math.cos(seed * 2 + i * 0.7) * (variance * 0.5);
    data.push(Math.round(Math.max(0, v)));
  }
  return data;
}

// ─── Data Export Modal ──────────────────────────────────────────────────────

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

function DataExportModal({ open, onClose }: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [dataScope, setDataScope] = useState<'all' | 'site' | 'filter'>('all');
  const [exporting, setExporting] = useState(false);

  if (!open) return null;

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      onClose();
    }, 2000);
  };

  const formats = [
    { key: 'csv' as const, label: 'CSV', desc: 'Comma-separated values', icon: '📊' },
    { key: 'json' as const, label: 'JSON', desc: 'Structured data format', icon: '🔧' },
    { key: 'pdf' as const, label: 'PDF', desc: 'Formatted report', icon: '📄' },
  ];

  const scopes = [
    { key: 'all' as const, label: 'All Radios' },
    { key: 'site' as const, label: 'Selected Site' },
    { key: 'filter' as const, label: 'Current Filter' },
  ];

  const ranges = [
    { key: '7d' as const, label: 'Last 7 days' },
    { key: '30d' as const, label: 'Last 30 days' },
    { key: '90d' as const, label: 'Last 90 days' },
    { key: 'custom' as const, label: 'Custom range' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 glass-card" style={{ backdropFilter: 'blur(8px)', background: 'rgba(7, 9, 13, 0.75)' }} />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-xl border overflow-hidden"
        style={{
          backgroundColor: BG.card,
          borderColor: BORDER.default,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(244, 164, 23, 0.05)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: BORDER.default }}>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: TEXT.primary }}>Data Export</h3>
            <p className="text-[11px] mt-0.5" style={{ color: TEXT.tertiary }}>Generate a report from fleet data</p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-[#161c27] transition-colors"
            style={{ color: TEXT.tertiary }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5">
          {/* Export Format */}
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider block mb-2" style={{ color: TEXT.tertiary }}>
              Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {formats.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setExportFormat(f.key)}
                  className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border transition-all duration-150"
                  style={{
                    backgroundColor: exportFormat === f.key ? '#f4a41715' : BG.elevated,
                    borderColor: exportFormat === f.key ? '#f4a41750' : BORDER.default,
                    color: exportFormat === f.key ? COLORS.amber : TEXT.secondary,
                  }}
                >
                  <span className="text-lg">{f.icon}</span>
                  <span className="text-[11px] font-semibold">{f.label}</span>
                  <span className="text-[9px]" style={{ color: TEXT.tertiary }}>{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider block mb-2" style={{ color: TEXT.tertiary }}>
              Date Range
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ranges.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setDateRange(r.key)}
                  className="px-3 py-1.5 rounded-md text-[11px] font-medium transition-all"
                  style={{
                    backgroundColor: dateRange === r.key ? '#f4a41720' : 'transparent',
                    color: dateRange === r.key ? COLORS.amber : TEXT.secondary,
                    border: `1px solid ${dateRange === r.key ? '#f4a41740' : BORDER.default}`,
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {/* Mock date inputs */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                placeholder="2025-03-22"
                className="flex-1 px-3 py-1.5 rounded-md text-[11px] font-mono outline-none"
                style={{ backgroundColor: BG.input, border: `1px solid ${BORDER.default}`, color: TEXT.primary }}
              />
              <span className="text-[11px]" style={{ color: TEXT.tertiary }}>to</span>
              <input
                type="text"
                placeholder="2025-04-22"
                className="flex-1 px-3 py-1.5 rounded-md text-[11px] font-mono outline-none"
                style={{ backgroundColor: BG.input, border: `1px solid ${BORDER.default}`, color: TEXT.primary }}
              />
            </div>
          </div>

          {/* Data Scope */}
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider block mb-2" style={{ color: TEXT.tertiary }}>
              Data Scope
            </label>
            <div className="flex flex-wrap gap-1.5">
              {scopes.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setDataScope(s.key)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all"
                  style={{
                    backgroundColor: dataScope === s.key ? '#2c3647' : 'transparent',
                    color: dataScope === s.key ? TEXT.primary : TEXT.secondary,
                    border: `1px solid ${dataScope === s.key ? BORDER.hover : 'transparent'}`,
                  }}
                >
                  {s.key === dataScope && (
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.cyan }} />
                  )}
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: BORDER.default }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ color: TEXT.secondary, backgroundColor: BG.elevated, border: `1px solid ${BORDER.default}` }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: COLORS.amber, color: '#07090d' }}
          >
            {exporting ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Exporting…
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Network Health Score Panel ─────────────────────────────────────────────

function NetworkHealthScore() {
  const { tick, fluctuate } = useRealtimeSimulation();

  const segments = [
    { label: 'Mesh Connectivity', value: fluctuate(95, 2), color: COLORS.ok },
    { label: 'Signal Quality', value: fluctuate(88, 3), color: COLORS.cyan },
    { label: 'Throughput', value: fluctuate(92, 2.5), color: COLORS.amber },
    { label: 'Security', value: fluctuate(100, 0), color: COLORS.ok },
  ];

  const overallScore = Math.round(
    segments.reduce((sum, s) => sum + s.value, 0) / segments.length
  );

  const scoreColor = overallScore > 90 ? COLORS.ok : overallScore > 70 ? COLORS.amber : COLORS.err;

  // SVG circular progress
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (overallScore / 100) * circumference;
  const offset = circumference - progress;

  return (
    <div
      className="rounded-lg border overflow-hidden hover-lift"
      style={{ backgroundColor: BG.card, borderColor: BORDER.default }}
    >
      <PanelHeader
        title="Network Health Score"
        subtitle="Real-time mesh network assessment"
        right={
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${scoreColor}15`,
              color: scoreColor,
              border: `1px solid ${scoreColor}30`,
            }}
          >
            Updated just now
          </span>
        }
      />
      <div className="p-5 flex flex-col lg:flex-row items-center gap-6">
        {/* Circular Score */}
        <div className="flex-shrink-0 relative">
          <svg width="140" height="140" viewBox="0 0 140 140">
            {/* Background circle */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#222b39"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 70 70)"
              style={{
                transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease',
                filter: `drop-shadow(0 0 6px ${scoreColor}44)`,
              }}
            />
            {/* Inner glow ring */}
            <circle
              cx="70"
              cy="70"
              r={radius - 12}
              fill="none"
              stroke={`${scoreColor}11`}
              strokeWidth="1"
            />
          </svg>
          {/* Score text centered */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-3xl font-bold tabular-nums leading-none animate-score-pulse"
              style={{ color: scoreColor }}
            >
              {overallScore}
            </span>
            <span className="text-[10px] font-medium mt-1" style={{ color: TEXT.tertiary }}>
              out of 100
            </span>
          </div>
        </div>

        {/* Segment Bars */}
        <div className="flex-1 w-full space-y-3.5">
          {segments.map((seg) => (
            <div key={seg.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: TEXT.secondary }}>
                  {seg.label}
                </span>
                <span
                  className="text-[11px] font-mono font-semibold tabular-nums"
                  style={{ color: seg.color }}
                >
                  {Math.round(seg.value)}%
                </span>
              </div>
              <div
                className="w-full rounded-full overflow-hidden"
                style={{ height: 5, backgroundColor: '#222b39' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${seg.value}%`,
                    backgroundColor: seg.color,
                    minWidth: seg.value > 0 ? 2 : 0,
                    boxShadow: `0 0 8px ${seg.color}44`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Fleet Dashboard Component ──────────────────────────────────────────────

export default function FleetView() {
  const {
    siteFilter,
    setSiteFilter,
    stateFilter,
    setStateFilter,
    searchQuery,
    setSearchQuery,
    selectRadio,
  } = useNMSStore();

  const [sortKey, setSortKey] = useState<SortKey>('callsign');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [exportOpen, setExportOpen] = useState(false);

  const stats = getRadioStats();
  const alertStats = getAlertStats();

  // ── Filtered + sorted radios ──
  const filteredRadios = useMemo(() => {
    let list = [...radios];

    // Site filter
    if (siteFilter && siteFilter !== 'all' && siteFilter !== 'All Sites') {
      list = list.filter((r) => r.siteName.toLowerCase() === siteFilter.toLowerCase());
    }

    // State filter
    if (stateFilter && stateFilter !== 'all' && stateFilter !== 'All') {
      list = list.filter((r) => r.state === stateFilter.toLowerCase());
    }

    // Search filter (callsign or MAC)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.callsign.toLowerCase().includes(q) ||
          r.mac.toLowerCase().includes(q) ||
          r.siteName.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'callsign': cmp = a.callsign.localeCompare(b.callsign); break;
        case 'siteName': cmp = a.siteName.localeCompare(b.siteName); break;
        case 'snr': cmp = a.snr - b.snr; break;
        case 'throughput': cmp = a.throughput - b.throughput; break;
        case 'firmware': cmp = a.firmware.localeCompare(b.firmware); break;
        case 'configState': cmp = a.configState.localeCompare(b.configState); break;
        case 'lastSeen': cmp = a.lastSeen.localeCompare(b.lastSeen); break;
        case 'state': cmp = a.state.localeCompare(b.state); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [siteFilter, stateFilter, searchQuery, sortKey, sortDir]);

  // ── Sort handler ──
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span style={{ color: TEXT.muted }} className="ml-1 opacity-0 group-hover:opacity-60">⇅</span>;
    return <span style={{ color: COLORS.amber }} className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  // ── Pagination ──
  const PAGE_SIZE = 15;
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(filteredRadios.length / PAGE_SIZE));
  const pagedRadios = filteredRadios.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when filters change
  React.useEffect(() => { setPage(0); }, [siteFilter, stateFilter, searchQuery]);

  // Format current date for welcome banner
  const currentDate = useMemo(() => {
    const now = new Date()
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [])

  return (
    <div className="p-4 lg:p-6 space-y-5 grid-bg" style={{ backgroundColor: BG.panel }}>
      {/* ── Welcome Banner ── */}
      <div
        className="relative rounded-lg overflow-hidden animate-border-glow"
        style={{
          background: 'linear-gradient(135deg, #11161f 0%, #161c27 100%)',
          border: `1px solid rgba(244, 164, 23, 0.3)`,
        }}
      >
        {/* Mesh grid background pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(45, 212, 255, 0.12) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* Left amber accent border */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
          style={{
            background: `linear-gradient(180deg, ${COLORS.amber}, ${COLORS.cyan}88, ${COLORS.amber})`,
          }}
        />
        <div className="relative px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: TEXT.primary }}>
                Welcome back, <span style={{ color: COLORS.amber }}>Jabbir</span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono" style={{ color: TEXT.tertiary }}>
              <span>{currentDate}</span>
              <span>·</span>
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: '#2dd4ff12',
                  color: '#2dd4ff',
                  border: '1px solid #2dd4ff25',
                }}
              >
                Mesh Rider OS v7.2.1
              </span>
              <span>·</span>
              <span>Last login: 2 minutes ago</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick stat chips */}
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 hover:scale-[1.03] hover:shadow-lg cursor-default"
              style={{
                backgroundColor: `${COLORS.ok}12`,
                color: COLORS.ok,
                border: `1px solid ${COLORS.ok}25`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.ok }} />
              24 Radios Online
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 hover:scale-[1.03] hover:shadow-lg cursor-default"
              style={{
                backgroundColor: `${COLORS.err}12`,
                color: COLORS.err,
                border: `1px solid ${COLORS.err}25`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.err }} />
              2 Alerts Active
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 hover:scale-[1.03] hover:shadow-lg cursor-default"
              style={{
                backgroundColor: `${COLORS.ok}12`,
                color: COLORS.ok,
                border: `1px solid ${COLORS.ok}25`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.ok }} />
              All Systems Operational
            </span>
          </div>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: TEXT.primary }}>
              Mesh Rider <span style={{ color: COLORS.amber }}>Dashboard</span>
            </h1>
            <p className="text-xs mt-1 font-mono" style={{ color: TEXT.tertiary }}>
              Live fleet overview · {stats.total} Mesh Rider radios · one dashboard
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setExportOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
              style={{
                backgroundColor: BG.elevated,
                color: TEXT.secondary,
                border: `1px solid ${BORDER.default}`,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </button>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98] shrink-0"
              style={{
                backgroundColor: COLORS.amber,
                color: '#07090d',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Radio
            </button>
          </div>
        </div>

        {/* ── Filters Row ── */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Site filter buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {SITES.map((site) => {
              const val = site === 'All Sites' ? 'all' : site.toLowerCase();
              const isActive = siteFilter === val || (siteFilter === 'all' && site === 'All Sites');
              return (
                <button
                  key={site}
                  onClick={() => setSiteFilter(val)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={{
                    backgroundColor: isActive ? COLORS.amber + '20' : BG.card,
                    color: isActive ? COLORS.amber : TEXT.secondary,
                    border: `1px solid ${isActive ? COLORS.amber + '40' : BORDER.default}`,
                  }}
                >
                  {site}
                </button>
              );
            })}
          </div>

          {/* Spacer */}
          <div className="hidden md:block flex-1" />

          {/* Status chips */}
          <div className="flex items-center gap-1.5">
            {STATE_FILTERS.map((s) => {
              const val = s === 'All' ? 'all' : s.toLowerCase();
              const isActive = stateFilter === val || (stateFilter === 'all' && s === 'All');
              return (
                <button
                  key={s}
                  onClick={() => setStateFilter(val)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                  style={{
                    backgroundColor: isActive ? '#2c3647' : 'transparent',
                    color: isActive ? TEXT.primary : TEXT.tertiary,
                    border: `1px solid ${isActive ? BORDER.hover : 'transparent'}`,
                  }}
                >
                  {s !== 'All' && <StatusDot status={s.toLowerCase()} size="sm" pulse={false} />}
                  {s}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative shrink-0">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2"
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={TEXT.tertiary} strokeWidth="2" strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search callsign, MAC…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg text-xs font-mono outline-none transition-colors w-48 lg:w-56"
              style={{
                backgroundColor: BG.input,
                border: `1px solid ${BORDER.default}`,
                color: TEXT.primary,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard
          label="Total Radios"
          value={stats.total}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
          delta={2.4}
          deltaLabel=""
          sparkline={seededSparkline(1, 2, stats.total)}
          sparklineColor={COLORS.cyan}
        />
        <KPICard
          label="Online"
          value={`${stats.online}`}
          unit={`/ ${stats.total}`}
          delta={stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}
          deltaLabel="%"
          sparkline={seededSparkline(2, 1.5, stats.online)}
          sparklineColor={COLORS.ok}
        />
        <KPICard
          label="Avg SNR"
          value={stats.avgSnr}
          unit="dB"
          delta={1.2}
          deltaLabel="dB"
          sparkline={seededSparkline(3, 3, stats.avgSnr)}
          sparklineColor={COLORS.cyan}
        />
        <KPICard
          label="Avg Throughput"
          value={stats.avgThroughput}
          unit="Mbps"
          delta={5.8}
          deltaLabel="Mbps"
          sparkline={seededSparkline(4, 15, stats.avgThroughput)}
          sparklineColor={COLORS.amber}
        />
        <KPICard
          label="Active Alerts"
          value={alertStats.critical + alertStats.warning}
          unit={`(${alertStats.critical} crit)`}
          delta={-1}
          deltaLabel=""
          sparkline={seededSparkline(5, 2, alertStats.critical + alertStats.warning)}
          sparklineColor={COLORS.err}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
        />
      </div>

      {/* ── Network Health Score Panel ── */}
      <NetworkHealthScore />

      {/* ── Radio Fleet Table ── */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{ backgroundColor: BG.card, borderColor: BORDER.default }}
      >
        <PanelHeader
          title="Radio Fleet"
          subtitle={`${filteredRadios.length} radio${filteredRadios.length !== 1 ? 's' : ''} shown`}
          right={
            <span className="text-[10px] font-mono px-2 py-1 rounded" style={{ backgroundColor: BG.input, color: TEXT.tertiary }}>
              Page {page + 1} / {totalPages}
            </span>
          }
        />

        {/* Table wrapper with horizontal scroll */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: 900 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER.default}` }}>
                {([
                  { key: 'state' as SortKey, label: 'Status', w: 'w-20' },
                  { key: 'callsign' as SortKey, label: 'Callsign', w: 'w-32' },
                  { key: 'siteName' as SortKey, label: 'Site', w: 'w-24' },
                  { key: null as SortKey, label: 'Band', w: 'w-28' },
                  { key: null as SortKey, label: 'Form Factor', w: 'w-24' },
                  { key: 'snr' as SortKey, label: 'SNR', w: 'w-28' },
                  { key: 'throughput' as SortKey, label: 'Throughput', w: 'w-28' },
                  { key: 'firmware' as SortKey, label: 'Firmware', w: 'w-36' },
                  { key: 'configState' as SortKey, label: 'Config', w: 'w-24' },
                  { key: 'lastSeen' as SortKey, label: 'Last Seen', w: 'w-36' },
                ]).map((col) => (
                  <th
                    key={col.label}
                    className={`${col.w} text-left px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider group cursor-default select-none ${
                      col.key ? 'cursor-pointer hover:bg-[#161c27]' : ''
                    }`}
                    style={{ color: TEXT.tertiary }}
                    onClick={() => col.key && handleSort(col.key)}
                  >
                    <div className="flex items-center whitespace-nowrap">
                      {col.label}
                      {col.key && <SortIcon col={col.key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedRadios.map((radio, idx) => (
                <tr
                  key={radio.id}
                  className="transition-all duration-150 cursor-pointer group"
                  style={{
                    borderBottom: `1px solid ${BORDER.default}33`,
                    backgroundColor: idx % 2 === 0 ? '#11161f' : '#0e1219',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(244, 164, 23, 0.06)'
                    e.currentTarget.style.borderLeft = `2px solid ${COLORS.amber}`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#11161f' : '#0e1219'
                    e.currentTarget.style.borderLeft = '2px solid transparent'
                  }}
                  onClick={() => selectRadio(radio.id)}
                >
                  {/* Status */}
                  <td className="px-3 py-2.5">
                    <StatusDot status={radio.state} size="md" pulse />
                  </td>

                  {/* Callsign */}
                  <td className="px-3 py-2.5">
                    <span className="font-semibold font-mono" style={{ color: TEXT.primary }}>
                      {radio.callsign}
                    </span>
                  </td>

                  {/* Site */}
                  <td className="px-3 py-2.5">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider"
                      style={{
                        backgroundColor: COLORS.amber + '12',
                        color: COLORS.amber,
                      }}
                    >
                      {radio.siteName}
                    </span>
                  </td>

                  {/* Band */}
                  <td className="px-3 py-2.5">
                    <span className="font-mono" style={{ color: TEXT.secondary }}>
                      {radio.band}
                    </span>
                  </td>

                  {/* Form Factor */}
                  <td className="px-3 py-2.5">
                    <span style={{ color: TEXT.secondary }}>{radio.formFactor}</span>
                  </td>

                  {/* SNR with SignalBars */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <SignalBars snr={radio.snr} size="sm" />
                      <span className="font-mono" style={{ color: TEXT.primary }}>
                        {radio.snr > 0 ? `${radio.snr}` : '—'}
                        <span style={{ color: TEXT.tertiary }}> dB</span>
                      </span>
                    </div>
                  </td>

                  {/* Throughput */}
                  <td className="px-3 py-2.5">
                    <span className="font-mono" style={{ color: TEXT.primary }}>
                      {radio.throughput > 0 ? `${radio.throughput}` : '—'}
                      <span style={{ color: TEXT.tertiary }}> Mbps</span>
                    </span>
                  </td>

                  {/* Firmware */}
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-[11px]" style={{ color: TEXT.secondary }}>
                      {radio.firmware}
                    </span>
                  </td>

                  {/* Config State */}
                  <td className="px-3 py-2.5">
                    <StatusChip status={radio.configState} size="sm" label={radio.configState === 'in-sync' ? 'synced' : 'drift'} />
                  </td>

                  {/* Last Seen */}
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-[11px]" style={{ color: TEXT.tertiary }}>
                      {formatLastSeen(radio.lastSeen)}
                    </span>
                  </td>
                </tr>
              ))}

              {pagedRadios.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <p className="text-sm" style={{ color: TEXT.tertiary }}>
                      No radios match the current filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderTop: `1px solid ${BORDER.default}44` }}
          >
            <span className="text-[11px] font-mono" style={{ color: TEXT.tertiary }}>
              Showing {(page * PAGE_SIZE) + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredRadios.length)} of {filteredRadios.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2.5 py-1 rounded text-[11px] font-medium transition-all disabled:opacity-30"
                style={{
                  backgroundColor: page > 0 ? BG.elevated : 'transparent',
                  color: TEXT.secondary,
                  border: `1px solid ${BORDER.default}`,
                }}
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-2.5 py-1 rounded text-[11px] font-medium transition-all disabled:opacity-30"
                style={{
                  backgroundColor: page < totalPages - 1 ? BG.elevated : 'transparent',
                  color: TEXT.secondary,
                  border: `1px solid ${BORDER.default}`,
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Data Export Modal ── */}
      <DataExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatLastSeen(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);

    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d ago`;
  } catch {
    return '—';
  }
}
