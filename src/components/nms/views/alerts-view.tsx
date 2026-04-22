'use client'

import React, { useState } from 'react'
import { alerts } from '@/lib/nms-data/mock-data'
import { StatusDot, StatusChip, Sparkline, PanelHeader } from '@/components/nms/nms-utils'
import { ChevronRight, Check, Clock, Filter, Settings, Bell, X } from 'lucide-react'

export default function AlertsView() {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const alert = alerts[selectedIdx] || alerts[0]

  const severityColor = (sev: string) =>
    sev === 'critical' ? '#ff5470' : sev === 'warning' ? '#ffb020' : '#7aa7ff'

  const sevLabel = (sev: string) => sev.toUpperCase()

  // Deterministic pseudo-random for hydration safety
  const detRand = (i: number) => Math.abs(Math.sin((i + 7) * 12.9898 + 78.233) * 43758.5453) % 1

  // Generate mock telemetry data for sparkline
  const telemetryData = useState(() =>
    Array.from({ length: 30 }, (_, i) => 14 + Math.sin(i * 0.4) * 7 + (detRand(i) - 0.5) * 4)
  )[0]

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap px-5 pt-4 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium text-[#e7ecf4] whitespace-nowrap">Alerts</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-[#ff5470]/10 border border-[#ff5470]/30 text-[#ff5470]">
              4 critical
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-[#ffb020]/10 border border-[#ffb020]/30 text-[#ffb020]">
              3 warning
            </span>
          </div>
          <p className="text-[10.5px] uppercase tracking-[0.08em] text-[#4a5567]">
            Real-time · routed via Slack · Teams · webhook · email
          </p>
        </div>
        <div className="flex-1" />
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-[#222b39] bg-[#161c27] text-[#aeb8c8] hover:bg-[#1c2430] transition-colors">
          <Filter size={12} /> All Severities
        </button>
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-[#222b39] bg-[#161c27] text-[#aeb8c8] hover:bg-[#1c2430] transition-colors">
          <Settings size={12} /> Rules
        </button>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-[#1a0f00] transition-colors" style={{
          background: 'linear-gradient(180deg, #f4a417 0%, #d98d0a 100%)',
          border: '1px solid #a06b08',
          boxShadow: '0 0 0 1px rgba(244,164,23,0.25), 0 4px 12px rgba(244,164,23,0.18)',
        }}>
          <Check size={12} /> Acknowledge All
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex gap-3.5 px-5 pb-5 min-h-0">
        {/* Alert Timeline */}
        <div className="flex-1 rounded-md border border-[#222b39] bg-[#11161f] flex flex-col min-h-0">
          <PanelHeader title="Alert Timeline" />
          <div className="flex-1 overflow-auto min-h-0">
            {alerts.map((a, i) => (
              <button
                key={i}
                onClick={() => setSelectedIdx(i)}
                className="flex items-center gap-3 px-4 py-3 border-b border-[#1a2230] last:border-b-0 w-full text-left transition-colors"
                style={{
                  background: i === selectedIdx ? 'rgba(244,164,23,0.06)' : 'transparent',
                  borderLeft: i === selectedIdx ? '2px solid #f4a417' : '2px solid transparent',
                }}
              >
                <StatusDot state={a.severity === 'critical' ? 'err' : a.severity === 'warning' ? 'warn' : 'ok'} />
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10.5px] uppercase tracking-[0.08em] font-medium"
                      style={{ color: severityColor(a.severity) }}
                    >
                      {sevLabel(a.severity)}
                    </span>
                    <span className="text-[10.5px] uppercase tracking-[0.08em] text-[#4a5567]">
                      · {a.site} · {a.timestamp}
                    </span>
                  </div>
                  <div className="text-[12.5px] font-medium text-[#e7ecf4]">{a.title}</div>
                  <div className="text-[11.5px] text-[#aeb8c8] line-clamp-2">{a.description}</div>
                </div>
                <ChevronRight size={13} className="text-[#4a5567] flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Alert Detail */}
        <div className="rounded-md border border-[#222b39] bg-[#11161f] flex flex-col w-[380px] min-h-0 flex-shrink-0">
          <PanelHeader
            title="Alert Detail"
            right={
              <StatusChip
                status={alert.severity === 'critical' ? 'err' : alert.severity === 'warning' ? 'warn' : 'info'}
              >
                {sevLabel(alert.severity)}
              </StatusChip>
            }
          />
          <div className="flex-1 overflow-auto min-h-0 p-4">
            <div className="flex flex-col gap-3">
              <div className="text-sm font-medium text-[#e7ecf4] leading-relaxed">{alert.title}</div>
              <div className="text-xs text-[#aeb8c8] leading-relaxed">{alert.description}</div>

              <div className="h-px bg-[#1a2230]" />

              <div className="flex flex-col gap-2">
                {[
                  ['Triggered', `${alert.timestamp} · 2m ago`],
                  ['Rule', alert.rule],
                  ['Site', alert.site],
                  ['Scope', alert.scope || 'MR-008-C · MR-017-C'],
                  ['Predicted', alert.predicted || 'Outage in ~12 min'],
                  ['Model', alert.model || 'forecast-v1 · confidence 0.82'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center">
                    <span className="text-[10.5px] uppercase tracking-[0.08em] text-[#4a5567]">{k}</span>
                    <span className="text-[11.5px] text-[#e7ecf4]">{v}</span>
                  </div>
                ))}
              </div>

              <div className="h-px bg-[#1a2230]" />

              <div className="text-[10.5px] uppercase tracking-[0.14em] font-medium text-[#6f7d93]">
                Suggested Action
              </div>
              <div
                className="text-[11.5px] text-[#aeb8c8] p-2.5 rounded border border-[rgba(244,164,23,0.35)] bg-[#161c27] leading-relaxed"
              >
                Increase Tx power on MR-008-C to 30 dBm or failover MR-017-C to mesh parent MR-019-A to
                regain SNR margin.
              </div>

              <div className="flex gap-2">
                <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-[#1a0f00]" style={{
                  background: 'linear-gradient(180deg, #f4a417 0%, #d98d0a 100%)',
                  border: '1px solid #a06b08',
                }}>
                  <Check size={12} /> Apply Fix
                </button>
                <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-[#222b39] bg-transparent text-[#aeb8c8] hover:bg-[#161c27] transition-colors">
                  <X size={12} /> Snooze
                </button>
              </div>

              <div className="h-px bg-[#1a2230]" />

              <div className="text-[10.5px] uppercase tracking-[0.14em] font-medium text-[#6f7d93]">
                Related Telemetry
              </div>
              <Sparkline data={telemetryData} width={330} height={60} color="#ff5470" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
