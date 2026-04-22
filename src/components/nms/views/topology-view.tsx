// =============================================================================
// Mesh Rider Fleet NMS — Network Topology View
// Task ID: 3-a | SVG-based mesh network visualization with side panel
// Enhanced: Site legend, zoom controls, minimap, tooltips, link quality
// =============================================================================

'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
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

const SITE_COLORS: Record<string, string> = {
  Alpha: '#f4a417',
  Bravo: '#2dd4ff',
  Charlie: '#3ddc97',
  Delta: '#ff6b6b',
  Echo: '#a78bfa',
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

// ─── Site Legend (top-right overlay) ────────────────────────────────────────

function SiteLegend() {
  const sites = [
    { name: 'Alpha', color: SITE_COLORS.Alpha },
    { name: 'Bravo', color: SITE_COLORS.Bravo },
    { name: 'Charlie', color: SITE_COLORS.Charlie },
    { name: 'Delta', color: SITE_COLORS.Delta },
    { name: 'Echo', color: SITE_COLORS.Echo },
  ];

  return (
    <div
      className="absolute top-3 right-3 z-20 rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'rgba(11, 15, 22, 0.9)',
        border: `1px solid ${BORDER.default}`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider font-mono"
        style={{
          color: TEXT.tertiary,
          borderBottom: `1px solid ${BORDER.default}`,
          backgroundColor: BG.elevated,
        }}
      >
        Sites
      </div>
      <div className="p-2 space-y-1">
        {sites.map((site) => (
          <div key={site.name} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: site.color }}
            />
            <span className="text-[11px] font-mono" style={{ color: TEXT.secondary }}>
              {site.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Zoom Controls ──────────────────────────────────────────────────────────

function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}) {
  return (
    <div
      className="absolute bottom-3 left-3 z-20 flex flex-col gap-1 rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'rgba(11, 15, 22, 0.9)',
        border: `1px solid ${BORDER.default}`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <button
        onClick={onZoomIn}
        className="flex items-center justify-center w-8 h-8 text-sm font-mono font-bold transition-colors"
        style={{ color: TEXT.secondary, backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.amber; e.currentTarget.style.backgroundColor = BG.elevated; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = TEXT.secondary; e.currentTarget.style.backgroundColor = 'transparent'; }}
        title="Zoom In"
      >
        +
      </button>
      <div style={{ borderTop: `1px solid ${BORDER.default}` }} />
      <button
        onClick={onZoomOut}
        className="flex items-center justify-center w-8 h-8 text-sm font-mono font-bold transition-colors"
        style={{ color: TEXT.secondary, backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.amber; e.currentTarget.style.backgroundColor = BG.elevated; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = TEXT.secondary; e.currentTarget.style.backgroundColor = 'transparent'; }}
        title="Zoom Out"
      >
        −
      </button>
      <div style={{ borderTop: `1px solid ${BORDER.default}` }} />
      <button
        onClick={onFit}
        className="flex items-center justify-center w-8 h-8 text-[10px] font-mono font-semibold transition-colors px-1"
        style={{ color: TEXT.secondary, backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.amber; e.currentTarget.style.backgroundColor = BG.elevated; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = TEXT.secondary; e.currentTarget.style.backgroundColor = 'transparent'; }}
        title="Fit View"
      >
        Fit
      </button>
    </div>
  );
}

// ─── Node Tooltip ───────────────────────────────────────────────────────────

function NodeTooltip({
  node,
  x,
  y,
}: {
  node: NodePosition;
  x: number;
  y: number;
}) {
  const { radio } = node;
  const color = STATUS_COLORS[radio.state] ?? '#4a5567';

  return (
    <div
      className="absolute z-30 pointer-events-none rounded-lg overflow-hidden"
      style={{
        left: x + 16,
        top: y - 8,
        backgroundColor: 'rgba(11, 15, 22, 0.95)',
        border: `1px solid ${BORDER.default}`,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        minWidth: 180,
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${BORDER.default}` }}>
        <StatusDot status={radio.state} size="sm" pulse={false} />
        <span className="text-xs font-bold font-mono" style={{ color: TEXT.primary }}>
          {radio.callsign}
        </span>
        <span
          className="ml-auto text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: (SITE_COLORS[radio.siteName] ?? COLORS.amber) + '20',
            color: SITE_COLORS[radio.siteName] ?? COLORS.amber,
          }}
        >
          {radio.siteName}
        </span>
      </div>
      {/* Metrics */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex justify-between">
          <span className="text-[10px] font-mono" style={{ color: TEXT.tertiary }}>Status</span>
          <span className="text-[10px] font-mono font-semibold" style={{ color }}>{radio.state}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] font-mono" style={{ color: TEXT.tertiary }}>SNR</span>
          <span className="text-[10px] font-mono font-semibold" style={{ color: radio.snr > 20 ? COLORS.ok : radio.snr > 10 ? COLORS.warn : COLORS.err }}>
            {radio.snr > 0 ? `${radio.snr} dB` : '—'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] font-mono" style={{ color: TEXT.tertiary }}>Throughput</span>
          <span className="text-[10px] font-mono font-semibold" style={{ color: COLORS.amber }}>
            {radio.throughput > 0 ? `${radio.throughput} Mbps` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Minimap ────────────────────────────────────────────────────────────────

function Minimap({
  nodePositions,
  activeId,
  viewBoxStr,
  canvasW,
  canvasH,
}: {
  nodePositions: NodePosition[];
  activeId: number | null;
  viewBoxStr: string;
  canvasW: number;
  canvasH: number;
}) {
  const minimapW = 140;
  const minimapH = 98;
  const nodeMap = useMemo(() => {
    const m = new Map<number, NodePosition>();
    for (const n of nodePositions) m.set(n.id, n);
    return m;
  }, [nodePositions]);

  // Parse viewBox to show viewport rectangle
  const parts = viewBoxStr.split(/\s+/).map(Number);
  const vpX = parts[0] || 0;
  const vpY = parts[1] || 0;
  const vpW = parts[2] || canvasW;
  const vpH = parts[3] || canvasH;

  const rectX = (vpX / canvasW) * minimapW;
  const rectY = (vpY / canvasH) * minimapH;
  const rectW = (vpW / canvasW) * minimapW;
  const rectH = (vpH / canvasH) * minimapH;

  return (
    <div
      className="absolute bottom-3 right-3 z-20 rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'rgba(11, 15, 22, 0.9)',
        border: `1px solid ${BORDER.default}`,
        backdropFilter: 'blur(8px)',
        width: minimapW,
        height: minimapH,
      }}
    >
      <svg
        viewBox={`0 0 ${canvasW} ${canvasH}`}
        width={minimapW}
        height={minimapH}
        style={{ display: 'block' }}
      >
        {/* Minimap links */}
        {links.map((link) => {
          const nA = nodeMap.get(link.radioA);
          const nB = nodeMap.get(link.radioB);
          if (!nA || !nB) return null;
          return (
            <line
              key={link.id}
              x1={nA.x}
              y1={nA.y}
              x2={nB.x}
              y2={nB.y}
              stroke={BORDER.default}
              strokeWidth="0.5"
              opacity="0.5"
            />
          );
        })}
        {/* Minimap nodes */}
        {nodePositions.map((node) => {
          const isActive = activeId === node.id;
          return (
            <circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r={isActive ? 4 : 2.5}
              fill={SITE_COLORS[node.radio.siteName] ?? '#4a5567'}
              opacity={activeId && !isActive ? 0.3 : 1}
            />
          );
        })}
        {/* Viewport rectangle */}
        <rect
          x={rectX}
          y={rectY}
          width={rectW}
          height={rectH}
          fill="none"
          stroke={COLORS.amber}
          strokeWidth="2"
          opacity="0.7"
          rx="1"
        />
      </svg>
    </div>
  );
}

// ─── Topology View Component ────────────────────────────────────────────────

const ZOOM_STEPS = [0.5, 0.65, 0.8, 1.0, 1.25, 1.5, 2.0];

export default function TopologyView() {
  const { selectRadio, selectedRadioId } = useNMSStore();
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [zoomIdx, setZoomIdx] = useState(3); // default 1.0
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const activeId = hoveredId ?? selectedRadioId;
  const zoom = ZOOM_STEPS[zoomIdx] ?? 1.0;

  // Compute viewBox from zoom
  const vbW = CANVAS_W / zoom;
  const vbH = CANVAS_H / zoom;
  const vbX = (CANVAS_W - vbW) / 2;
  const vbY = (CANVAS_H - vbH) / 2;
  const viewBoxStr = `${vbX} ${vbY} ${vbW} ${vbH}`;

  const handleZoomIn = useCallback(() => {
    setZoomIdx((z) => Math.min(ZOOM_STEPS.length - 1, z + 1));
  }, []);
  const handleZoomOut = useCallback(() => {
    setZoomIdx((z) => Math.max(0, z - 1));
  }, []);
  const handleFit = useCallback(() => {
    setZoomIdx(3);
  }, []);

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

  const hoveredNode = useMemo(
    () => (hoveredId ? nodeMap.get(hoveredId) ?? null : null),
    [hoveredId, nodeMap]
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

  const handleNodeHover = useCallback((node: NodePosition, e: React.MouseEvent) => {
    setHoveredId(node.id);
    const rect = svgContainerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  const handleNodeLeave = useCallback(() => {
    setHoveredId(null);
    setTooltipPos(null);
  }, []);

  return (
    <div className="h-full flex flex-col fade-in" style={{ backgroundColor: BG.panel }}>
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
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize active:scale-[0.97]"
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

          {/* Link quality legend */}
          <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider" style={{ color: TEXT.tertiary }}>
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-[3px] rounded" style={{ backgroundColor: COLORS.ok }} />
              OK
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-[1.5px] rounded" style={{ backgroundColor: COLORS.warn }} />
              Warn
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-[1px] rounded" style={{ backgroundColor: COLORS.err }} />
              Error
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Content: SVG + Side Panel ── */}
      <div className="flex-1 flex min-h-0">
        {/* SVG Canvas */}
        <div className="flex-1 p-3 lg:p-4 overflow-hidden relative" ref={svgContainerRef}>
          {/* Site Legend overlay */}
          <SiteLegend />

          {/* Zoom Controls overlay */}
          <ZoomControls
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFit={handleFit}
          />

          {/* Minimap overlay */}
          <Minimap
            nodePositions={nodePositions}
            activeId={activeId}
            viewBoxStr={viewBoxStr}
            canvasW={CANVAS_W}
            canvasH={CANVAS_H}
          />

          <svg
            viewBox={viewBoxStr}
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
              {/* Gradient for high-quality links */}
              <linearGradient id="linkGradOk" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={COLORS.ok} stopOpacity="0.6" />
                <stop offset="50%" stopColor={COLORS.ok} stopOpacity="1" />
                <stop offset="100%" stopColor={COLORS.ok} stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="linkGradWarn" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={COLORS.warn} stopOpacity="0.6" />
                <stop offset="50%" stopColor={COLORS.warn} stopOpacity="1" />
                <stop offset="100%" stopColor={COLORS.warn} stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="linkGradErr" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={COLORS.err} stopOpacity="0.6" />
                <stop offset="50%" stopColor={COLORS.err} stopOpacity="1" />
                <stop offset="100%" stopColor={COLORS.err} stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <rect width={CANVAS_W} height={CANVAS_H} fill="url(#topoGrid)" />

            {/* Site labels with colored accents */}
            {Object.entries(SITE_CENTERS).map(([name, { cx, cy }]) => (
              <g key={name}>
                <rect
                  x={cx - 30}
                  y={cy - 62}
                  width={60}
                  height={18}
                  rx={4}
                  fill={BG.elevated}
                  stroke={SITE_COLORS[name] ?? BORDER.default}
                  strokeWidth="0.5"
                  opacity="0.8"
                />
                <text
                  x={cx}
                  y={cy - 49}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="600"
                  fill={SITE_COLORS[name] ?? COLORS.amber}
                  letterSpacing="0.05em"
                >
                  {name}
                </text>
              </g>
            ))}

            {/* Links with quality indicators */}
            {links.map((link) => {
              const nA = nodeMap.get(link.radioA);
              const nB = nodeMap.get(link.radioB);
              if (!nA || !nB) return null;

              const isHighlighted = activeId && (link.radioA === activeId || link.radioB === activeId);
              const isDimmed = activeId && !isHighlighted;

              // Thicker lines for better quality, color gradient
              let strokeWidth: number;
              let gradientId: string;
              if (link.quality === 'ok') {
                strokeWidth = link.snr > 25 ? 3 : 2;
                gradientId = 'linkGradOk';
              } else if (link.quality === 'warn') {
                strokeWidth = link.snr > 15 ? 2 : 1.5;
                gradientId = 'linkGradWarn';
              } else {
                strokeWidth = 1;
                gradientId = 'linkGradErr';
              }

              return (
                <line
                  key={link.id}
                  x1={nA.x}
                  y1={nA.y}
                  x2={nB.x}
                  y2={nB.y}
                  stroke={`url(#${gradientId})`}
                  strokeWidth={isHighlighted ? strokeWidth + 1.5 : strokeWidth}
                  opacity={isDimmed ? 0.08 : isHighlighted ? 1 : 0.35}
                  strokeLinecap="round"
                  className="transition-opacity duration-200"
                />
              );
            })}

            {/* Nodes */}
            {nodePositions.map((node) => {
              const { radio, x, y } = node;
              const statusColor = STATUS_COLORS[radio.state] ?? '#4a5567';
              const siteColor = SITE_COLORS[radio.siteName] ?? COLORS.amber;
              const isActive = activeId === radio.id;
              const isDimmed = activeId && !isActive;
              const isOffline = radio.state === 'offline' || radio.state === 'error';

              return (
                <g
                  key={radio.id}
                  className="cursor-pointer transition-all duration-150"
                  style={{ opacity: isDimmed ? 0.25 : 1 }}
                  onClick={() => selectRadio(radio.id)}
                  onMouseEnter={(e) => handleNodeHover(node, e)}
                  onMouseLeave={handleNodeLeave}
                >
                  {/* Glow circle */}
                  {isActive && (
                    <circle
                      cx={x}
                      cy={y}
                      r={18}
                      fill="none"
                      stroke={siteColor}
                      strokeWidth={2}
                      opacity={0.3}
                      filter="url(#nodeGlowStrong)"
                    />
                  )}

                  {/* Outer ring (site color) */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isActive ? 13 : 10}
                    fill={isOffline ? BG.elevated : siteColor + '15'}
                    stroke={siteColor}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    opacity={isActive ? 1 : 0.6}
                    filter={isActive ? 'url(#nodeGlow)' : undefined}
                  />

                  {/* Inner dot (status color) */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isOffline ? 2.5 : 4.5}
                    fill={statusColor}
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

                  {/* SNR + throughput label when active */}
                  {isActive && radio.snr > 0 && (
                    <text
                      x={x}
                      y={y + 32}
                      textAnchor="middle"
                      fontSize="8"
                      fontFamily="monospace"
                      fill={TEXT.tertiary}
                    >
                      {radio.snr} dB · {radio.throughput} Mbps
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Tooltip (HTML overlay) */}
          {hoveredNode && tooltipPos && (
            <NodeTooltip node={hoveredNode} x={tooltipPos.x} y={tooltipPos.y} />
          )}
        </div>

        {/* ── Side Panel (desktop) ── */}
        <div
          className="hidden lg:flex w-[300px] shrink-0 border-l overflow-y-auto"
          style={{
            backgroundColor: BG.card,
            borderColor: BORDER.default,
          }}
        >
          <TopologySidePanel activeRadio={activeRadio} activeId={activeId} activeLinks={activeLinks} activeNeighbors={activeNeighbors} />
        </div>

        {/* ── Mobile Bottom Sheet ── */}
        {activeRadio && (
          <MobileBottomSheet radio={activeRadio} activeId={activeId} activeLinks={activeLinks} activeNeighbors={activeNeighbors} />
        )}
      </div>
    </div>
  );
}

// ─── Desktop Side Panel Content (extracted) ─────────────────────────────────

function TopologySidePanel({ activeRadio, activeId, activeLinks, activeNeighbors }: {
  activeRadio: typeof radios[number] | null;
  activeId: number | null;
  activeLinks: ReturnType<typeof links.filter>;
  activeNeighbors: number;
}) {
  if (!activeRadio) {
    return (
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
    );
  }

  return (
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
            style={{
              backgroundColor: (SITE_COLORS[activeRadio.siteName] ?? COLORS.amber) + '15',
              color: SITE_COLORS[activeRadio.siteName] ?? COLORS.amber,
            }}
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
  );
}

// ─── Mobile Bottom Sheet ───────────────────────────────────────────────────

function MobileBottomSheet({ radio, activeLinks, activeNeighbors }: {
  radio: typeof radios[number];
  activeId: number | null;
  activeLinks: ReturnType<typeof links.filter>;
  activeNeighbors: number;
}) {
  const { selectRadio } = useNMSStore();

  const linkColor = (q: string) => q === 'ok' ? COLORS.ok : q === 'warn' ? COLORS.warn : COLORS.err;

  return (
    <div
      className="lg:hidden absolute bottom-0 left-0 right-0 z-30 animate-slide-up rounded-t-xl border-t overflow-hidden max-h-[45vh]"
      style={{
        backgroundColor: BG.card,
        borderColor: BORDER.default,
        boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 rounded-full" style={{ backgroundColor: BORDER.hover }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2">
        <div className="flex items-center gap-2">
          <StatusDot status={radio.state} size="md" pulse />
          <span className="text-sm font-bold font-mono" style={{ color: TEXT.primary }}>{radio.callsign}</span>
          <span
            className="px-1.5 py-0.5 rounded text-[9px] font-medium uppercase"
            style={{
              backgroundColor: (SITE_COLORS[radio.siteName] ?? COLORS.amber) + '15',
              color: SITE_COLORS[radio.siteName] ?? COLORS.amber,
            }}
          >
            {radio.siteName}
          </span>
        </div>
        <button
          onClick={() => selectRadio(null)}
          className="flex items-center justify-center w-7 h-7 rounded-md"
          style={{ color: TEXT.tertiary }}
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div className="overflow-y-auto overscroll-contain px-4 pb-4 space-y-3" style={{ maxHeight: 'calc(45vh - 60px)' }}>
        {/* Quick metrics grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'SNR', value: `${radio.snr} dB`, color: radio.snr > 20 ? COLORS.ok : radio.snr > 10 ? COLORS.warn : COLORS.err },
            { label: 'Throughput', value: `${radio.throughput} Mbps`, color: COLORS.amber },
            { label: 'Neighbors', value: String(activeNeighbors), color: COLORS.cyan },
            { label: 'CPU', value: `${radio.cpu}%`, color: radio.cpu > 70 ? COLORS.err : COLORS.ok },
            { label: 'Temp', value: `${radio.temp}°C`, color: radio.temp > 65 ? COLORS.err : TEXT.secondary },
            { label: 'Battery', value: `${radio.battery}%`, color: radio.battery < 30 ? COLORS.err : COLORS.ok },
          ].map((m) => (
            <div key={m.label} className="rounded-md p-2" style={{ backgroundColor: BG.elevated }}>
              <span className="text-[9px] uppercase tracking-wider block" style={{ color: TEXT.tertiary }}>{m.label}</span>
              <span className="text-xs font-bold font-mono block mt-0.5" style={{ color: m.color }}>{m.value}</span>
            </div>
          ))}
        </div>

        {/* Links */}
        {activeLinks.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: TEXT.tertiary }}>
              Active Links
            </h4>
            <div className="flex gap-2 overflow-x-auto overscroll-contain pb-1">
              {activeLinks.map((link) => {
                const peerId = link.radioA === radio.id ? link.radioB : link.radioA;
                const peer = radios.find((r) => r.id === peerId);
                return (
                  <div
                    key={link.id}
                    className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md"
                    style={{ backgroundColor: BG.input, border: `1px solid ${BORDER.default}` }}
                    onClick={() => selectRadio(peerId)}
                  >
                    <StatusDot status={peer?.state ?? 'offline'} size="sm" pulse={false} />
                    <span className="text-[10px] font-mono font-medium" style={{ color: TEXT.primary }}>
                      {peer?.callsign ?? `#${peerId}`}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: linkColor(link.quality) }}>
                      {link.snr}dB
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Topology View Component (moved above) ───────────────────
