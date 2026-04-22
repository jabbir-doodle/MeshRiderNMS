// =============================================================================
// Mesh Rider NMS — Real-Time Simulation Hook
// Task ID: t5 | Simulates real-time data fluctuations for demo purposes
// =============================================================================

'use client'

import { useState, useEffect, useCallback } from 'react'

export function useRealtimeSimulation() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, 3000) // Update every 3 seconds
    return () => clearInterval(interval)
  }, [])

  const fluctuate = useCallback(
    (base: number, variance: number): number => {
      const noise =
        Math.sin(tick * 0.7) * variance + Math.cos(tick * 1.3) * (variance * 0.5)
      return Math.round((base + noise) * 10) / 10
    },
    [tick]
  )

  return { tick, fluctuate }
}
