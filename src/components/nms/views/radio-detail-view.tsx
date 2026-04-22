'use client';

import React, { useState, useMemo } from 'react';
import { useNMSStore } from '@/lib/nms-data/store';
import { radios, links, auditEvents } from '@/lib/nms-data/mock-data';
import type { Link, Radio, ActionType } from '@/lib/nms-data/mock-data';
import {
  COLORS, BG, TEXT, BORDER,
  StatusDot, StatusChip, SignalBars, Sparkline, ProgressBar,
  KPICard, PanelHeader, SegmentedControl, Panel, MetricRow, MutedBadge, EmptyState,
} from '../nms-utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Deterministic pseudo-random for hydration safety (sin-hash)
function detRand(i: number, offset = 0): number {
  return Math.abs(Math.sin((i + offset) * 12.9898 + 78.233) * 43758.5453) % 1;
}

function generateSparkline(baseValue: number, variance: number, noise: number, count = 20): number[] {
  return Array.from({ length: count }, (_, i) =>
    Math.round((baseValue + Math.sin(i * 0.5) * variance + detRand(i) * noise) * 10) / 10
  );
}

type TabId = 'overview' | 'telemetry' | 'config' | 'events' | 'security';
const TABS: { value: TabId; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'telemetry', label: 'Telemetry' },
  { value: 'config', label: 'Config' },
  { value: 'events', label: 'Events' },
  { value: 'security', label: 'Security' },
];

type TimeRange = '1H' | '6H' | '24H' | '7D';
const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '1H', label: '1H' },
  { value: '6H', label: '6H' },
  { value: '24H', label: '24H' },
  { value: '7D', label: '7D' },
];

// ─── Link Quality Chart (SVG Area Chart) ─────────────────────────────────────

