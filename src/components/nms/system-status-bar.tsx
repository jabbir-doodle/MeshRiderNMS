// =============================================================================
// Mesh Rider NMS — System Status Bar
// Fixed bottom status bar with scrolling real-time metrics ticker
// =============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { useRealtimeSimulation } from '@/hooks/use-realtime-simulation';
import { COLORS, TEXT } from './nms-utils';

interface MetricItem {
  label: string;
  value: string;
  color: string;
}

export function SystemStatusBar() {
  const { fluctuate } = useRealtimeSimulation();
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const y = now.getUTCFullYear();
      const mo = String(now.getUTCMonth() + 1).padStart(2, '0');
      const d = String(now.getUTCDate()).padStart(2, '0');
      const h = String(now.getUTCHours()).padStart(2, '0');
      const mi = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${y}-${mo}-${d} ${h}:${mi}:${s} UTC`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const metrics: MetricItem[] = [
    { label: 'Mesh Connectivity', value: `${fluctuate(95.2, 1.5).toFixed(1)}%`, color: COLORS.ok },
    { label: 'Avg Latency', value: `${Math.round(fluctuate(12, 2))}ms`, color: COLORS.cyan },
    { label: 'Total Throughput', value: `${fluctuate(1.2, 0.15).toFixed(2)} Gbps`, color: COLORS.amber },
    { label: 'Active Links', value: `${Math.round(fluctuate(37, 2))}`, color: COLORS.cyan },
    { label: 'Spectrum Score', value: `${Math.round(fluctuate(88, 3))}/100`, color: COLORS.amber },
    { label: 'Uptime', value: `${fluctuate(99.97, 0.02).toFixed(2)}%`, color: COLORS.ok },
    { label: 'Nodes Online', value: `${Math.round(fluctuate(22, 0.5))}/24`, color: COLORS.ok },
  ];

  // Double the metrics for seamless scrolling loop
  const doubledMetrics = [...metrics, ...metrics];

  return (
    <div
      className="flex-shrink-0 flex items-center h-8 relative overflow-hidden"
      style={{
        backgroundColor: '#0d1118',
        borderTop: '1px solid #1a2230',
        borderLeft: '2px solid #f4a417',
      }}
    >
      {/* Left: SYSTEM label */}
      <div
        className="flex-shrink-0 flex items-center px-3 h-full z-10"
        style={{
          backgroundColor: '#0d1118',
          borderRight: '1px solid #1a2230',
        }}
      >
        <span
          className="text-[10px] font-bold font-mono tracking-[0.15em] uppercase"
          style={{ color: COLORS.amber }}
        >
          System
        </span>
      </div>

      {/* Scrolling metrics ticker */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        {/* Fade edges */}
        <div
          className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, #0d1118, transparent)',
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(-90deg, #0d1118, transparent)',
          }}
        />
        <div
          className="flex items-center gap-6 h-full whitespace-nowrap status-ticker-scroll"
        >
          {doubledMetrics.map((m, i) => (
            <div key={i} className="inline-flex items-center gap-1.5 flex-shrink-0">
              <span
                className="text-[10px] font-mono uppercase tracking-wider"
                style={{ color: TEXT.tertiary }}
              >
                {m.label}
              </span>
              <span className="text-[10px] font-mono" style={{ color: TEXT.muted }}>:</span>
              <span
                className="text-[10px] font-mono font-semibold tabular-nums"
                style={{ color: m.color }}
              >
                {m.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: UTC timestamp */}
      <div
        className="flex-shrink-0 flex items-center px-3 h-full z-10"
        style={{
          backgroundColor: '#0d1118',
          borderLeft: '1px solid #1a2230',
        }}
      >
        <span className="text-[10px] font-mono tabular-nums" style={{ color: TEXT.secondary }}>
          {utcTime}
        </span>
      </div>
    </div>
  );
}
