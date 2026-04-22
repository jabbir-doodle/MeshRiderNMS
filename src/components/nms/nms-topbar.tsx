'use client'

import React, { useMemo, useState, useEffect } from 'react'
import {
  Search,
  Bell,
  ChevronRight,
  User,
  LogOut,
  Settings,
  Building2,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useNMSStore, type NMSView } from '@/lib/nms-data/store'
import { ConnectionStatus } from './connection-status'

const VIEW_LABELS: Record<NMSView, string> = {
  fleet: 'Mesh Rider Dashboard',
  topology: 'Network Topology',
  radio: 'Radio Detail',
  ota: 'OTA Campaigns',
  spectrum: 'Spectrum Intelligence',
  alerts: 'Alerts',
  audit: 'Audit Log',
  access: 'Access & Security',
}

const VIEW_BREADCRUMB_PARENTS: Record<NMSView, { label: string; view: NMSView } | null> = {
  fleet: null,
  topology: null,
  radio: { label: 'Dashboard', view: 'fleet' },
  ota: null,
  spectrum: null,
  alerts: null,
  audit: null,
  access: null,
}

const TENANT_LABELS: Record<string, string> = {
  'alpha-fleet': 'Alpha Fleet',
  'bravo-unit': 'Bravo Unit',
  'charlie-team': 'Charlie Team',
}

function UTCClock() {
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      const hours = String(now.getUTCHours()).padStart(2, '0')
      const minutes = String(now.getUTCMinutes()).padStart(2, '0')
      const seconds = String(now.getUTCSeconds()).padStart(2, '0')
      setTime(`${hours}:${minutes}:${seconds}`)
    }
    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#11161f] border border-[#222b39]">
      <Clock className="h-3.5 w-3.5" style={{ color: '#6f7d93' }} />
      <span className="text-[11px] font-mono" style={{ color: '#6f7d93' }}>UTC</span>
      <span className="text-xs font-mono font-medium tabular-nums" style={{ color: '#e7ecf4' }}>
        {time}
      </span>
    </div>
  )
}

export function NMSTopbar() {
  const { currentView, selectedTenant, selectedRadioId, alertCount, setView, selectRadio } =
    useNMSStore()

  const [searchFocused, setSearchFocused] = useState(false)

  const breadcrumbItems = useMemo(() => {
    const items: { label: string; view?: NMSView; isCurrent?: boolean }[] = []

    const parent = VIEW_BREADCRUMB_PARENTS[currentView]
    if (parent) {
      items.push({ label: parent.label, view: parent.view })
    }

    if (currentView === 'radio' && selectedRadioId !== null) {
      items.push({ label: 'Radio', view: 'fleet' })
      items.push({ label: `MR-${String(selectedRadioId).padStart(3, '0')}-A`, isCurrent: true })
    } else {
      items.push({ label: VIEW_LABELS[currentView], isCurrent: true })
    }

    return items
  }, [currentView, selectedRadioId])

  const tenantLabel = TENANT_LABELS[selectedTenant] ?? selectedTenant

  const handleBreadcrumbClick = (view: NMSView) => {
    if (view === 'fleet' && currentView === 'radio') {
      selectRadio(null)
    }
    setView(view)
  }

  return (
    <header className="relative flex items-center h-14 px-4 bg-[#0b0f16] border-b border-[#1a2230] gap-4 flex-shrink-0">
      {/* Bottom gradient line (amber glow) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #f4a41733 20%, #f4a41766 50%, #f4a41733 80%, transparent 100%)',
        }}
      />

      {/* Breadcrumb */}
      <Breadcrumb className="flex-shrink-0">
        <BreadcrumbList>
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={`${item.label}-${index}`}>
              {index > 0 && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3 w-3 text-[#4a5567]" />
                </BreadcrumbSeparator>
              )}
              <BreadcrumbItem>
                {item.isCurrent ? (
                  <BreadcrumbPage className="text-[#e7ecf4] text-sm font-medium">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    onClick={() => item.view && handleBreadcrumbClick(item.view)}
                    className="text-[#6f7d93] hover:text-[#aeb8c8] transition-colors cursor-pointer text-sm"
                  >
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Connection Status */}
      <ConnectionStatus />

      {/* Search */}
      <div className={cn(
        'relative hidden md:flex items-center w-64 lg:w-80 transition-all duration-200 rounded-md',
        searchFocused && 'ring-1',
      )}
        style={{
          ringColor: searchFocused ? 'rgba(244, 164, 23, 0.3)' : undefined,
          boxShadow: searchFocused
            ? '0 0 0 2px rgba(244, 164, 23, 0.2), 0 0 20px rgba(244, 164, 23, 0.06)'
            : 'none',
        }}
      >
        <Search
          className="absolute left-3 h-4 w-4 transition-colors duration-200"
          style={{ color: searchFocused ? '#f4a417' : '#4a5567' }}
        />
        <Input
          type="text"
          placeholder="Search radios, IPs, callsigns..."
          className="pl-9 pr-4 h-8 text-xs bg-[#11161f] text-[#aeb8c8] placeholder:text-[#4a5567] rounded-md font-mono transition-colors duration-200"
          style={{
            borderColor: searchFocused ? 'rgba(244, 164, 23, 0.5)' : '#222b39',
            boxShadow: 'none',
          }}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </div>

      {/* UTC Clock */}
      <UTCClock />

      {/* Tenant Indicator */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#11161f] border border-[#222b39]">
        <Building2 className="h-3.5 w-3.5 text-[#f4a417]" />
        <span className="text-xs font-mono text-[#aeb8c8]">{tenantLabel}</span>
      </div>

      {/* Notifications */}
      <button
        className="relative flex items-center justify-center w-8 h-8 rounded-md text-[#6f7d93] hover:text-[#aeb8c8] hover:bg-[#161c27] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {alertCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 w-4 rounded-full bg-[#ff5470] text-[10px] font-mono font-bold text-white animate-badge-bounce">
            {alertCount}
          </span>
        )}
      </button>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-md p-1 hover:bg-[#161c27] transition-all duration-200 cursor-pointer hover-ring">
            <Avatar className="h-7 w-7 ring-1 ring-transparent hover:ring-[#f4a41733] transition-all duration-200">
              <AvatarFallback className="bg-[#f4a417]/15 text-[#f4a417] text-[10px] font-mono font-bold border border-[#f4a417]/20">
                JB
              </AvatarFallback>
            </Avatar>
            <span className="hidden lg:block text-xs font-medium text-[#aeb8c8]">Jabbir</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 bg-[#161c27] border-[#2c3647] text-[#aeb8c8]"
        >
          <DropdownMenuLabel className="text-[#e7ecf4] text-xs font-mono">
            jabbir@doodlelabs.com
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[#222b39]" />
          <DropdownMenuGroup>
            <DropdownMenuItem className="text-[#aeb8c8] focus:bg-[#1c2430] focus:text-[#e7ecf4] cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[#aeb8c8] focus:bg-[#1c2430] focus:text-[#e7ecf4] cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Preferences
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="bg-[#222b39]" />
          <DropdownMenuItem className="text-[#ff5470] focus:bg-[#ff5470]/10 focus:text-[#ff5470] cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
