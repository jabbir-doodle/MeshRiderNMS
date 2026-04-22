'use client'

import React, { useState, useMemo } from 'react'
import { spectrumData as spectrumPoints, channelUtilization, spectrumEvents } from '@/lib/nms-data/mock-data'
import { StatusDot, PanelHeader, ProgressBar, SegmentedControl } from '@/components/nms/nms-utils'
import { Activity, Download, Radio } from 'lucide-react'

export default function SpectrumView() {
  const [timeRange, setTimeRange] = useState('24h')

  const chartW = 860
  const chartH = 220
  const maxP = Math.max(...spectrumPoints.map(p => p.power))
  const minP = -100

  const pts = useMemo(() =>
    spectrumPoints.map((p, i) => [
      (i / (spectrumPoints.length - 1)) * chartW,
      chartH - ((p.power - minP) / (maxP - minP)) * (chartH - 20) - 10
    ]),
    [maxP, minP, chartW, chartH]
  )

  const linePath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const fillPath = `${linePath} L ${chartW} ${chartH} L 0 ${chartH} Z`

  const channelMarkers = [
    { ch: 1, freq: 2412 },
    { ch: 6, freq: 2437 },
    { ch: 11, freq: 2462 },
  ]

  const jammers = [
    { freq: 2412, x: 130, y: 40, label: 'JAMMER · 2412' },
    { freq: 2462, x: 620, y: 55, label: 'JAMMER · 2462' },
  ]

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap px-5 pt-4 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium text-[#e7ecf4] whitespace-nowrap">Spectrum Intelligence</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-[#2dd4ff]/10 border border-[#2dd4ff]/35 text-[#2dd4ff]">
              <StatusDot status="ok" size="sm" /> SENSE v2
            </span>
          </div>
          <p className="text-[10.5px] uppercase tracking-[0.08em] text-[#4a5567]">
            Aggregate Sense band-scan across 247 radios · 2412–2484 MHz
          </p>
        </div>
        <div className="flex-1" />
        <SegmentedControl
          value={timeRange}
          onChange={setTimeRange}
          options={[
            { value: '1h', label: '1H' },
            { value: '6h', label: '6H' },
            { value: '24h', label: '24H' },
            { value: '7d', label: '7D' },
          ]}
        />
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-[#2c3647] bg-[#161c27] text-[#aeb8c8] hover:bg-[#1c2430] transition-colors">
          <Download size={12} /> Export PCAP
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto px-5 pb-5">
        {/* Band Occupancy Chart */}
        <div className="rounded-md border border-[#222b39] bg-[#11161f] mb-3.5">
          <PanelHeader
            title="Band Occupancy · 2.4 GHz ISM"
            subtitle="Noise floor average · peaks indicate active carriers or jammers"
            right={
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-[#ff5470]/10 border border-[#ff5470]/30 text-[#ff5470]">
                  2 jammers detected
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-[#ffb020]/10 border border-[#ffb020]/30 text-[#ffb020]">
                  Ch 6 congested
                </span>
              </div>
            }
          />
          <div className="px-5 pb-5 pt-4">
            <div className="relative" style={{ height: chartH }}>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none" className="w-full h-full">
                <defs>
                  <linearGradient id="specGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#f4a417" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#f4a417" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((y, i) => (
                  <g key={i}>
                    <line x1="0" x2={chartW} y1={y * chartH} y2={y * chartH} stroke="#1a2230" strokeWidth="1" />
                    <text x="4" y={y * chartH - 3} fill="#4a5567" fontSize="9" fontFamily="monospace">
                      {-40 - i * 15} dBm
                    </text>
                  </g>
                ))}
                {/* Spectrum fill */}
                <path d={fillPath} fill="url(#specGrad)" />
                <path d={linePath} fill="none" stroke="#f4a417" strokeWidth="1.5" />
                {/* Channel markers */}
                {channelMarkers.map(({ ch, freq }) => {
                  const x = ((freq - 2400) / (2485 - 2400)) * chartW
                  return (
                    <g key={ch}>
                      <line x1={x} x2={x} y1="0" y2={chartH} stroke="#2dd4ff" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
                      <text x={x + 3} y="12" fill="#2dd4ff" fontSize="10" fontFamily="monospace">
                        ch {ch}
                      </text>
                    </g>
                  )
                })}
                {/* Jammer markers */}
                {jammers.map((j, i) => (
                  <g key={i}>
                    <circle cx={j.x} cy={j.y} r="5" fill="none" stroke="#ff5470" strokeWidth="1.5" />
                    <text x={j.x + 10} y={j.y + 4} fill="#ff5470" fontSize="9" fontFamily="monospace">
                      {j.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            {/* Frequency labels */}
            <div className="flex justify-between mt-1.5">
              {[2400, 2412, 2437, 2462, 2484].map(f => (
                <span key={f} className="text-[10px] font-mono text-[#4a5567]">{f} MHz</span>
              ))}
            </div>
          </div>
        </div>

        {/* Waterfall + Channels */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-3.5">
          {/* Waterfall */}
          <div className="rounded-md border border-[#222b39] bg-[#11161f]">
            <PanelHeader title="Waterfall · last 60 minutes" subtitle="Noise floor evolution across band" />
            <div className="p-3.5">
              <div
                className="relative overflow-hidden rounded"
                style={{
                  height: 280,
                  background: 'linear-gradient(180deg, #050810, #0b0f16)',
                }}
              >
                <svg viewBox={`0 0 ${chartW} 280`} preserveAspectRatio="none" className="w-full h-full">
                  {Array.from({ length: 60 }).map((_, row) =>
                    spectrumPoints.map((p, col) => {
                      const v = p.power + Math.sin(row * 0.3 + col * 0.2) * 6
                      const intensity = Math.max(0, Math.min(1, (v + 95) / 50))
                      const color =
                        intensity > 0.7 ? '#ff5470' : intensity > 0.5 ? '#f4a417' : intensity > 0.3 ? '#3ddc97' : '#1a2b4a'
                      return (
                        <rect
                          key={`${row}-${col}`}
                          x={(col / (spectrumPoints.length - 1)) * chartW}
                          y={row * (280 / 60)}
                          width={chartW / spectrumPoints.length + 1}
                          height={280 / 60 + 1}
                          fill={color}
                          opacity={intensity * 0.9}
                        />
                      )
                    })
                  )}
                </svg>
              </div>
              <div className="flex justify-between items-center mt-1.5">
                <span className="text-[10.5px] uppercase tracking-[0.08em] text-[#4a5567]">−95 dBm</span>
                <div
                  className="h-2.5 rounded-sm"
                  style={{
                    width: 120,
                    background: 'linear-gradient(90deg, #1a2b4a, #3ddc97, #f4a417, #ff5470)',
                  }}
                />
                <span className="text-[10.5px] uppercase tracking-[0.08em] text-[#4a5567]">−40 dBm</span>
              </div>
            </div>
          </div>

          {/* Right side panels */}
          <div className="flex flex-col gap-3.5">
            {/* Channel Utilization */}
            <div className="rounded-md border border-[#222b39] bg-[#11161f]">
              <PanelHeader title="Channel Utilization" />
              <div className="flex flex-col gap-2.5 p-3.5">
                {channelUtilization.slice(0, 7).map(c => (
                  <div key={c.channel} className="flex items-center gap-3">
                    <span className="text-[11.5px] font-mono text-[#e7ecf4] w-10">ch {c.channel}</span>
                    <div className="flex-1">
                      <ProgressBar value={c.utilization} color={c.tone === 'err' ? '#ff5470' : c.tone === 'warn' ? '#ffb020' : '#3ddc97'} />
                    </div>
                    <span className="text-[11px] font-mono text-[#aeb8c8] w-9 text-right">{c.utilization}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detected Events */}
            <div className="rounded-md border border-[#222b39] bg-[#11161f]">
              <PanelHeader
                title="Detected Events"
                right={
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-[#ff5470]/10 border border-[#ff5470]/30 text-[#ff5470]">
                    {spectrumEvents.length}
                  </span>
                }
              />
              <div className="flex flex-col">
                {spectrumEvents.map((e, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1.5 px-3.5 py-2.5 border-b border-[#1a2230] last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <StatusDot
                        state={e.severity === 'err' ? 'err' : e.severity === 'warn' ? 'warn' : 'ok'}
                        size="sm"
                      />
                      <span
                        className="text-[11px] font-mono"
                        style={{
                          color: e.severity === 'err' ? '#ff5470' : e.severity === 'warn' ? '#ffb020' : '#7aa7ff',
                        }}
                      >
                        {e.frequency}
                      </span>
                      <span className="text-[10.5px] uppercase tracking-[0.08em] text-[#4a5567]">
                        · {e.site}
                      </span>
                    </div>
                    <span className="text-[11.5px] text-[#aeb8c8]">{e.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
