'use client'

import React, { useState, useEffect } from 'react'
import { useNMSStore } from '@/lib/nms-data/store'

export function ConnectionStatus() {
  const { onlineRadios, totalRadios } = useNMSStore()
  const [connected, setConnected] = useState(true)

  // Simulate periodic connection check
  useEffect(() => {
    const interval = setInterval(() => {
      setConnected(true)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border"
      style={{
        backgroundColor: connected ? 'rgba(61, 220, 151, 0.06)' : 'rgba(255, 84, 112, 0.06)',
        borderColor: connected ? 'rgba(61, 220, 151, 0.2)' : 'rgba(255, 84, 112, 0.2)',
      }}
    >
      {/* Animated pulse indicator */}
      <span className="relative flex items-center justify-center">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: connected ? '#3ddc97' : '#ff5470' }}
        />
        <span
          className="absolute w-2 h-2 rounded-full animate-ping"
          style={{
            backgroundColor: connected ? '#3ddc97' : '#ff5470',
            opacity: 0,
            animation: 'connectionPulse 2s cubic-bezier(0, 0, 0.2, 1) infinite',
          }}
        />
      </span>
      <span
        className="text-[11px] font-mono font-medium tracking-wide"
        style={{ color: connected ? '#3ddc97' : '#ff5470' }}
      >
        {connected ? 'CONNECTED' : 'DISCONNECTED'}
        <span style={{ color: '#6f7d93' }}> · </span>
        <span style={{ color: '#aeb8c8' }}>
          {onlineRadios}/{totalRadios} NODES
        </span>
      </span>
      <style jsx>{`
        @keyframes connectionPulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          70% {
            transform: scale(2.5);
            opacity: 0;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
