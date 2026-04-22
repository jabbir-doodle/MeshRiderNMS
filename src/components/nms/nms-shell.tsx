'use client'

import React from 'react'
import { NMSLayout } from './nms-layout'
import { useNMSStore } from '@/lib/nms-data/store'
import FleetView from './views/fleet-view'
import TopologyView from './views/topology-view'
import RadioDetailView from './views/radio-detail-view'
import OTAView from './views/ota-view'
import SpectrumView from './views/spectrum-view'
import AlertsView from './views/alerts-view'
import AuditView from './views/audit-view'
import AccessView from './views/access-view'

/**
 * NMSShell — Main entry component for the Mesh Rider Fleet NMS.
 * Renders the layout shell and conditionally renders the correct
 * view component based on the active store view.
 */
export function NMSShell() {
  const { currentView } = useNMSStore()

  const viewComponent = (() => {
    switch (currentView) {
      case 'fleet':
        return <FleetView />
      case 'topology':
        return <TopologyView />
      case 'radio':
        return <RadioDetailView />
      case 'ota':
        return <OTAView />
      case 'spectrum':
        return <SpectrumView />
      case 'alerts':
        return <AlertsView />
      case 'audit':
        return <AuditView />
      case 'access':
        return <AccessView />
      default:
        return <FleetView />
    }
  })()

  return <NMSLayout>{viewComponent}</NMSLayout>
}
