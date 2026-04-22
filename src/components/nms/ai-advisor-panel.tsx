'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: number;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

const QUICK_ACTIONS = [
  { label: 'Analyze fleet health', message: 'Analyze the overall health of my 24-radio fleet. Show me a summary of any degraded or offline radios and their sites.' },
  { label: 'Check for anomalies', message: 'Check for any anomalies or unusual patterns in the fleet — signal degradation, unusual traffic, config drift, or potential security concerns.' },
  { label: 'Optimize routing', message: 'Suggest mesh routing optimizations for better throughput and lower latency across the 5 sites. Which links need attention?' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function AIAdvisorPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const msgIdRef = useRef(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Close panel on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: ++msgIdRef.current,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/nms/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          context: '24 Mesh Rider radios, 5 sites (Alpha/Bravo/Charlie/Delta/Echo)',
        }),
      });

      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: ++msgIdRef.current,
        role: 'ai',
        content: data.reply || 'No response received.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: ChatMessage = {
        id: ++msgIdRef.current,
        role: 'ai',
        content: 'Network error — unable to reach the AI advisor service. Check your connection and try again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuickAction = (action: (typeof QUICK_ACTIONS)[number]) => {
    sendMessage(action.message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const unreadCount = 0; // No unread messages in chat

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 focus:outline-none"
        style={{
          width: 48,
          height: 48,
          background: 'linear-gradient(135deg, #f4a417 0%, #e08a00 100%)',
          boxShadow: '0 4px 20px rgba(244, 164, 23, 0.35)',
        }}
        aria-label="Open AI Advisor"
      >
        {/* Pulse ring animation */}
        {!isOpen && (
          <span
            className="absolute rounded-full animate-ping"
            style={{
              width: 48,
              height: 48,
              backgroundColor: 'rgba(244, 164, 23, 0.3)',
              animationDuration: '2s',
            }}
          />
        )}
        {/* Brain/sparkle icon */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative z-10"
        >
          <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" />
          <path d="M12 8v4" />
          <path d="M8 14h8" />
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M6 12a6 6 0 0 0 12 0" />
          <path d="M3.5 8.5l3-1" />
          <path d="M20.5 8.5l-3-1" />
          <path d="M5 16l2.5-1" />
          <path d="M19 16l-2.5-1" />
          {/* Sparkle dots */}
          <circle cx="20" cy="4" r="1" fill="white" stroke="none" />
          <circle cx="18" cy="7" r="0.5" fill="white" stroke="none" />
        </svg>
        {/* Unread badge (currently 0) */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center rounded-full font-mono font-bold text-white animate-badge-bounce"
            style={{ width: 18, height: 18, fontSize: 10, backgroundColor: '#ff5470' }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide-in Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: isOpen ? 0 : -400,
          bottom: 0,
          zIndex: 60,
          transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        {/* Backdrop */}
        {isOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(7, 9, 13, 0.5)',
            }}
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Panel */}
        <div
          ref={panelRef}
          className="flex flex-col h-full"
          style={{
            width: 380,
            marginLeft: 'auto',
            backgroundColor: 'rgba(17, 22, 31, 0.92)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid #222b39',
            boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* ─── Header ──────────────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
            style={{ borderColor: '#222b39' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #f4a41722, #f4a41711)', border: '1px solid #f4a41733' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f4a417" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" />
                  <path d="M6 12a6 6 0 0 0 12 0" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: '#e7ecf4' }}>AI Network Advisor</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#3ddc97' }} />
                  <span className="text-[10px] font-mono" style={{ color: '#6f7d93' }}>Online · Mesh Rider AI</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center rounded-md transition-colors"
              style={{ width: 28, height: 28, color: '#6f7d93', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1c2430'; e.currentTarget.style.color = '#e7ecf4'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6f7d93'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {/* ─── Quick Actions ───────────────────────────────────────────── */}
          {messages.length === 0 && !isLoading && (
            <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: '#222b39' }}>
              <p className="text-[10px] uppercase tracking-wider font-medium mb-2" style={{ color: '#6f7d93' }}>
                Quick Actions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action)}
                    className="px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all"
                    style={{
                      backgroundColor: '#1c2430',
                      color: '#aeb8c8',
                      border: '1px solid #2c3647',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#f4a41766';
                      e.currentTarget.style.color = '#f4a417';
                      e.currentTarget.style.backgroundColor = '#f4a41710';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#2c3647';
                      e.currentTarget.style.color = '#aeb8c8';
                      e.currentTarget.style.backgroundColor = '#1c2430';
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Messages Area ───────────────────────────────────────────── */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#2c3647 transparent' }}
          >
            {/* Welcome message when empty */}
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div
                  className="flex items-center justify-center rounded-2xl mb-3"
                  style={{ width: 56, height: 56, backgroundColor: '#f4a41710', border: '1px solid #f4a41722' }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f4a417" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" />
                    <path d="M12 8v4" /><path d="M8 14h8" /><path d="M9 18h6" />
                    <path d="M6 12a6 6 0 0 0 12 0" />
                  </svg>
                </div>
                <p className="text-sm font-medium" style={{ color: '#e7ecf4' }}>Mesh Rider AI Advisor</p>
                <p className="text-xs mt-1 max-w-[260px]" style={{ color: '#6f7d93', lineHeight: '1.5' }}>
                  Ask about fleet health, routing optimization, anomaly detection, or any operational question.
                </p>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="flex flex-col"
                style={{ alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
              >
                {/* AI badge */}
                {msg.role === 'ai' && (
                  <span
                    className="inline-flex items-center gap-1 mb-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium uppercase tracking-wider"
                    style={{ backgroundColor: '#f4a41718', color: '#f4a417', border: '1px solid #f4a41730' }}
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" />
                      <path d="M6 12a6 6 0 0 0 12 0" />
                    </svg>
                    AI
                  </span>
                )}
                {/* Message bubble */}
                <div
                  className="max-w-[300px] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed"
                  style={{
                    backgroundColor: msg.role === 'user' ? '#f4a417' : '#1c2430',
                    color: msg.role === 'user' ? '#07090d' : '#c8d0dc',
                    border: msg.role === 'user' ? 'none' : '1px solid #2c3647',
                    borderTopRightRadius: msg.role === 'user' ? 4 : 12,
                    borderTopLeftRadius: msg.role === 'ai' ? 4 : 12,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.content}
                </div>
                <span className="text-[9px] mt-0.5 font-mono" style={{ color: '#4a5567' }}>
                  {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>
            ))}

            {/* Loading / typing indicator */}
            {isLoading && (
              <div className="flex flex-col" style={{ alignItems: 'flex-start' }}>
                <span
                  className="inline-flex items-center gap-1 mb-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium uppercase tracking-wider"
                  style={{ backgroundColor: '#f4a41718', color: '#f4a417', border: '1px solid #f4a41730' }}
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" />
                    <path d="M6 12a6 6 0 0 0 12 0" />
                  </svg>
                  AI
                </span>
                <div
                  className="px-4 py-3 rounded-xl"
                  style={{ backgroundColor: '#1c2430', border: '1px solid #2c3647', borderTopLeftRadius: 4 }}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: '#f4a417', animation: 'advisorTyping 1.4s ease-in-out infinite' }}
                    />
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: '#f4a417', animation: 'advisorTyping 1.4s ease-in-out 0.2s infinite' }}
                    />
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: '#f4a417', animation: 'advisorTyping 1.4s ease-in-out 0.4s infinite' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* ─── Input Area ──────────────────────────────────────────────── */}
          <div
            className="px-4 py-3 border-t flex-shrink-0"
            style={{ borderColor: '#222b39' }}
          >
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your fleet..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium outline-none transition-all"
                style={{
                  backgroundColor: '#11161f',
                  color: '#e7ecf4',
                  border: '1px solid #2c3647',
                  placeholderColor: '#4a5567',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#f4a41766'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(244, 164, 23, 0.15)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#2c3647'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="flex items-center justify-center rounded-lg transition-all"
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: inputValue.trim() && !isLoading ? '#f4a417' : '#1c2430',
                  color: inputValue.trim() && !isLoading ? '#07090d' : '#4a5567',
                  border: inputValue.trim() && !isLoading ? 'none' : '1px solid #2c3647',
                  cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 7-7 7 7" /><path d="M12 19V5" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Typing animation keyframes injected once */}
      <style>{`
        @keyframes advisorTyping {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </>
  );
}
