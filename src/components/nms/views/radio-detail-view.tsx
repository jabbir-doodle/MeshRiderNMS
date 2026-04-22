'use client';

import React, { useState, useMemo } from 'react';
import { useNMSStore } from '@/lib/nms-data/store';
import { radios, links } from '@/lib/nms-data/mock-data';
import type { Link } from '@/lib/nms-data/mock-data';
import {
  COLORS, BG, TEXT, BORDER,
  StatusDot, StatusChip, SignalBars, Sparkline, ProgressBar,
  KPICard, PanelHeader, SegmentedControl, Panel, MetricRow, MutedBadge, EmptyState,
} from '../nms-utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateSparkline(baseValue: number, variance: number, noise: number, count = 20): number[] {
  return Array.from({ length: count }, (_, i) =>
    Math.round((baseValue + Math.sin(i * 0.5) * variance + Math.random() * noise) * 10) / 10
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
    Math.max(0, snr + Math.sin(i * 0.4) * 5 + (Math.random() - 0.5) * 6)
  );
  const perData = Array.from({ length: pointCount }, (_, i) =>
    Math.max(0, Math.min(100, 3 + Math.sin(i * 0.3 + 2) * 4 + Math.random() * 5))
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
        <div className="space-y-4">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* SNR */}
            <KPICard
              label="SNR"
              value={radio.snr}
              unit="dB"
              icon={<SignalBars snr={radio.snr} size="sm" />}
              sparkline={snrSparkline}
              sparklineColor={COLORS.ok}
            />
            {/* Throughput */}
            <KPICard
              label="Throughput"
              value={radio.throughput}
              unit="Mbps"
              sparkline={throughputSparkline}
              sparklineColor={COLORS.cyan}
            />
            {/* Tx Power */}
            <KPICard
              label="Tx Power"
              value={radio.txPower}
              unit="dBm"
              sparkline={txPowerSparkline}
              sparklineColor={COLORS.amber}
            />
            {/* CPU + Temperature */}
            <div
              className="rounded-lg border p-4"
              style={{ backgroundColor: BG.card, borderColor: BORDER.default }}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider block mb-2" style={{ color: TEXT.tertiary }}>
                CPU / Temp
              </span>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold tabular-nums leading-none" style={{ color: TEXT.primary }}>
                  {radio.cpu}
                </span>
                <span className="text-xs" style={{ color: TEXT.tertiary }}>%</span>
                <span className="text-xs" style={{ color: TEXT.muted }}>·</span>
                <span className="text-sm font-semibold tabular-nums" style={{ color: radio.temp > 60 ? COLORS.warn : TEXT.primary }}>
                  {radio.temp}°C
                </span>
              </div>
              <ProgressBar
                value={radio.temp}
                max={80}
                color={radio.temp > 65 ? COLORS.err : radio.temp > 55 ? COLORS.warn : COLORS.ok}
                height={4}
              />
            </div>
            {/* Battery */}
            <div
              className="rounded-lg border p-4"
              style={{ backgroundColor: BG.card, borderColor: BORDER.default }}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider block mb-2" style={{ color: TEXT.tertiary }}>
                Battery
              </span>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold tabular-nums leading-none" style={{
                  color: radio.battery <= 25 ? COLORS.err : radio.battery <= 50 ? COLORS.warn : TEXT.primary
                }}>
                  {radio.battery}
                </span>
                <span className="text-xs" style={{ color: TEXT.tertiary }}>%</span>
              </div>
              <ProgressBar
                value={radio.battery}
                color={radio.battery <= 25 ? COLORS.err : radio.battery <= 50 ? COLORS.warn : COLORS.ok}
                height={4}
              />
            </div>
          </div>

          {/* Main Content — Two Column */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left Column */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Link Quality Chart */}
              <Panel
                header={
                  <PanelHeader
                    title="Link Quality"
                    subtitle={`SNR and Packet Error Rate — last ${timeRange}`}
                    right={
                      <SegmentedControl
                        options={TIME_RANGES}
                        value={timeRange}
                        onChange={setTimeRange}
                        size="sm"
                      />
                    }
                  />
                }
              >
                <LinkQualityChart snr={radio.snr} timeRange={timeRange} />
              </Panel>

              {/* Neighbors Table */}
              <Panel
                header={<PanelHeader title={`Mesh Neighbors (${neighbors.length})`} />}
                noPadding
              >
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
                          <td className="px-4 py-2.5">
                            <StatusDot status={neighbor!.state} size="sm" pulse={false} />
                          </td>
                          <td className="px-4 py-2.5 font-medium" style={{ color: TEXT.primary }}>
                            {neighbor!.callsign}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono tabular-nums" style={{ color: TEXT.secondary }}>{link.snr} dB</span>
                              <SignalBars snr={link.snr} size="sm" />
                            </div>
                          </td>
                          <td className="px-4 py-2.5 font-mono tabular-nums" style={{ color: TEXT.secondary }}>
                            {link.rxAvg} Mbps
                          </td>
                          <td className="px-4 py-2.5 font-mono tabular-nums" style={{ color: TEXT.secondary }}>
                            {link.txAvg} Mbps
                          </td>
                          <td className="px-4 py-2.5 font-mono tabular-nums" style={{
                            color: link.retries > 5 ? COLORS.warn : TEXT.secondary
                          }}>
                            {link.retries}
                          </td>
                          <td className="px-4 py-2.5">
                            <StatusChip status={link.quality} size="sm" />
                          </td>
                        </tr>
                      ))}
                      {neighbors.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center" style={{ color: TEXT.tertiary }}>
                            No mesh neighbors found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>

            {/* Right Column — 340px */}
            <div className="w-full lg:w-[340px] flex-shrink-0 space-y-4">
              {/* Identity Panel */}
              <Panel header={<PanelHeader title="Identity" />}>
                <div className="space-y-0.5">
                  <MetricRow label="Callsign" value={radio.callsign} valueColor={TEXT.primary} />
                  <MetricRow label="MAC Address" value={radio.mac} />
                  <MetricRow label="IPv4 Address" value={radio.ip} />
                  <MetricRow label="Form Factor" value={radio.formFactor} />
                  <MetricRow label="Firmware" value={radio.firmware} />
                  <MetricRow label="Agent" value={`v${radio.agentVersion}`} />
                  <MetricRow label="Enrolled" value={new Date(radio.enrolled).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
                  <MetricRow
                    label="Cert Expires"
                    value={radio.certExpiry}
                    valueColor={new Date(radio.certExpiry) < new Date(Date.now() + 45 * 86400000) ? COLORS.warn : TEXT.secondary}
                  />
                </div>
              </Panel>

              {/* Config Panel */}
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

              {/* Location Panel */}
              <LocationPanel lat={radio.lat} lng={radio.lng} siteName={radio.siteName} />
            </div>
          </div>
        </div>
      )}

      {/* ─── Placeholder for other tabs ──────────────────────────────────── */}
      {activeTab !== 'overview' && (
        <div className="flex items-center justify-center py-20">
          <EmptyState
            title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} tab`}
            description="Detailed telemetry, configuration, event, and security views coming soon."
          />
        </div>
      )}
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
