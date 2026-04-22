'use client'

import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

/**
 * Returns false during SSR and true after mount.
 * Use this to prevent hydration mismatches from Date.now(), new Date(), etc.
 * Uses useSyncExternalStore for correct SSR/client behavior without useEffect.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,  // Client: always mounted
    () => false  // Server: not yet mounted
  )
}
