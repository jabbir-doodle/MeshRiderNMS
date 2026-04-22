'use client'

import React, { useState } from 'react'
import { auditEvents } from '@/lib/nms-data/mock-data'
import { StatusChip, PanelHeader } from '@/components/nms/nms-utils'
import { ChevronRight, Download, Search } from 'lucide-react'

export default function AuditView() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEvents = searchQuery
    ? auditEvents.filter(
        e =>
          e.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.object.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : auditEvents

  const actionColor = (type: string) => {
    if (type.startsWith('ota') || type === 'ota') return 'amber'
    if (type.startsWith('config') || type === 'config') return 'info'
    if (type.startsWith('alert') || type === 'alert') return 'err'
    if (type.startsWith('agent') || type === 'agent') return 'cyan'
    return 'neutral'
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap px-4 sm:px-5 pt-4 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium text-[#e7ecf4] whitespace-nowrap">Audit Log</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-medium border border-[#2c3647] bg-[#161c27] text-[#aeb8c8]">
              Append-only · SOC 2
            </span>
          </div>
          <p className="text-[10.5px] uppercase tracking-[0.08em] text-[#4a5567]">
            Every write · operator ID · IP · before/after diff · exportable
          </p>
        </div>
        <div className="flex-1" />
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#222b39] bg-[#11161f]">
          <Search size={12} className="text-[#6f7d93]" />
          <input
            placeholder="Filter by user, action, object…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent border-0 outline-none text-xs text-[#e7ecf4] w-40 sm:w-60 font-mono placeholder:text-[#4a5567]"
          />
        </div>
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-[#222b39] bg-[#161c27] text-[#aeb8c8] hover:bg-[#1c2430] transition-colors">
          <Download size={12} /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 px-5 pb-5 min-h-0">
        <div className="rounded-md border border-[#222b39] bg-[#11161f] flex flex-col h-full min-h-0">
          <PanelHeader
            title={`Events · last 24 h`}
            right={
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-[#2dd4ff]/10 border border-[#2dd4ff]/35 text-[#2dd4ff]">
                {filteredEvents.length} events
              </span>
            }
          />
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full border-collapse">
              <thead>
                <tr className="sticky top-0 z-10">
                  <th className="text-left text-[10.5px] uppercase tracking-[0.12em] font-medium text-[#6f7d93] px-3 py-2.5 border-b border-[#222b39] bg-[#11161f] w-[92px]">
                    Time
                  </th>
                  <th className="text-left text-[10.5px] uppercase tracking-[0.12em] font-medium text-[#6f7d93] px-3 py-2.5 border-b border-[#222b39] bg-[#11161f]">
                    Operator
                  </th>
                  <th className="text-left text-[10.5px] uppercase tracking-[0.12em] font-medium text-[#6f7d93] px-3 py-2.5 border-b border-[#222b39] bg-[#11161f]">
                    Action
                  </th>
                  <th className="text-left text-[10.5px] uppercase tracking-[0.12em] font-medium text-[#6f7d93] px-3 py-2.5 border-b border-[#222b39] bg-[#11161f]">
                    Object
                  </th>
                  <th className="text-left text-[10.5px] uppercase tracking-[0.12em] font-medium text-[#6f7d93] px-3 py-2.5 border-b border-[#222b39] bg-[#11161f]">
                    Source IP
                  </th>
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((a, i) => (
                  <tr key={i} className="hover:bg-[#161c27] transition-colors">
                    <td className="px-3 py-2.5 border-b border-[#1a2230] text-[11px] font-mono text-[#aeb8c8]">
                      {a.timestamp}
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#1a2230]">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full border border-[#222b39] flex items-center justify-center text-[9px] font-semibold"
                          style={{ background: '#161c27', color: '#f4a417' }}
                        >
                          {a.operator === 'system' ? 'SY' : a.operator.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[11.5px] font-mono text-[#e7ecf4]">{a.operator}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#1a2230]">
                      <StatusChip status={actionColor(a.actionType)}>{a.action}</StatusChip>
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#1a2230] text-xs text-[#aeb8c8]">{a.object}</td>
                    <td className="px-3 py-2.5 border-b border-[#1a2230] text-[11px] font-mono text-[#aeb8c8]">
                      {a.sourceIp}
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#1a2230]">
                      <ChevronRight size={13} className="text-[#4a5567]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
