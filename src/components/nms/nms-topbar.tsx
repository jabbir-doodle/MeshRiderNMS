'use client'

import React, { useMemo, useState, useEffect, useRef } from 'react'
import {
  Search,
  Bell,
  ChevronRight,
  User,
  LogOut,
  Settings,
  Building2,
  Clock,
  CheckCheck,
  ArrowRight,
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
import { notifications } from '@/lib/nms-data/mock-data'
import type { Notification } from '@/lib/nms-data/mock-data'
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

// ─── Severity color map ────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ff5470',
  warning: '#f4a417',
  info: '#2dd4ff',
}

// ─── Time ago helper ───────────────────────────────────────────────────────

function timeAgo(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Notification Dropdown ─────────────────────────────────────────────────

function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [localNotifs, setLocalNotifs] = useState<Notification[]>(notifications)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = localNotifs.filter((n) => !n.read).length

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleMarkAllRead = () => {
    setLocalNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-8 h-8 rounded-md text-[#6f7d93] hover:text-[#aeb8c8] hover:bg-[#161c27] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[10px] font-mono font-bold text-white animate-badge-bounce"
            style={{ backgroundColor: '#ff5470' }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 z-50"
          style={{
            width: 360,
            maxHeight: 420,
            backgroundColor: 'rgba(17, 22, 31, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid #222b39',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(244, 164, 23, 0.05)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: '#222b39' }}
          >
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" style={{ color: '#f4a417' }} />
              <span className="text-sm font-semibold" style={{ color: '#e7ecf4' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold"
                  style={{ backgroundColor: '#ff547020', color: '#ff5470', border: '1px solid #ff547030' }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors"
                style={{ color: '#f4a417', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f4a41710' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div
            className="overflow-y-auto"
            style={{ maxHeight: 320, scrollbarWidth: 'thin', scrollbarColor: '#2c3647 transparent' }}
          >
            {localNotifs.map((notif, idx) => {
              const severityColor = SEVERITY_COLORS[notif.severity] || '#6f7d93'
              return (
                <div
                  key={notif.id}
                  className="flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer"
                  style={{
                    borderBottom: idx < localNotifs.length - 1 ? '1px solid #1a2230' : 'none',
                    backgroundColor: notif.read ? 'transparent' : 'rgba(244, 164, 23, 0.03)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1c2430' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = notif.read ? 'transparent' : 'rgba(244, 164, 23, 0.03)' }}
                  onClick={() => {
                    setLocalNotifs((prev) =>
                      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
                    )
                  }}
                >
                  {/* Severity dot */}
                  <div className="flex-shrink-0 mt-1">
                    <div
                      className="rounded-full"
                      style={{
                        width: 8,
                        height: 8,
                        backgroundColor: severityColor,
                        boxShadow: notif.read ? 'none' : `0 0 6px ${severityColor}80`,
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-xs font-medium truncate"
                        style={{ color: notif.read ? '#aeb8c8' : '#e7ecf4' }}
                      >
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <div
                          className="flex-shrink-0 rounded-full"
                          style={{ width: 6, height: 6, backgroundColor: '#f4a417' }}
                        />
                      )}
                    </div>
                    <p
                      className="text-[11px] mt-0.5 truncate"
                      style={{ color: '#6f7d93' }}
                    >
                      {notif.description}
                    </p>
                    <span
                      className="text-[10px] font-mono mt-1 block"
                      style={{ color: '#4a5567' }}
                    >
                      {timeAgo(notif.timestamp)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer — View All Alerts */}
          <div
            className="border-t"
            style={{ borderColor: '#222b39' }}
          >
            <ViewAllAlertsButton />
          </div>
        </div>
      )}
    </div>
  )
}

function ViewAllAlertsButton() {
  const { setView } = useNMSStore()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={() => setView('alerts')}
      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs font-medium transition-colors"
      style={{
        color: isHovered ? '#f4a417' : '#6f7d93',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      View All Alerts
      <ArrowRight
        className="h-3.5 w-3.5 transition-transform"
        style={{ transform: isHovered ? 'translateX(2px)' : 'none' }}
      />
    </button>
  )
}

// ─── Topbar ─────────────────────────────────────────────────────────────────

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

      {/* Notifications Dropdown */}
      <NotificationDropdown />

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
