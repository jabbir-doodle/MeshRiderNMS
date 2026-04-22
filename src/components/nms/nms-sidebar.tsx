'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Network,
  UploadCloud,
  Activity,
  Bell,
  ScrollText,
  Shield,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Radio,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useNMSStore, type NMSView } from '@/lib/nms-data/store'

interface NavItem {
  id: NMSView
  label: string
  icon: React.ElementType
  badge?: 'radios' | 'alerts'
}

const NAV_ITEMS: NavItem[] = [
  { id: 'fleet', label: 'Fleet Dashboard', icon: LayoutDashboard, badge: 'radios' },
  { id: 'topology', label: 'Network Topology', icon: Network },
  { id: 'ota', label: 'OTA Campaigns', icon: UploadCloud },
  { id: 'spectrum', label: 'Spectrum Intelligence', icon: Activity },
  { id: 'alerts', label: 'Alerts', icon: Bell, badge: 'alerts' },
  { id: 'audit', label: 'Audit Log', icon: ScrollText },
  { id: 'access', label: 'Access & Security', icon: Shield },
]

const TENANTS = [
  { id: 'alpha-fleet', label: 'Alpha Fleet' },
  { id: 'bravo-unit', label: 'Bravo Unit' },
  { id: 'charlie-team', label: 'Charlie Team' },
]

// Hexagonal mesh SVG logo
function MeshLogo() {
  return (
    <div className="relative flex items-center justify-center flex-shrink-0">
      {/* Subtle glow effect behind the logo */}
      <div
        className="absolute inset-0 rounded-full blur-md opacity-40"
        style={{ backgroundColor: '#f4a417' }}
      />
      <svg width="34" height="34" viewBox="0 0 40 40" fill="none" className="relative">
        {/* Outer hexagon */}
        <polygon
          points="20,2 36,11 36,29 20,38 4,29 4,11"
          stroke="#f4a417"
          strokeWidth="1.5"
          fill="rgba(244, 164, 23, 0.08)"
        />
        {/* Inner hexagon (smaller, offset) */}
        <polygon
          points="20,9 28,14 28,26 20,31 12,26 12,14"
          stroke="#f4a417"
          strokeWidth="1"
          fill="rgba(244, 164, 23, 0.12)"
          opacity="0.7"
        />
        {/* Center dot (mesh node) */}
        <circle cx="20" cy="20" r="3" fill="#f4a417" opacity="0.9" />
        {/* Connection lines to vertices (mesh pattern) */}
        <line x1="20" y1="20" x2="20" y2="9" stroke="#f4a417" strokeWidth="0.8" opacity="0.5" />
        <line x1="20" y1="20" x2="28" y2="14" stroke="#f4a417" strokeWidth="0.8" opacity="0.5" />
        <line x1="20" y1="20" x2="28" y2="26" stroke="#f4a417" strokeWidth="0.8" opacity="0.5" />
        <line x1="20" y1="20" x2="20" y2="31" stroke="#f4a417" strokeWidth="0.8" opacity="0.5" />
        <line x1="20" y1="20" x2="12" y2="26" stroke="#f4a417" strokeWidth="0.8" opacity="0.5" />
        <line x1="20" y1="20" x2="12" y2="14" stroke="#f4a417" strokeWidth="0.8" opacity="0.5" />
        {/* Corner dots (mesh nodes) */}
        <circle cx="20" cy="9" r="1.5" fill="#f4a417" opacity="0.6" />
        <circle cx="28" cy="14" r="1.5" fill="#f4a417" opacity="0.6" />
        <circle cx="28" cy="26" r="1.5" fill="#f4a417" opacity="0.6" />
        <circle cx="20" cy="31" r="1.5" fill="#f4a417" opacity="0.6" />
        <circle cx="12" cy="26" r="1.5" fill="#f4a417" opacity="0.6" />
        <circle cx="12" cy="14" r="1.5" fill="#f4a417" opacity="0.6" />
      </svg>
    </div>
  )
}

// LIVE pulsing indicator
function LiveIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex items-center justify-center">
        <span className="w-2 h-2 rounded-full bg-[#3ddc97]" />
        <span className="absolute w-2 h-2 rounded-full bg-[#3ddc97] animate-ping opacity-75" />
      </span>
      <span
        className="text-[9px] font-bold font-mono tracking-widest"
        style={{ color: '#3ddc97' }}
      >
        LIVE
      </span>
    </div>
  )
}

