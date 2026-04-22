// =============================================================================
// Mesh Rider Fleet NMS — Reusable Utility Components
// Task ID: 2-a | Dark tactical theme UI primitives
// =============================================================================

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ─── Color Constants ────────────────────────────────────────────────────────

export const COLORS = {
  ok: '#3ddc97',
  warn: '#ffb020',
  err: '#ff5470',
  info: '#7aa7ff',
  amber: '#f4a417',
  cyan: '#2dd4ff',
} as const;

export const STATUS_COLORS: Record<string, string> = {
  online: COLORS.ok,
  degraded: COLORS.warn,
  offline: COLORS.err,
  error: COLORS.err,
  active: COLORS.ok,
  suspended: COLORS.warn,
  inactive: COLORS.err,
  'in-sync': COLORS.ok,
  drift: COLORS.warn,
  ok: COLORS.ok,
  warn: COLORS.warn,
  err: COLORS.err,
  info: COLORS.info,
  critical: COLORS.err,
  warning: COLORS.warn,
  canary: COLORS.cyan,
  scheduled: COLORS.info,
  paused: COLORS.warn,
  done: COLORS.ok,
  failed: COLORS.err,
} as const;

export const BG = {
  base: '#07090d',
  panel: '#0b0f16',
  card: '#11161f',
  elevated: '#161c27',
  input: '#1c2430',
} as const;

export const TEXT = {
  primary: '#e7ecf4',
  secondary: '#aeb8c8',
  tertiary: '#6f7d93',
  muted: '#4a5567',
} as const;

export const BORDER = {
  default: '#222b39',
  hover: '#2c3647',
} as const;

// ─── StatusDot ──────────────────────────────────────────────────────────────

interface StatusDotProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

export function StatusDot({ status, size = 'md', pulse = true, className }: StatusDotProps) {
  const color = STATUS_COLORS[status] ?? '#4a5567';
  const sizeMap = { sm: 6, md: 8, lg: 10 };
  const px = sizeMap[size];

  return (
    <span className={cn('relative inline-flex items-center justify-center', className)}>
      <span
        className="rounded-full"
        style={{
          width: px,
          height: px,
          backgroundColor: color,
          boxShadow: `0 0 ${px}px ${color}66`,
        }}
      />
      {pulse && status === 'online' && (
        <span
          className="absolute rounded-full animate-ping"
          style={{
            width: px,
            height: px,
            backgroundColor: color,
            opacity: 0,
          }}
        />
      )}
      {pulse && status === 'error' && (
        <span
          className="absolute rounded-full animate-ping"
          style={{
            width: px,
            height: px,
            backgroundColor: color,
            opacity: 0,
          }}
        />
      )}
    </span>
  );
}

// ─── StatusChip ─────────────────────────────────────────────────────────────

interface StatusChipProps {
  status: string;
  label?: string;
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusChip({ status, label, children, className, size = 'md' }: StatusChipProps) {
  const color = STATUS_COLORS[status] ?? '#4a5567';
  const display = children ?? label ?? status;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium uppercase tracking-wide',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        className
      )}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      {display}
    </span>
  );
}

// ─── SignalBars ─────────────────────────────────────────────────────────────

interface SignalBarsProps {
  snr: number;
  className?: string;
  size?: 'sm' | 'md';
}

export function SignalBars({ snr, className, size = 'md' }: SignalBarsProps) {
  // SNR thresholds: 0-10 = 1 bar, 10-18 = 2, 18-26 = 3, 26+ = 4
  const barCount = snr >= 26 ? 4 : snr >= 18 ? 3 : snr >= 10 ? 2 : snr > 0 ? 1 : 0;
  const color = snr >= 26 ? COLORS.ok : snr >= 18 ? COLORS.ok : snr >= 10 ? COLORS.warn : snr > 0 ? COLORS.err : '#4a5567';
  const h = size === 'sm' ? 10 : 14;
  const gap = size === 'sm' ? 1.5 : 2;
  const w = size === 'sm' ? 3 : 4;

  return (
    <span className={cn('inline-flex items-end gap-[1.5px]', className)} title={`SNR: ${snr} dB`}>
      {[1, 2, 3, 4].map((bar) => {
        const barH = (bar / 4) * h;
        const active = bar <= barCount;
        return (
          <span
            key={bar}
            style={{
              width: w,
              height: barH,
              borderRadius: 1,
              backgroundColor: active ? color : '#222b39',
              transition: 'background-color 0.2s',
            }}
          />
        );
      })}
    </span>
  );
}

