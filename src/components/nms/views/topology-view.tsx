// =============================================================================
// Mesh Rider Fleet NMS — Network Topology View
// Task ID: 3-a | SVG-based mesh network visualization with side panel
// =============================================================================

'use client';

import React, { useState, useMemo } from 'react';
import { radios, links, type Radio, type Link } from '@/lib/nms-data/mock-data';
import { useNMSStore } from '@/lib/nms-data/store';
import {
  StatusDot,
  Sparkline,
  MetricRow,
  COLORS,
  BG,
  TEXT,
  BORDER,
  STATUS_COLORS,
} from '@/components/nms/nms-utils';

// ─── Types ──────────────────────────────────────────────────────────────────

interface NodePosition {
  id: number;
  x: number;
  y: number;
  radio: Radio;
}

type ViewMode = 'graph' | 'map';

// ─── Site cluster positions (manual layout in SVG viewport) ─────────────────

const CANVAS_W = 800;
const CANVAS_H = 560;

const SITE_CENTERS: Record<string, { cx: number; cy: number }> = {
  Alpha:  { cx: 140, cy: 120 },
  Bravo:  { cx: 580, cy: 100 },
  Charlie:{ cx: 360, cy: 280 },
  Delta:  { cx: 160, cy: 430 },
  Echo:   { cx: 580, cy: 430 },
};

function seededSparkline(seed: number, variance: number, base: number): number[] {
  const data: number[] = [];
  let v = base;
  for (let i = 0; i < 20; i++) {
    v = base + Math.sin(seed + i * 0.5) * variance + Math.cos(seed * 1.5 + i * 0.8) * (variance * 0.4);
    data.push(Math.round(Math.max(0, v)));
  }
  return data;
}

// ─── Topology View Component ────────────────────────────────────────────────