export function NMSSidebar() {
  const {
    currentView,
    selectedTenant,
    sidebarCollapsed,
    alertCount,
    onlineRadios,
    totalRadios,
    setView,
    setTenant,
    toggleSidebar,
  } = useNMSStore()

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      toggleSidebar()
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [toggleSidebar])

  const handleNavClick = useCallback(
    (viewId: NMSView) => {
      setView(viewId)
    },
    [setView]
  )

  const handleTenantChange = useCallback(
    (value: string) => {
      setTenant(value)
    },
    [setTenant]
  )

  const collapsed = sidebarCollapsed || isMobile

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex flex-col gap-2 px-4 py-3 border-b border-[#1a2230]">
        <div className="flex items-center gap-3">
          <MeshLogo />
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: '#f4a417' }}>
                DOODLE LABS
              </span>
              <span className="text-xs font-semibold tracking-wider" style={{ color: '#e7ecf4' }}>
                FLEET NMS
              </span>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="flex items-center justify-between">
            <LiveIndicator />
            <span className="text-[10px] font-mono" style={{ color: '#4a5567' }}>
              v2.0
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.id
          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                'group relative flex items-center w-full rounded-md transition-all duration-150',
                collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
                isActive
                  ? 'bg-[#f4a417]/10 text-[#f4a417] border-l-2 border-[#f4a417]'
                  : 'text-[#6f7d93] hover:bg-[#161c27] hover:text-[#aeb8c8] border-l-2 border-transparent'
              )}
            >
              <Icon className={cn('flex-shrink-0', collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]')} />
              {!collapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}

              {/* Radio count badge */}
              {!collapsed && item.badge === 'radios' && (
                <span className="ml-auto flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#3ddc97]/10 text-[#3ddc97] border border-[#3ddc97]/20">
                    <Radio className="h-2.5 w-2.5" />
                    {onlineRadios}/{totalRadios}
                  </span>
                </span>
              )}

              {/* Alert count badge */}
              {item.badge === 'alerts' && alertCount > 0 && (
                <span
                  className={cn(
                    'flex items-center justify-center rounded-full text-[10px] font-mono font-bold bg-[#ff5470] text-white',
                    collapsed ? 'absolute -top-1 -right-1 h-4 w-4' : 'ml-auto h-5 min-w-[20px] px-1.5'
                  )}
                >
                  {alertCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Tenant Selector */}
      <div className="border-t border-[#1a2230] p-3">
        {!collapsed ? (
          <div className="space-y-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4a5567] px-1">
              Tenant
            </span>
            <Select value={selectedTenant} onValueChange={handleTenantChange}>
              <SelectTrigger className="w-full bg-[#11161f] border-[#222b39] text-[#aeb8c8] text-xs h-8 font-mono focus:ring-[#f4a417]/30 focus:border-[#f4a417]/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#161c27] border-[#2c3647]">
                {TENANTS.map((t) => (
                  <SelectItem
                    key={t.id}
                    value={t.id}
                    className="text-[#aeb8c8] focus:bg-[#1c2430] focus:text-[#e7ecf4] text-xs font-mono"
                  >
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center justify-center w-full py-2 rounded-md text-[#6f7d93] hover:bg-[#161c27] transition-colors">
                  <ChevronDown className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-[#161c27] border-[#2c3647] text-[#aeb8c8] text-xs">
                Tenant: {TENANTS.find((t) => t.id === selectedTenant)?.label}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center w-full h-10 border-t border-[#1a2230] text-[#4a5567] hover:text-[#aeb8c8] hover:bg-[#161c27] transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronsRight className="h-4 w-4" />
        ) : (
          <div className="flex items-center gap-2">
            <ChevronsLeft className="h-4 w-4" />
            <span className="text-xs">Collapse</span>
          </div>
        )}
      </button>
    </div>
  )

  // Render with tooltips when collapsed
  if (collapsed) {
    return (
      <TooltipProvider delayDuration={200}>
        <aside
          className={cn(
            'flex flex-col h-screen bg-[#0b0f16] border-r border-[#1a2230] transition-all duration-200 flex-shrink-0',
            'w-[60px]'
          )}
        >
          {navContent}
        </aside>
      </TooltipProvider>
    )
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-[#0b0f16] border-r border-[#1a2230] transition-all duration-200 flex-shrink-0',
        'w-[240px]'
      )}
    >
      {navContent}
    </aside>
  )
}
