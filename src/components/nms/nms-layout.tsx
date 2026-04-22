'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { useNMSStore, type NMSView } from '@/lib/nms-data/store'
import { NMSSidebar } from './nms-sidebar'
import { NMSTopbar } from './nms-topbar'
import { AIAdvisorPanel } from './ai-advisor-panel'
import { SystemStatusBar } from './system-status-bar'

const VIEW_PLACEHOLDER_TITLES: Record<NMSView, string> = {
  fleet: 'Mesh Rider Dashboard',
  topology: 'Network Topology',
  radio: 'Radio Detail',
  ota: 'OTA Campaigns',
  spectrum: 'Spectrum Intelligence',
  alerts: 'Alerts',
  audit: 'Audit Log',
  access: 'Access & Security',
}

const VIEW_PLACEHOLDER_DESCRIPTIONS: Record<NMSView, string> = {
  fleet: 'Real-time Mesh Rider fleet overview with KPI metrics, radio status table, and mesh health indicators.',
  topology: 'Interactive mesh network graph showing node connections, signal strength, and link quality.',
  radio: 'Individual radio configuration, performance metrics, neighbor table, and diagnostics.',
  ota: 'Staged firmware rollout management with campaign scheduling, progress tracking, and rollback.',
  spectrum: 'Real-time band scan visualization, waterfall display, and automated jammer detection.',
  alerts: 'Live alert timeline with severity-based filtering and AI-suggested remediation actions.',
  audit: 'Append-only compliance log with tamper-proof event tracking and export capabilities.',
  access: 'Multi-tenant RBAC management, operator provisioning, and session monitoring.',
}

interface NMSLayoutProps {
  children?: React.ReactNode
}

export function NMSLayout({ children }: NMSLayoutProps) {
  const { currentView } = useNMSStore()

  return (
    <div className="flex h-screen bg-[#07090d] overflow-hidden">
      {/* Sidebar */}
      <NMSSidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <NMSTopbar />

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-[#0b0f16]">
          {children ?? (
            <PlaceholderView view={currentView} />
          )}
        </main>

        {/* System Status Bar */}
        <SystemStatusBar />
      </div>

      {/* AI Advisor Panel (floating, independent of views) */}
      <AIAdvisorPanel />
    </div>
  )
}

function PlaceholderView({ view }: { view: NMSView }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#f4a417]/10 border border-[#f4a417]/20">
          <span className="text-2xl font-mono font-bold text-[#f4a417]">
            {VIEW_PLACEHOLDER_TITLES[view].charAt(0)}
          </span>
        </div>
        <h2 className="text-xl font-semibold text-[#e7ecf4]">
          {VIEW_PLACEHOLDER_TITLES[view]}
        </h2>
        <p className="text-sm text-[#6f7d93] leading-relaxed">
          {VIEW_PLACEHOLDER_DESCRIPTIONS[view]}
        </p>
        <div className="pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#11161f] border border-[#222b39]">
            <div className="w-2 h-2 rounded-full bg-[#3ddc97] animate-pulse" />
            <span className="text-xs font-mono text-[#aeb8c8]">Module loading...</span>
          </div>
        </div>
      </div>
    </div>
  )
}