// ─── Sparkline ──────────────────────────────────────────────────────────────

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  strokeWidth?: number;
  className?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = COLORS.cyan,
  fillColor,
  strokeWidth = 1.5,
  className,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('inline-block', className)}
    >
      {fillColor && (
        <path d={areaD} fill={fillColor} opacity={0.15} />
      )}
      <path d={pathD} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── ProgressBar ────────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  bgColor?: string;
  height?: number;
  className?: string;
  label?: string;
  showPercent?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  color,
  bgColor = '#222b39',
  height = 6,
  className,
  label,
  showPercent = false,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  // Auto-select color based on percentage
  const barColor = color ?? (pct > 80 ? COLORS.err : pct > 60 ? COLORS.warn : COLORS.ok);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label && <span className="text-xs whitespace-nowrap" style={{ color: TEXT.secondary }}>{label}</span>}
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height, backgroundColor: bgColor }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor, minWidth: pct > 0 ? 2 : 0 }}
        />
      </div>
      {showPercent && (
        <span className="text-xs tabular-nums min-w-[3ch] text-right" style={{ color: TEXT.secondary }}>
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}

// ─── KPICard ────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  sparkline?: number[];
  sparklineColor?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function KPICard({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  sparkline,
  sparklineColor,
  icon,
  className,
}: KPICardProps) {
  const [hovered, setHovered] = React.useState(false);
  const deltaColor = delta !== undefined ? (delta >= 0 ? COLORS.ok : COLORS.err) : undefined;
  const glowColor = sparklineColor ?? COLORS.cyan;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all duration-200 cursor-default group relative overflow-hidden',
        className
      )}
      style={{
        backgroundColor: BG.card,
        borderColor: BORDER.default,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
      }}
      onMouseEnter={(e) => {
        setHovered(true);
        e.currentTarget.style.borderColor = BORDER.hover;
        e.currentTarget.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.02), 0 4px 16px rgba(0,0,0,0.2)`;
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        e.currentTarget.style.borderColor = BORDER.default;
        e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.02)';
      }}
    >
      {/* Subtle gradient overlay on hover */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: hovered ? 0.06 : 0,
          background: `linear-gradient(135deg, ${glowColor} 0%, transparent 60%)`,
        }}
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: TEXT.tertiary }}>
            {label}
          </span>
          {icon && <span style={{ color: COLORS.amber }}>{icon}</span>}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums leading-none" style={{ color: TEXT.primary }}>
            {value}
          </span>
          {unit && <span className="text-xs" style={{ color: TEXT.tertiary }}>{unit}</span>}
        </div>
        {(delta !== undefined || sparkline) && (
          <div className="flex items-center justify-between mt-2">
            {delta !== undefined && (
              <span className="inline-flex items-center gap-0.5 text-xs tabular-nums" style={{ color: deltaColor }}>
                {/* Trend arrow */}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  {delta >= 0 ? (
                    <path d="M5 1.5L8.5 5L5 8.5" stroke={deltaColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <path d="M5 8.5L1.5 5L5 1.5" stroke={deltaColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </svg>
                {Math.abs(delta)}{deltaLabel ?? '%'}
              </span>
            )}
            {sparkline && sparkline.length >= 2 && (
              <div style={{
                filter: hovered ? `drop-shadow(0 0 4px ${glowColor}66)` : 'none',
                transition: 'filter 0.3s ease',
              }}>
                <Sparkline
                  data={sparkline}
                  width={60}
                  height={20}
                  color={sparklineColor ?? COLORS.cyan}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PanelHeader ────────────────────────────────────────────────────────────

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}

export function PanelHeader({ title, subtitle, right, className }: PanelHeaderProps) {
  return (
    <div
      className={cn('flex items-center justify-between border-b px-4 py-3', className)}
      style={{ borderColor: BORDER.default }}
    >
      <div>
        <h3 className="text-sm font-semibold" style={{ color: TEXT.primary }}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: TEXT.tertiary }}>
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}

// ─── SegmentedControl ───────────────────────────────────────────────────────

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex rounded-lg border p-0.5',
        className
      )}
      style={{
        backgroundColor: BG.input,
        borderColor: BORDER.default,
      }}
      role="tablist"
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-md font-medium transition-all',
              size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
            )}
            style={{
              backgroundColor: isActive ? COLORS.amber + '20' : 'transparent',
              color: isActive ? COLORS.amber : TEXT.secondary,
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = TEXT.primary;
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = TEXT.secondary;
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Panel (card wrapper) ───────────────────────────────────────────────────

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  noPadding?: boolean;
}

export function Panel({ children, className, header, noPadding }: PanelProps) {
  return (
    <div
      className={cn('rounded-lg border overflow-hidden', className)}
      style={{
        backgroundColor: BG.card,
        borderColor: BORDER.default,
      }}
    >
      {header}
      <div className={cn(noPadding ? '' : 'p-4')}>{children}</div>
    </div>
  );
}

// ─── MetricRow (label : value pairs) ────────────────────────────────────────

interface MetricRowProps {
  label: string;
  value: string | number;
  valueColor?: string;
  className?: string;
}

export function MetricRow({ label, value, valueColor, className }: MetricRowProps) {
  return (
    <div className={cn('flex items-center justify-between py-1.5', className)}>
      <span className="text-xs" style={{ color: TEXT.tertiary }}>
        {label}
      </span>
      <span className="text-xs font-medium tabular-nums" style={{ color: valueColor ?? TEXT.secondary }}>
        {value}
      </span>
    </div>
  );
}

// ─── MutedBadge (subtle text badge) ─────────────────────────────────────────

interface MutedBadgeProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export function MutedBadge({ children, className, color }: MutedBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider',
        className
      )}
      style={{
        backgroundColor: (color ?? COLORS.amber) + '15',
        color: color ?? COLORS.amber,
      }}
    >
      {children}
    </span>
  );
}

// ─── EmptyState ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {icon && <div className="mb-3" style={{ color: TEXT.muted }}>{icon}</div>}
      <p className="text-sm font-medium" style={{ color: TEXT.secondary }}>{title}</p>
      {description && (
        <p className="text-xs mt-1 max-w-xs" style={{ color: TEXT.tertiary }}>{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