export default function TopologyView() {
  const { selectRadio, selectedRadioId } = useNMSStore();
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const activeId = hoveredId ?? selectedRadioId;

  // ── Compute node positions by clustering within site ──
  const nodePositions = useMemo((): NodePosition[] => {
    const positions: NodePosition[] = [];
    const siteGroups: Record<string, Radio[]> = {};

    for (const r of radios) {
      const key = r.siteName;
      if (!siteGroups[key]) siteGroups[key] = [];
      siteGroups[key].push(r);
    }

    for (const [siteName, siteRadios] of Object.entries(siteGroups)) {
      const center = SITE_CENTERS[siteName] ?? { cx: CANVAS_W / 2, cy: CANVAS_H / 2 };
      const count = siteRadios.length;
      const radius = Math.min(60, 25 + count * 8);

      siteRadios.forEach((radio, idx) => {
        const angle = (2 * Math.PI * idx) / count - Math.PI / 2;
        const jitter = (idx % 2 === 0 ? 6 : -6);
        positions.push({
          id: radio.id,
          x: center.cx + Math.cos(angle) * radius + jitter,
          y: center.cy + Math.sin(angle) * radius + jitter,
          radio,
        });
      });
    }

    return positions;
  }, []);

  const nodeMap = useMemo(() => {
    const m = new Map<number, NodePosition>();
    for (const n of nodePositions) m.set(n.id, n);
    return m;
  }, [nodePositions]);

  // ── Selected/hovered radio ──
  const activeRadio = useMemo(
    () => (activeId ? radios.find((r) => r.id === activeId) ?? null : null),
    [activeId]
  );

  // ── Links for selected radio's neighbors ──
  const activeLinks = useMemo(
    () =>
      activeId
        ? links.filter((l) => l.radioA === activeId || l.radioB === activeId)
        : [],
    [activeId]
  );

  const activeNeighbors = useMemo(() => {
    if (!activeId) return 0;
    return links.filter((l) => l.radioA === activeId || l.radioB === activeId).length;
  }, [activeId]);

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: BG.panel }}>
      {/* ── Header ── */}
      <div className="px-4 lg:px-6 py-4 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 border-b" style={{ borderColor: BORDER.default }}>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: TEXT.primary }}>
            Network <span style={{ color: COLORS.amber }}>Topology</span>
          </h1>
          <p className="text-xs mt-1 font-mono" style={{ color: TEXT.tertiary }}>
            Live mesh network · {radios.length} nodes · {links.length} links
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* View mode toggle */}
          <div className="inline-flex rounded-lg border p-0.5" style={{ backgroundColor: BG.input, borderColor: BORDER.default }}>
            {(['graph', 'map'] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize"
                style={{
                  backgroundColor: viewMode === m ? COLORS.amber + '20' : 'transparent',
                  color: viewMode === m ? COLORS.amber : TEXT.secondary,
                  border: 'none',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {m === 'graph' ? 'Graph View' : 'Map View'}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider" style={{ color: TEXT.tertiary }}>
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-0.5 rounded" style={{ backgroundColor: COLORS.ok }} />
              OK
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-0.5 rounded" style={{ backgroundColor: COLORS.warn }} />
              Warn
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-0.5 rounded" style={{ backgroundColor: COLORS.err }} />
              Error
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Content: SVG + Side Panel ── */}
      <div className="flex-1 flex min-h-0">
        {/* SVG Canvas */}
        <div className="flex-1 p-3 lg:p-4 overflow-hidden">
          <svg
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            className="w-full h-full rounded-lg"
            style={{ backgroundColor: BG.card, border: `1px solid ${BORDER.default}` }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid background */}
            <defs>
              <pattern id="topoGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke={BORDER.default} strokeWidth="0.5" opacity="0.4" />
              </pattern>
              {/* Glow filter for nodes */}
              <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="nodeGlowStrong" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect width={CANVAS_W} height={CANVAS_H} fill="url(#topoGrid)" />

            {/* Site labels */}
            {Object.entries(SITE_CENTERS).map(([name, { cx, cy }]) => (
              <g key={name}>
                <rect
                  x={cx - 30}
                  y={cy - 62}
                  width={60}
                  height={18}
                  rx={4}
                  fill={BG.elevated}
                  stroke={BORDER.default}
                  strokeWidth="0.5"
                />
                <text
                  x={cx}
                  y={cy - 49}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="600"
                  fill={COLORS.amber}
                  letterSpacing="0.05em"
                >
                  {name}
                </text>
              </g>
            ))}

            {/* Links */}
            {links.map((link) => {
              const nA = nodeMap.get(link.radioA);
              const nB = nodeMap.get(link.radioB);
              if (!nA || !nB) return null;

              const linkColor = link.quality === 'ok' ? COLORS.ok : link.quality === 'warn' ? COLORS.warn : COLORS.err;
              const strokeWidth = link.snr > 25 ? 2.5 : link.snr > 15 ? 1.5 : 1;
              const isHighlighted = activeId && (link.radioA === activeId || link.radioB === activeId);
              const isDimmed = activeId && !isHighlighted;

              return (
                <line
                  key={link.id}
                  x1={nA.x}
                  y1={nA.y}
                  x2={nB.x}
                  y2={nB.y}
                  stroke={linkColor}
                  strokeWidth={isHighlighted ? strokeWidth + 1.5 : strokeWidth}
                  opacity={isDimmed ? 0.12 : isHighlighted ? 1 : 0.35}
                  strokeLinecap="round"
                  className="transition-opacity duration-200"
                />
              );
            })}

            {/* Nodes */}
            {nodePositions.map((node) => {
              const { radio, x, y } = node;
              const color = STATUS_COLORS[radio.state] ?? '#4a5567';
              const isActive = activeId === radio.id;
              const isDimmed = activeId && !isActive;
              const isOffline = radio.state === 'offline' || radio.state === 'error';

              return (
                <g
                  key={radio.id}
                  className="cursor-pointer transition-all duration-150"
                  style={{ opacity: isDimmed ? 0.25 : 1 }}
                  onClick={() => selectRadio(radio.id)}
                  onMouseEnter={() => setHoveredId(radio.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Glow circle */}
                  {isActive && (
                    <circle
                      cx={x}
                      cy={y}
                      r={18}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      opacity={0.3}
                      filter="url(#nodeGlowStrong)"
                    />
                  )}

                  {/* Main node circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isActive ? 12 : 9}
                    fill={isOffline ? BG.elevated : color + '30'}
                    stroke={color}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    filter={isActive ? 'url(#nodeGlow)' : undefined}
                  />

                  {/* Inner dot */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isOffline ? 2.5 : 4}
                    fill={color}
                  />

                  {/* Callsign label */}
                  <text
                    x={x}
                    y={y + 22}
                    textAnchor="middle"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="500"
                    fill={isActive ? TEXT.primary : TEXT.secondary}
                  >
                    {radio.callsign}
                  </text>

                  {/* SNR label (only when active) */}
                  {isActive && radio.snr > 0 && (
                    <text
                      x={x}
                      y={y + 32}
                      textAnchor="middle"
                      fontSize="8"
                      fontFamily="monospace"
                      fill={TEXT.tertiary}
                    >
                      {radio.snr} dB
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* ── Side Panel ── */}
        <div
          className="w-[300px] shrink-0 border-l overflow-y-auto hidden lg:block"
          style={{
            backgroundColor: BG.card,
            borderColor: BORDER.default,
          }}
        >
          {activeRadio ? (
            <div className="p-4 space-y-4">
              {/* Radio header */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <StatusDot status={activeRadio.state} size="lg" pulse />
                  <span className="text-lg font-bold font-mono" style={{ color: TEXT.primary }}>
                    {activeRadio.callsign}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider"
                    style={{ backgroundColor: COLORS.amber + '15', color: COLORS.amber }}
                  >
                    {activeRadio.siteName}
                  </span>
                  <span className="text-[11px]" style={{ color: TEXT.tertiary }}>
                    {activeRadio.formFactor} · {activeRadio.band}
                  </span>
                </div>
              </div>

              {/* Separator */}
              <div style={{ borderTop: `1px solid ${BORDER.default}` }} />

              {/* Status chip */}
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: TEXT.tertiary }}>Status</span>
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase"
                  style={{
                    backgroundColor: (STATUS_COLORS[activeRadio.state] ?? '#4a5567') + '18',
                    color: STATUS_COLORS[activeRadio.state] ?? '#4a5567',
                    border: `1px solid ${(STATUS_COLORS[activeRadio.state] ?? '#4a5567')}33`,
                  }}
                >
                  <StatusDot status={activeRadio.state} size="sm" pulse={false} />
                  {activeRadio.state}
                </span>
              </div>

              {/* Metrics */}
              <div className="space-y-0.5">
                <MetricRow label="SNR" value={`${activeRadio.snr > 0 ? activeRadio.snr : '—'} dB`} valueColor={activeRadio.snr > 20 ? COLORS.ok : activeRadio.snr > 10 ? COLORS.warn : COLORS.err} />
                <MetricRow label="Throughput" value={`${activeRadio.throughput > 0 ? activeRadio.throughput : '—'} Mbps`} valueColor={COLORS.amber} />
                <MetricRow label="Neighbors" value={activeNeighbors} valueColor={COLORS.cyan} />
                <MetricRow label="TX Power" value={`${activeRadio.txPower > 0 ? activeRadio.txPower : '—'} dBm`} />
                <MetricRow label="CPU" value={`${activeRadio.cpu}%`} valueColor={activeRadio.cpu > 70 ? COLORS.err : activeRadio.cpu > 50 ? COLORS.warn : COLORS.ok} />
                <MetricRow label="Temperature" value={`${activeRadio.temp}°C`} valueColor={activeRadio.temp > 65 ? COLORS.err : activeRadio.temp > 50 ? COLORS.warn : TEXT.secondary} />
                <MetricRow label="Battery" value={`${activeRadio.battery}%`} valueColor={activeRadio.battery < 30 ? COLORS.err : COLORS.ok} />
                <MetricRow label="Uptime" value={activeRadio.uptime} />
                <MetricRow label="Firmware" value={activeRadio.firmware} />
                <MetricRow label="Config" value={activeRadio.configState} valueColor={STATUS_COLORS[activeRadio.configState]} />
              </div>

              {/* Separator */}
              <div style={{ borderTop: `1px solid ${BORDER.default}` }} />

              {/* Links table */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: TEXT.tertiary }}>
                  Active Links ({activeLinks.length})
                </h4>
                {activeLinks.length > 0 ? (
                  <div className="space-y-1.5">
                    {activeLinks.map((link) => {
                      const peerId = link.radioA === activeRadio.id ? link.radioB : link.radioA;
                      const peer = radios.find((r) => r.id === peerId);
                      const linkColor = link.quality === 'ok' ? COLORS.ok : link.quality === 'warn' ? COLORS.warn : COLORS.err;

                      return (
                        <div
                          key={link.id}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded"
                          style={{ backgroundColor: BG.elevated }}
                        >
                          <span className="text-[11px] font-mono font-medium" style={{ color: TEXT.primary }}>
                            {peer?.callsign ?? `#${peerId}`}
                          </span>
                          <span className="text-[11px] font-mono" style={{ color: linkColor }}>
                            {link.snr} dB
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px]" style={{ color: TEXT.muted }}>
                    No active links
                  </p>
                )}
              </div>

              {/* Separator */}
              <div style={{ borderTop: `1px solid ${BORDER.default}` }} />

              {/* SNR trend sparkline */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: TEXT.tertiary }}>
                  SNR Trend (24h)
                </h4>
                <Sparkline
                  data={seededSparkline(activeRadio.id, 4, activeRadio.snr)}
                  width={260}
                  height={40}
                  color={activeRadio.snr > 20 ? COLORS.ok : COLORS.warn}
                  fillColor={activeRadio.snr > 20 ? COLORS.ok : COLORS.warn}
                  strokeWidth={1.5}
                />
              </div>

              {/* Throughput trend sparkline */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: TEXT.tertiary }}>
                  Throughput Trend (24h)
                </h4>
                <Sparkline
                  data={seededSparkline(activeRadio.id + 100, 20, activeRadio.throughput)}
                  width={260}
                  height={40}
                  color={COLORS.amber}
                  fillColor={COLORS.amber}
                  strokeWidth={1.5}
                />
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={TEXT.muted} strokeWidth="1.5" strokeLinecap="round" className="mb-3">
                <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
              </svg>
              <p className="text-sm font-medium" style={{ color: TEXT.secondary }}>
                Select a Node
              </p>
              <p className="text-xs mt-1" style={{ color: TEXT.tertiary }}>
                Click any node on the topology to view radio details, links, and performance trends.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
