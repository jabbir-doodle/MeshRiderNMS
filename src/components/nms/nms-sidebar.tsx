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
    setSidebarCollapsed,
  } = useNMSStore()

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setSidebarCollapsed(mobile)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [setSidebarCollapsed])

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
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[#1a2230]">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#f4a417]/15 border border-[#f4a417]/30 flex-shrink-0">
          <span className="font-mono text-sm font-bold text-[#f4a417]">DL</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-semibold tracking-wider text-[#e7ecf4] uppercase">
              Fleet NMS
            </span>
            <span className="text-[10px] font-mono text-[#6f7d93] tracking-wide">
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