function LinkQualityChart({ snr, timeRange }: { snr: number; timeRange: TimeRange }) {
  const pointCount = timeRange === '1H' ? 12 : timeRange === '6H' ? 24 : timeRange === '24H' ? 48 : 56;
  const snrData = Array.from({ length: pointCount }, (_, i) =>
    Math.max(0, snr + Math.sin(i * 0.4) * 5 + (detRand(i, 10) - 0.5) * 6)
  );
  const perData = Array.from({ length: pointCount }, (_, i) =>
    Math.max(0, Math.min(100, 3 + Math.sin(i * 0.3 + 2) * 4 + detRand(i, 20) * 5))
  );

  const w = 600;
  const h = 180;
  const pad = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  // Y axis for SNR: 0–45 dB
  const snrMin = 0;
  const snrMax = 45;

  const toX = (i: number) => pad.left + (i / (pointCount - 1)) * chartW;
  const snrToY = (v: number) => pad.top + (1 - (v - snrMin) / (snrMax - snrMin)) * chartH;
  const perToY = (v: number) => pad.top + (1 - v / 100) * chartH;

  // Grid lines
  const gridLines = [0, 10, 20, 30, 40];

  // Time labels
  const timeLabels = timeRange === '1H'
    ? ['0m', '10m', '20m', '30m', '40m', '50m', '60m']
    : timeRange === '6H'
    ? ['0h', '1h', '2h', '3h', '4h', '5h', '6h']
    : timeRange === '24H'
    ? ['0h', '4h', '8h', '12h', '16h', '20h', '24h']
    : ['0d', '1d', '2d', '3d', '4d', '5d', '6d', '7d'];

  const snrPath = snrData.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)},${snrToY(v)}`).join(' ');
  const snrArea = `${snrPath} L ${toX(pointCount - 1)},${pad.top + chartH} L ${pad.left},${pad.top + chartH} Z`;

  const perPath = perData.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)},${perToY(v)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" style={{ minHeight: 160 }}>
      {/* Grid */}
      {gridLines.map((v) => (
        <g key={v}>
          <line x1={pad.left} y1={snrToY(v)} x2={w - pad.right} y2={snrToY(v)}
            stroke={BORDER.default} strokeWidth={0.5} strokeDasharray="3,3" />
          <text x={pad.left - 6} y={snrToY(v) + 3} textAnchor="end"
            fill={TEXT.tertiary} fontSize={9} fontFamily="monospace">{v}</text>
        </g>
      ))}
      {/* Y-axis label */}
      <text x={10} y={pad.top + chartH / 2} textAnchor="middle"
        fill={TEXT.tertiary} fontSize={9} transform={`rotate(-90, 10, ${pad.top + chartH / 2})`}>
        SNR (dB)
      </text>
      {/* X-axis labels */}
      {timeLabels.map((lbl, i) => {
        const x = pad.left + (i / (timeLabels.length - 1)) * chartW;
        return (
          <text key={lbl} x={x} y={h - 6} textAnchor="middle"
            fill={TEXT.tertiary} fontSize={8} fontFamily="monospace">{lbl}</text>
        );
      })}
      {/* SNR area fill */}
      <path d={snrArea} fill={COLORS.ok} opacity={0.08} />
      {/* SNR line */}
      <path d={snrPath} fill="none" stroke={COLORS.ok} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
      {/* PER line (dashed amber) */}
      <path d={perPath} fill="none" stroke={COLORS.warn} strokeWidth={1.5}
        strokeDasharray="6,4" strokeLinecap="round" strokeLinejoin="round" />
      {/* Legend */}
      <g transform={`translate(${w - pad.right - 140}, ${pad.top})`}>
        <line x1={0} y1={6} x2={16} y2={6} stroke={COLORS.ok} strokeWidth={2} />
        <text x={20} y={9} fill={TEXT.secondary} fontSize={9}>SNR</text>
        <line x1={55} y1={6} x2={71} y2={6} stroke={COLORS.warn} strokeWidth={1.5} strokeDasharray="4,3" />
        <text x={75} y={9} fill={TEXT.secondary} fontSize={9}>PER (%)</text>
      </g>
    </svg>
  );
}

// ─── Location Panel (Mini Map) ───────────────────────────────────────────────

function LocationPanel({ lat, lng, siteName }: { lat: number; lng: number; siteName: string }) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ backgroundColor: BG.panel, borderColor: BORDER.default }}
    >
      <PanelHeader title="Location" subtitle={siteName} />
      <div className="p-4">
        {/* Mini map-like display */}
        <div
          className="relative w-full rounded-md overflow-hidden"
          style={{
            height: 140,
            backgroundColor: '#0a0e14',
            backgroundImage: `
              linear-gradient(${BORDER.default}33 1px, transparent 1px),
              linear-gradient(90deg, ${BORDER.default}33 1px, transparent 1px)
            `,
            backgroundSize: '16px 16px',
          }}
        >
          {/* Crosshair lines */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-full h-px" style={{ backgroundColor: BORDER.default + '66' }} />
            <div className="absolute h-full w-px" style={{ backgroundColor: BORDER.default + '66' }} />
          </div>
          {/* Pulsing amber dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="absolute rounded-full animate-ping"
              style={{ width: 24, height: 24, backgroundColor: COLORS.amber, opacity: 0.25 }}
            />
            <div
              className="absolute rounded-full"
              style={{
                width: 10,
                height: 10,
                backgroundColor: COLORS.amber,
                boxShadow: `0 0 12px ${COLORS.amber}88`,
              }}
            />
          </div>
          {/* Coordinate labels */}
          <div className="absolute bottom-2 left-2 text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{ backgroundColor: '#07090dcc', color: TEXT.tertiary }}>
            {lat.toFixed(4)}°N
          </div>
          <div className="absolute bottom-2 right-2 text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{ backgroundColor: '#07090dcc', color: TEXT.tertiary }}>
            {Math.abs(lng).toFixed(4)}°W
          </div>
        </div>
        {/* GPS coordinates */}
        <div className="mt-3 flex gap-2">
          <div className="flex-1 rounded-md px-2.5 py-2" style={{ backgroundColor: BG.input }}>
            <span className="text-[10px] uppercase tracking-wider block" style={{ color: TEXT.tertiary }}>Lat</span>
            <span className="text-xs font-mono font-medium" style={{ color: TEXT.secondary }}>{lat.toFixed(6)}</span>
          </div>
          <div className="flex-1 rounded-md px-2.5 py-2" style={{ backgroundColor: BG.input }}>
            <span className="text-[10px] uppercase tracking-wider block" style={{ color: TEXT.tertiary }}>Lng</span>
            <span className="text-xs font-mono font-medium" style={{ color: TEXT.secondary }}>{lng.toFixed(6)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function RadioDetailView() {
  const { selectedRadioId, setView, selectRadio } = useNMSStore();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('6H');

  const radio = useMemo(() => radios.find(r => r.id === selectedRadioId), [selectedRadioId]);

  const neighborLinks = useMemo(() => {
    if (!radio) return [];
    return links.filter((l: Link) => l.radioA === radio.id || l.radioB === radio.id);
  }, [radio]);

  const neighbors = useMemo(() => {
    if (!radio) return [];
    return neighborLinks.map((link: Link) => {
      const neighborId = link.radioA === radio.id ? link.radioB : link.radioA;
      const neighbor = radios.find(r => r.id === neighborId);
      return { link, neighbor };
    }).filter(n => n.neighbor);
  }, [radio, neighborLinks]);

  // ─── Empty state ──────────────────────────────────────────────────────────
  if (!radio) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <EmptyState
          icon={
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.05 4.558A5 5 0 0 1 14 2h1a5 5 0 0 1 5 5v1a5 5 0 0 1-2.558 4.55" />
              <path d="M4 14.899A7 7 0 1 0 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
              <path d="M12 12v9" />
              <path d="m8 17 4 4 4-4" />
            </svg>
          }
          title="Select a radio from the fleet"
          description="Choose a radio from the Fleet Dashboard or topology map to view detailed performance, configuration, and diagnostics."
        />
      </div>
    );
  }

  // ─── Sparkline data ───────────────────────────────────────────────────────
  const snrSparkline = generateSparkline(radio.snr, 3, 2);
  const throughputSparkline = generateSparkline(radio.throughput, 15, 8);
  const txPowerSparkline = generateSparkline(radio.txPower, 1.5, 0.8);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* ─── Breadcrumb ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { selectRadio(null); setView('fleet'); }}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors"
          style={{ color: TEXT.secondary, backgroundColor: 'transparent' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = BG.elevated; e.currentTarget.style.color = TEXT.primary; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = TEXT.secondary; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>
        <span style={{ color: TEXT.muted }}>/</span>
        <span className="text-xs" style={{ color: TEXT.secondary }}>Fleet</span>
        <span style={{ color: TEXT.muted }}>/</span>
        <span className="text-xs" style={{ color: TEXT.secondary }}>Radio</span>
        <span style={{ color: TEXT.muted }}>/</span>
        <span className="text-xs font-medium" style={{ color: TEXT.primary }}>{radio.callsign}</span>
      </div>

      {/* ─── Radio Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <StatusDot status={radio.state} size="lg" />
            <h1 className="text-2xl font-bold" style={{ color: TEXT.primary }}>{radio.callsign}</h1>
            <StatusChip status={radio.state} label={radio.state.toUpperCase()} size="sm" />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: TEXT.secondary }}>
            <span className="font-medium">{radio.formFactor}</span>
            <MutedBadge>{radio.band}</MutedBadge>
            <span className="font-mono">{radio.mac}</span>
            <span className="font-mono">{radio.ip}</span>
            <span>Site {radio.siteName}</span>
            <span>FW {radio.firmware}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ActionButton icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" x2="4" y1="22" y2="15" />
            </svg>
          } label="SSH" />
          <ActionButton icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" />
            </svg>
          } label="Reboot" />
          <ActionButton icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
            </svg>
          } label="Push Firmware" />
          <ActionButton primary icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
              <path d="M12 18v-6" /><path d="m9 15 3-3 3 3" />
            </svg>
          } label="Apply Template" />
        </div>
      </div>

      {/* ─── Tab Bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b" style={{ borderColor: BORDER.default }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="px-4 py-2.5 text-xs font-medium transition-colors relative"
              style={{
                color: isActive ? COLORS.amber : TEXT.tertiary,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = TEXT.secondary; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = TEXT.tertiary; }}
            >
              {tab.label}
              {isActive && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: COLORS.amber }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Tab Content ────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <OverviewTab radio={radio} neighbors={neighbors} snrSparkline={snrSparkline} throughputSparkline={throughputSparkline} txPowerSparkline={txPowerSparkline} timeRange={timeRange} setTimeRange={setTimeRange} />
      )}

      {activeTab === 'telemetry' && <TelemetryTab radio={radio} />}

      {activeTab === 'config' && <ConfigTab radio={radio} />}

      {activeTab === 'events' && <EventsTab radio={radio} />}

      {activeTab === 'security' && <SecurityTab radio={radio} />}
    </div>
  );
}

// ─── Action Button ───────────────────────────────────────────────────────────

function ActionButton({
  label,
  icon,
  primary = false,
}: {
  label: string;
  icon: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
      style={{
        backgroundColor: primary ? COLORS.amber + '20' : BG.elevated,
        color: primary ? COLORS.amber : TEXT.secondary,
        border: `1px solid ${primary ? COLORS.amber + '40' : BORDER.default}`,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (primary) {
          e.currentTarget.style.backgroundColor = COLORS.amber + '30';
        } else {
          e.currentTarget.style.borderColor = BORDER.hover;
          e.currentTarget.style.color = TEXT.primary;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = primary ? COLORS.amber + '20' : BG.elevated;
        e.currentTarget.style.color = primary ? COLORS.amber : TEXT.secondary;
        e.currentTarget.style.borderColor = primary ? COLORS.amber + '40' : BORDER.default;
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({ radio, neighbors, snrSparkline, throughputSparkline, txPowerSparkline, timeRange, setTimeRange }: {
  radio: Radio;
  neighbors: { link: Link; neighbor: Radio | undefined }[];
  snrSparkline: number[];
  throughputSparkline: number[];
  txPowerSparkline: number[];
  timeRange: TimeRange;
  setTimeRange: (v: TimeRange) => void;
}) {
  const { selectRadio } = useNMSStore();

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard
          label="SNR"
          value={radio.snr}
          unit="dB"
          icon={<SignalBars snr={radio.snr} size="sm" />}
          sparkline={snrSparkline}
          sparklineColor={COLORS.ok}
        />
        <KPICard
          label="Throughput"
          value={radio.throughput}
          unit="Mbps"
          sparkline={throughputSparkline}
          sparklineColor={COLORS.cyan}
        />
        <KPICard
          label="Tx Power"
          value={radio.txPower}
          unit="dBm"
          sparkline={txPowerSparkline}
          sparklineColor={COLORS.amber}
        />
        <div className="rounded-lg border p-4" style={{ backgroundColor: BG.card, borderColor: BORDER.default }}>
          <span className="text-[10px] font-medium uppercase tracking-wider block mb-2" style={{ color: TEXT.tertiary }}>CPU / Temp</span>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold tabular-nums leading-none" style={{ color: TEXT.primary }}>{radio.cpu}</span>
            <span className="text-xs" style={{ color: TEXT.tertiary }}>%</span>
            <span className="text-xs" style={{ color: TEXT.muted }}>·</span>
            <span className="text-sm font-semibold tabular-nums" style={{ color: radio.temp > 60 ? COLORS.warn : TEXT.primary }}>{radio.temp}°C</span>
          </div>
          <ProgressBar value={radio.temp} max={80} color={radio.temp > 65 ? COLORS.err : radio.temp > 55 ? COLORS.warn : COLORS.ok} height={4} />
        </div>
        <div className="rounded-lg border p-4" style={{ backgroundColor: BG.card, borderColor: BORDER.default }}>
          <span className="text-[10px] font-medium uppercase tracking-wider block mb-2" style={{ color: TEXT.tertiary }}>Battery</span>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold tabular-nums leading-none" style={{ color: radio.battery <= 25 ? COLORS.err : radio.battery <= 50 ? COLORS.warn : TEXT.primary }}>{radio.battery}</span>
            <span className="text-xs" style={{ color: TEXT.tertiary }}>%</span>
          </div>
          <ProgressBar value={radio.battery} color={radio.battery <= 25 ? COLORS.err : radio.battery <= 50 ? COLORS.warn : COLORS.ok} height={4} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-w-0 space-y-4">
          <Panel
            header={
              <PanelHeader
                title="Link Quality"
                subtitle={`SNR and Packet Error Rate — last ${timeRange}`}
                right={<SegmentedControl options={TIME_RANGES} value={timeRange} onChange={setTimeRange} size="sm" />}
              />
            }
          >
            <LinkQualityChart snr={radio.snr} timeRange={timeRange} />
          </Panel>

          <Panel header={<PanelHeader title={`Mesh Neighbors (${neighbors.length})`} />} noPadding>
            <div className="overflow-x-auto max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2c3647 transparent' }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ backgroundColor: BG.elevated }}>
                    <th className="text-left px-4 py-2.5 font-medium uppercase tracking-wider" style={{ color: TEXT.tertiary }}>Status</th>
                    <th className="text-left px-4 py-2.5 font-medium uppercase tracking-wider" style={{ color: TEXT.tertiary }}>Neighbor</th>
                    <th className="text-left px-4 py-2.5 font-medium uppercase tracking-wider" style={{ color: TEXT.tertiary }}>SNR</th>
                    <th className="text-left px-4 py-2.5 font-medium uppercase tracking-wider" style={{ color: TEXT.tertiary }}>Rx Rate</th>
                    <th className="text-left px-4 py-2.5 font-medium uppercase tracking-wider" style={{ color: TEXT.tertiary }}>Tx Rate</th>
                    <th className="text-left px-4 py-2.5 font-medium uppercase tracking-wider" style={{ color: TEXT.tertiary }}>Retries</th>
                    <th className="text-left px-4 py-2.5 font-medium uppercase tracking-wider" style={{ color: TEXT.tertiary }}>Quality</th>
                  </tr>
                </thead>
                <tbody>
                  {neighbors.map(({ link, neighbor }) => (
                    <tr
                      key={link.id}
                      className="transition-colors cursor-pointer"
                      style={{ borderBottom: `1px solid ${BORDER.default}` }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = BG.elevated; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      onClick={() => selectRadio(neighbor!.id)}
                    >
                      <td className="px-4 py-2.5"><StatusDot status={neighbor!.state} size="sm" pulse={false} /></td>
                      <td className="px-4 py-2.5 font-medium" style={{ color: TEXT.primary }}>{neighbor!.callsign}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono tabular-nums" style={{ color: TEXT.secondary }}>{link.snr} dB</span>
                          <SignalBars snr={link.snr} size="sm" />
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono tabular-nums" style={{ color: TEXT.secondary }}>{link.rxAvg} Mbps</td>
                      <td className="px-4 py-2.5 font-mono tabular-nums" style={{ color: TEXT.secondary }}>{link.txAvg} Mbps</td>
                      <td className="px-4 py-2.5 font-mono tabular-nums" style={{ color: link.retries > 5 ? COLORS.warn : TEXT.secondary }}>{link.retries}</td>
                      <td className="px-4 py-2.5"><StatusChip status={link.quality} size="sm" /></td>
                    </tr>
                  ))}
                  {neighbors.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center" style={{ color: TEXT.tertiary }}>No mesh neighbors found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="w-full lg:w-[340px] flex-shrink-0 space-y-4">
          <Panel header={<PanelHeader title="Identity" />}>
            <div className="space-y-0.5">
              <MetricRow label="Callsign" value={radio.callsign} valueColor={TEXT.primary} />
              <MetricRow label="MAC Address" value={radio.mac} />
              <MetricRow label="IPv4 Address" value={radio.ip} />
              <MetricRow label="Form Factor" value={radio.formFactor} />
              <MetricRow label="Firmware" value={radio.firmware} />
              <MetricRow label="Agent" value={`v${radio.agentVersion}`} />
              <MetricRow label="Enrolled" value={new Date(radio.enrolled).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
              <MetricRow label="Cert Expires" value={radio.certExpiry} valueColor={new Date(radio.certExpiry) < new Date(Date.now() + 45 * 86400000) ? COLORS.warn : TEXT.secondary} />
            </div>
          </Panel>

          <Panel header={<PanelHeader title="Configuration" />}>
            <div className="space-y-0.5">
              <MetricRow label="Template" value={radio.configTemplate} />
              <MetricRow label="Channel" value="36 (5.18 GHz)" />
              <MetricRow label="Mesh ID" value="mesh-rider-alpha" />
              <MetricRow label="Sense Profile" value="default" />
              <MetricRow label="Last Applied" value="2h 14m ago" />
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs" style={{ color: TEXT.tertiary }}>Config State</span>
                <StatusChip status={radio.configState} label={radio.configState === 'in-sync' ? 'IN SYNC' : 'DRIFT'} size="sm" />
              </div>
            </div>
          </Panel>

          <LocationPanel lat={radio.lat} lng={radio.lng} siteName={radio.siteName} />
        </div>
      </div>
    </div>
  );
}

// ─── Telemetry Tab ──────────────────────────────────────────────────────────

const TELEMETRY_METRICS = [
  { key: 'snr', label: 'SNR', unit: 'dB', getVal: (r: Radio) => r.snr, thresholds: { ok: 20, warn: 10 }, variance: 3, noise: 2 },
  { key: 'throughput', label: 'Throughput', unit: 'Mbps', getVal: (r: Radio) => r.throughput, thresholds: { ok: 60, warn: 30 }, variance: 15, noise: 8 },
  { key: 'txPower', label: 'Tx Power', unit: 'dBm', getVal: (r: Radio) => r.txPower, thresholds: { ok: 15, warn: 10 }, variance: 1.5, noise: 0.8 },
  { key: 'rxSensitivity', label: 'Rx Sensitivity', unit: 'dBm', getVal: (r: Radio) => Math.round(-85 + detRand(r.id, 50) * 10), thresholds: { ok: -80, warn: -90 }, variance: 2, noise: 1, invertThresholds: true },
  { key: 'channelUtil', label: 'Channel Util', unit: '%', getVal: (r: Radio) => Math.round(25 + detRand(r.id, 60) * 50), thresholds: { ok: 60, warn: 80 }, variance: 8, noise: 4 },
  { key: 'meshHops', label: 'Mesh Hops', unit: '', getVal: (r: Radio) => Math.max(1, Math.min(6, Math.floor(1 + detRand(r.id, 70) * 5))), thresholds: { ok: 3, warn: 4 }, variance: 0.5, noise: 0.3 },
  { key: 'packetLoss', label: 'Packet Loss', unit: '%', getVal: (r: Radio) => Math.round(detRand(r.id, 80) * 5 * 10) / 10, thresholds: { ok: 1, warn: 3 }, variance: 0.5, noise: 0.3 },
  { key: 'latency', label: 'Latency', unit: 'ms', getVal: (r: Radio) => Math.round(2 + detRand(r.id, 90) * 18), thresholds: { ok: 8, warn: 15 }, variance: 3, noise: 2 },
];

function TelemetryTab({ radio }: { radio: Radio }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {TELEMETRY_METRICS.map((metric) => {
          const value = metric.getVal(radio);
          const sparkline = generateSparkline(value, metric.variance, metric.noise);
          const isCrit = metric.invertThresholds ? value < metric.thresholds.warn : value > metric.thresholds.warn;
          const isWarn = metric.invertThresholds ? value < metric.thresholds.ok : value > metric.thresholds.ok && value <= metric.thresholds.warn;
          const statusColor = isCrit ? COLORS.err : isWarn ? COLORS.warn : COLORS.ok;
          const trend = detRand(radio.id + TELEMETRY_METRICS.indexOf(metric), 100) > 0.5;

          return (
            <div
              key={metric.key}
              className="rounded-lg border p-4 transition-colors"
              style={{ backgroundColor: BG.card, borderColor: BORDER.default }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = statusColor + '40'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER.default; }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: TEXT.tertiary }}>{metric.label}</span>
                <span className="text-xs" style={{ color: trend ? COLORS.err : COLORS.ok }}>
                  {trend ? '↑' : '↓'}
                </span>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold tabular-nums leading-none" style={{ color: statusColor }}>
                  {metric.unit === '' ? Math.round(value) : value}
                </span>
                {metric.unit && <span className="text-[10px]" style={{ color: TEXT.tertiary }}>{metric.unit}</span>}
              </div>
              <Sparkline data={sparkline} color={statusColor} width={120} height={28} />
            </div>
          );
        })}
      </div>

      <Panel header={<PanelHeader title="24h Trend Summary" subtitle="Telemetry metrics over the last 24 hours" />}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4">
          {TELEMETRY_METRICS.slice(0, 4).map((metric) => {
            const value = metric.getVal(radio);
            const isCrit = metric.invertThresholds ? value < metric.thresholds.warn : value > metric.thresholds.warn;
            const isWarn = metric.invertThresholds ? value < metric.thresholds.ok : value > metric.thresholds.ok && value <= metric.thresholds.warn;
            const statusColor = isCrit ? COLORS.err : isWarn ? COLORS.warn : COLORS.ok;
            const trend = detRand(radio.id + TELEMETRY_METRICS.indexOf(metric), 200) > 0.5;
            const pctChange = Math.round((trend ? 1 : -1) * (2 + detRand(radio.id + TELEMETRY_METRICS.indexOf(metric), 300) * 8));

            return (
              <div key={metric.key} className="text-center">
                <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: TEXT.tertiary }}>{metric.label}</span>
                <span className="text-lg font-bold font-mono" style={{ color: statusColor }}>
                  {trend ? '+' : ''}{pctChange}%
                </span>
                <span className="text-[10px] block mt-0.5" style={{ color: trend ? COLORS.err : COLORS.ok }}>
                  vs 24h ago
                </span>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

// ─── Config Tab ─────────────────────────────────────────────────────────────

function ConfigTab({ radio }: { radio: Radio }) {
  const [pushing, setPushing] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handlePushConfig = () => {
    setPushing(true);
    setTimeout(() => setPushing(false), 2000);
  };

  const handleResetTemplate = () => {
    setResetting(true);
    setTimeout(() => setResetting(false), 2000);
  };

  const isDrift = radio.configState === 'drift';

  const configFields = [
    { label: 'Template Name', value: radio.configTemplate },
    { label: 'Channel', value: '36 (5.18 GHz)' },
    { label: 'Bandwidth', value: '40 MHz' },
    { label: 'TX Power', value: `${radio.txPower} dBm` },
    { label: 'Mesh ID', value: 'mesh-rider-alpha' },
    { label: 'Sense Profile', value: 'default' },
    { label: 'Encryption', value: 'AES-256-GCM' },
    { label: 'Route Metric', value: 'ETX (Expected Transmission Count)' },
  ];

  return (
    <div className="space-y-4">
      {/* Config state banner */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-lg border"
        style={{
          backgroundColor: isDrift ? '#ff547008' : '#3ddc9708',
          borderColor: isDrift ? '#ff547030' : '#3ddc9730',
        }}
      >
        <div className="rounded-full" style={{ width: 8, height: 8, backgroundColor: isDrift ? COLORS.err : COLORS.ok, boxShadow: `0 0 8px ${isDrift ? COLORS.err : COLORS.ok}80` }} />
        <div>
          <span className="text-xs font-semibold" style={{ color: isDrift ? COLORS.err : COLORS.ok }}>
            {isDrift ? 'Config Drift Detected' : 'Config In Sync'}
          </span>
          <span className="text-xs ml-2" style={{ color: TEXT.secondary }}>
            {isDrift
              ? 'Running config differs from template. Manual override may have been applied.'
              : 'Running configuration matches the assigned template.'}
          </span>
        </div>
      </div>

      {/* Configuration fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel header={<PanelHeader title="Current Configuration" subtitle={radio.configTemplate} />}>
          <div className="space-y-0.5">
            {configFields.map((field) => (
              <MetricRow key={field.label} label={field.label} value={field.value} />
            ))}
            <MetricRow
              label="Last Applied"
              value="2h 14m ago"
            />
          </div>
        </Panel>

        {/* Config diff section (if drift) */}
        {isDrift && (
          <Panel header={<PanelHeader title="Configuration Diff" subtitle="Template vs Running" />}>
            <div className="space-y-3">
              {[
                { field: 'channel_width', template: '40 MHz', running: '20 MHz' },
                { field: 'tx_power_limit', template: '23 dBm', running: '20 dBm' },
              ].map((diff) => (
                <div key={diff.field} className="rounded-md p-3" style={{ backgroundColor: BG.input }}>
                  <span className="text-[10px] font-mono block mb-1.5" style={{ color: COLORS.warn }}>{diff.field}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-mono px-2 py-0.5 rounded" style={{ backgroundColor: '#3ddc9715', color: '#3ddc97' }}>{diff.template}</span>
                    <span style={{ color: TEXT.muted }}>→</span>
                    <span className="font-mono px-2 py-0.5 rounded" style={{ backgroundColor: '#ff547015', color: '#ff5470' }}>{diff.running}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <ActionButton
          primary
          label={pushing ? 'Pushing...' : 'Push Config'}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22V8" /><path d="m5 12 7-7 7 7" />
            </svg>
          }
        />
        <ActionButton
          label={resetting ? 'Resetting...' : 'Reset to Template'}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
            </svg>
          }
        />
        {isDrift && (
          <span className="text-[10px] font-mono px-2 py-1 rounded" style={{ color: COLORS.warn, backgroundColor: '#f4a41710', border: '1px solid #f4a41720' }}>
            2 fields differ
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Events Tab ─────────────────────────────────────────────────────────────

const ACTION_TYPE_COLORS: Record<ActionType, string> = {
  ota: '#2dd4ff',
  config: '#f4a417',
  alert: '#ff5470',
  agent: '#3ddc97',
  access: '#aeb8c8',
  system: '#6f7d93',
};

function EventsTab({ radio }: { radio: Radio }) {
  const radioEvents = useMemo(() => {
    return auditEvents.filter((ev) => ev.object.includes(radio.callsign));
  }, [radio.callsign]);

  return (
    <div className="space-y-4">
      <Panel header={<PanelHeader title={`Events for ${radio.callsign}`} subtitle={`${radioEvents.length} events found`} />}>
        {radioEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <EmptyState
              title="No events found"
              description={`No audit events reference ${radio.callsign}.`}
            />
          </div>
        ) : (
          <div className="space-y-0">
            {radioEvents.map((ev) => {
              const chipColor = ACTION_TYPE_COLORS[ev.actionType] || '#6f7d93';
              return (
                <div
                  key={ev.id}
                  className="flex items-start gap-3 px-4 py-3 transition-colors"
                  style={{ borderBottom: `1px solid ${BORDER.default}` }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = BG.elevated; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {/* Timestamp */}
                  <div className="flex-shrink-0 w-16">
                    <span className="text-[10px] font-mono block" style={{ color: TEXT.tertiary }}>
                      {new Date(ev.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                  </div>

                  {/* Action type chip */}
                  <span
                    className="flex-shrink-0 px-2 py-0.5 rounded text-[9px] font-mono font-medium uppercase tracking-wider"
                    style={{ backgroundColor: chipColor + '15', color: chipColor, border: `1px solid ${chipColor}30` }}
                  >
                    {ev.actionType}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs" style={{ color: TEXT.secondary }}>{ev.action}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono" style={{ color: TEXT.muted }}>{ev.operator}</span>
                      <span style={{ color: TEXT.muted }}>·</span>
                      <span className="text-[10px] font-mono" style={{ color: TEXT.muted }}>{ev.sourceIp}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

// ─── Security Tab ───────────────────────────────────────────────────────────

function SecurityTab({ radio }: { radio: Radio }) {
  // Derive security data from radio
  const certExpiryDate = new Date(radio.certExpiry);
  const now = new Date();
  const daysUntilExpiry = Math.floor((certExpiryDate.getTime() - now.getTime()) / (86400000));
  const certStatus = daysUntilExpiry < 0 ? 'expired' : daysUntilExpiry < 30 ? 'expiring' : 'valid';
  const certStatusColor = certStatus === 'valid' ? COLORS.ok : certStatus === 'expiring' ? COLORS.warn : COLORS.err;
  const certStatusLabel = certStatus === 'valid' ? 'VALID' : certStatus === 'expiring' ? 'EXPIRING' : 'EXPIRED';

  // Security score based on cert status, firmware, etc.
  const score = certStatus === 'valid' ? 92 : certStatus === 'expiring' ? 78 : 55;
  const scoreColor = score >= 85 ? COLORS.ok : score >= 70 ? COLORS.warn : COLORS.err;

  // SVG circular gauge
  const gaugeRadius = 54;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference - (score / 100) * gaugeCircumference;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Security Score Gauge */}
        <Panel header={<PanelHeader title="Security Score" />}>
          <div className="flex flex-col items-center py-4">
            <div className="relative" style={{ width: 140, height: 140 }}>
              <svg viewBox="0 0 120 120" className="w-full h-full">
                {/* Background circle */}
                <circle cx="60" cy="60" r={gaugeRadius} fill="none" stroke="#1c2430" strokeWidth="8" />
                {/* Progress circle */}
                <circle
                  cx="60" cy="60" r={gaugeRadius}
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={gaugeCircumference}
                  strokeDashoffset={gaugeOffset}
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold tabular-nums" style={{ color: scoreColor }}>{score}</span>
                <span className="text-[10px] uppercase tracking-wider" style={{ color: TEXT.tertiary }}>of 100</span>
              </div>
            </div>
            <span
              className="mt-3 px-3 py-1 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider"
              style={{ backgroundColor: scoreColor + '15', color: scoreColor, border: `1px solid ${scoreColor}30` }}
            >
              {score >= 85 ? 'Secure' : score >= 70 ? 'Attention Needed' : 'At Risk'}
            </span>
          </div>
        </Panel>

        {/* Certificate Info */}
        <Panel header={<PanelHeader title="Certificate" />}>
          <div className="space-y-0.5">
            <MetricRow label="Issuer" value="Doodle Labs Mesh CA" />
            <MetricRow label="Serial" value={`0xA${radio.id}B${radio.id + 1}C${radio.id + 2}`} />
            <MetricRow label="Expiry Date" value={radio.certExpiry} valueColor={certStatusColor} />
            <MetricRow label="Status" value={certStatusLabel} valueColor={certStatusColor} />
            <MetricRow label="SHA-256 Fingerprint" value={`A4:B2:${radio.mac.slice(0, 8)}:${radio.mac.slice(-8)}`} />
          </div>
        </Panel>

        {/* Access & Auth */}
        <Panel header={<PanelHeader title="Access & Authentication" />}>
          <div className="space-y-0.5">
            <MetricRow label="TLS Version" value="TLS 1.3" valueColor={COLORS.ok} />
            <MetricRow label="SSH Access" value="Enabled" valueColor={COLORS.ok} />
            <MetricRow label="SSH Port" value="22" />
            <MetricRow label="SSH Key Auth" value="Enforced" valueColor={COLORS.ok} />
            <MetricRow label="Password Auth" value="Disabled" valueColor={COLORS.ok} />
            <MetricRow label="Last Login" value="Jabbir · 2h 14m ago" />
            <MetricRow label="Failed Attempts" value="0 (24h)" valueColor={COLORS.ok} />
          </div>
        </Panel>
      </div>

      {/* Security findings */}
      <Panel header={<PanelHeader title="Security Findings" />}>
        <div className="space-y-2">
          {[
            { text: 'Firmware is up-to-date', status: 'ok' as const },
            { text: 'TLS 1.3 enforced on all connections', status: 'ok' as const },
            { text: 'SSH password authentication disabled', status: 'ok' as const },
            { text: certStatus === 'expiring' ? `Certificate expires in ${daysUntilExpiry} days` : 'Certificate valid for ' + daysUntilExpiry + ' days', status: certStatus === 'expiring' ? 'warn' as const : 'ok' as const },
            { text: 'No unauthorized access attempts detected', status: 'ok' as const },
          ].map((finding, idx) => (
            <div key={idx} className="flex items-center gap-2.5 py-1.5">
              <div className="rounded-full flex-shrink-0" style={{
                width: 6,
                height: 6,
                backgroundColor: finding.status === 'ok' ? COLORS.ok : finding.status === 'warn' ? COLORS.warn : COLORS.err,
              }} />
              <span className="text-xs" style={{ color: finding.status === 'warn' ? COLORS.warn : TEXT.secondary }}>{finding.text}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
