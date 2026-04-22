'use client'

import React, { useState } from 'react'
import { tenants, operators } from '@/lib/nms-data/mock-data'
import { StatusChip, PanelHeader } from '@/components/nms/nms-utils'
import { Building2, Lock, Plus, Shield, Wifi, Server, Fingerprint, GitBranch } from 'lucide-react'

export default function AccessView() {
  const [activeTab, setActiveTab] = useState<'tenants' | 'operators'>('tenants')

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap px-5 pt-4 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium text-[#e7ecf4] whitespace-nowrap">Access & Security</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-[#3ddc97]/10 border border-[rgba(61,220,151,0.28)] text-[#3ddc97]">
              <Shield size={10} /> SOC 2 · 98%
            </span>
          </div>
          <p className="text-[10.5px] uppercase tracking-[0.08em] text-[#4a5567]">
            Tenants · RBAC · mTLS certs · OIDC federation · WebAuthn MFA
          </p>
        </div>
        <div className="flex-1" />
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-[#1a0f00]" style={{
          background: 'linear-gradient(180deg, #f4a417 0%, #d98d0a 100%)',
          border: '1px solid #a06b08',
          boxShadow: '0 0 0 1px rgba(244,164,23,0.25), 0 4px 12px rgba(244,164,23,0.18)',
        }}>
          <Plus size={12} /> Invite Operator
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-5 pb-5 min-h-0">
        {/* Tab toggle */}
        <div className="flex gap-2 mb-3.5">
          {(['tenants', 'operators'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors"
              style={{
                background: activeTab === tab ? '#161c27' : 'transparent',
                color: activeTab === tab ? '#e7ecf4' : '#6f7d93',
                border: activeTab === tab ? '1px solid #2c3647' : '1px solid transparent',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">
          {/* Tenants */}
          <div className="rounded-md border border-[#222b39] bg-[#11161f]">
            <PanelHeader title="Tenants" subtitle="3 active · multi-tenant RLS enforced" />
            <div className="overflow-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-[10.5px] uppercase tracking-[0.12em] font-medium text-[#6f7d93] px-3 py-2.5 border-b border-[#222b39] bg-[#11161f]">
                      Tenant
                    </th>
                    <th className="text-left text-[10.5px] uppercase tracking-[0.12em] font-medium text-[#6f7d93] px-3 py-2.5 border-b border-[#222b39] bg-[#11161f]">
                      Type
                    </th>
                    <th className="text-left text-[10.5px] uppercase tracking-[0.12em] font-medium text-[#6f7d93] px-3 py-2.5 border-b border-[#222b39] bg-[#11161f]">
                      Radios
                    </th>
                    <th className="text-left text-[10.5px] uppercase tracking-[0.12em] font-medium text-[#6f7d93] px-3 py-2.5 border-b border-[#222b39] bg-[#11161f]">
                      Operators
                    </th>
                    <th className="text-left text-[10.5px] uppercase tracking-[0.12em] font-medium text-[#6f7d93] px-3 py-2.5 border-b border-[#222b39] bg-[#11161f]">
                      Isolation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => (
                    <tr key={t.id} className="hover:bg-[#161c27] transition-colors">
                      <td className="px-3 py-2.5 border-b border-[#1a2230]">
                        <div className="flex items-center gap-2">
                          <Building2 size={13} className="text-[#f4a417]" />
                          <span className="text-xs font-medium text-[#e7ecf4]">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 border-b border-[#1a2230] text-xs text-[#aeb8c8]">{t.type}</td>
                      <td className="px-3 py-2.5 border-b border-[#1a2230] text-xs font-mono text-[#e7ecf4]">{t.radios}</td>
                      <td className="px-3 py-2.5 border-b border-[#1a2230] text-xs font-mono text-[#e7ecf4]">
                        {t.operators}
                      </td>
                      <td className="px-3 py-2.5 border-b border-[#1a2230]">
                        <StatusChip status="ok">
                          <Lock size={9} /> RLS · ACL
                        </StatusChip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operators */}
          <div className="rounded-md border border-[#222b39] bg-[#11161f]">
            <PanelHeader title="Operators · Acme Industrial" subtitle={`${operators.length} members`} />
            <div className="overflow-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-[10.5px] uppercase tracking-[0.12em] font-medium text-[#6f7d93] px-3 py-2.5 border-b border-[#222b39] bg-[#11161f]">
                      Operator
                    </th>
                    <th className="text-left text-[10.5px] uppercase tracking-[0.12em] font-medium text-[#6f7d93] px-3 py-2.5 border-b border-[#222b39] bg-[#11161f]">
                      Role
                    </th>
                    <th className="text-left text-[10.5px] uppercase tracking-[0.12em] font-medium text-[#6f7d93] px-3 py-2.5 border-b border-[#222b39] bg-[#11161f]">
                      Scope
                    </th>
                    <th className="text-left text-[10.5px] uppercase tracking-[0.12em] font-medium text-[#6f7d93] px-3 py-2.5 border-b border-[#222b39] bg-[#11161f]">
                      MFA
                    </th>
                    <th className="text-left text-[10.5px] uppercase tracking-[0.12em] font-medium text-[#6f7d93] px-3 py-2.5 border-b border-[#222b39] bg-[#11161f]">
                      Last
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map(op => (
                    <tr key={op.id} className="hover:bg-[#161c27] transition-colors">
                      <td className="px-3 py-2.5 border-b border-[#1a2230]">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-full border border-[#222b39] flex items-center justify-center text-[9px] font-semibold"
                            style={{ background: '#161c27', color: '#f4a417' }}
                          >
                            {op.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-[#e7ecf4]">{op.name}</span>
                            <span className="text-[10px] text-[#4a5567]">{op.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 border-b border-[#1a2230] text-xs text-[#aeb8c8]">{op.role}</td>
                      <td className="px-3 py-2.5 border-b border-[#1a2230] text-xs text-[#aeb8c8]">{op.scope}</td>
                      <td className="px-3 py-2.5 border-b border-[#1a2230]">
                        <StatusChip
                          status={op.mfa === 'WebAuthn' ? 'ok' : op.mfa === 'TOTP' ? 'info' : 'warn'}
                        >
                          {op.mfa}
                        </StatusChip>
                      </td>
                      <td className="px-3 py-2.5 border-b border-[#1a2230] text-[11px] font-mono text-[#aeb8c8]">
                        {op.lastActive}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="rounded-md border border-[#222b39] bg-[#11161f]">
          <PanelHeader title="Security Architecture" subtitle="Zero-trust, radio to browser" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 p-4">
            {[
              {
                icon: <Wifi size={20} />,
                title: 'Transport Security',
                items: ['TLS 1.3 everywhere', 'mTLS on MQTT bus', 'Per-tenant intermediate CA'],
                color: '#2dd4ff',
              },
              {
                icon: <Fingerprint size={20} />,
                title: 'Identity',
                items: ['X.509 per radio', 'OIDC + SAML federation', 'WebAuthn MFA'],
                color: '#f4a417',
              },
              {
                icon: <GitBranch size={20} />,
                title: 'Supply Chain',
                items: ['SLSA Level 3 provenance', 'Sigstore-signed images', 'SBOM on every release'],
                color: '#3ddc97',
              },
              {
                icon: <Server size={20} />,
                title: 'Tenant Isolation',
                items: ['PostgreSQL RLS', 'Per-tenant MQTT ACL', 'Logical Redis DB per tenant'],
                color: '#7aa7ff',
              },
            ].map((card, i) => (
              <div
                key={i}
                className="rounded-md border p-4 flex flex-col gap-3"
                style={{
                  borderColor: `${card.color}20`,
                  background: `${card.color}08`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center"
                    style={{
                      background: `${card.color}15`,
                      color: card.color,
                    }}
                  >
                    {card.icon}
                  </div>
                  <span className="text-xs font-medium text-[#e7ecf4]">{card.title}</span>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {card.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-[11px] text-[#aeb8c8]">
                      <span
                        className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: card.color }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
