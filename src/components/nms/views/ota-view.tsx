'use client';

import React, { useState, useMemo } from 'react';
import { otaCampaigns, radios } from '@/lib/nms-data/mock-data';
import type { OTACampaign, OTACampaignStatus, RadioState } from '@/lib/nms-data/mock-data';
import {
  COLORS, BG, TEXT, BORDER, STATUS_COLORS,
  StatusDot, StatusChip, ProgressBar, PanelHeader, Panel,
} from '../nms-utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CAMPAIGN_STATUS_LABELS: Record<OTACampaignStatus, string> = {
  active: 'ACTIVE',
  scheduled: 'SCHEDULED',
  done: 'DONE',
  paused: 'PAUSED',
  failed: 'FAILED',
};

type RadioOTAState = 'complete' | 'in-progress' | 'failed' | 'queued' | 'rollback';

interface RadioOTARow {
  radioId: number;
  callsign: string;
  site: string;
  state: RadioOTAState;
  stage: string;
  progress: number;
  started: string;
  finished: string;
  result: string;
}

// Generate per-radio OTA rows for a campaign
function generateOTARows(campaign: OTACampaign): RadioOTARow[] {
  const campaignRadios = radios.slice(0, campaign.total);
  const rows: RadioOTARow[] = [];
  const states: RadioOTAState[] = [];
  const completedCount = campaign.completed;
  const failedCount = campaign.failed;

  for (let i = 0; i < campaignRadios.length; i++) {
    if (i < completedCount) {
      states.push('complete');
    } else if (i < completedCount + failedCount) {
      states.push('failed');
    } else if (campaign.status === 'active') {
      if (i < completedCount + 3) {
        states.push('in-progress');
      } else {
        states.push('queued');
      }
    } else if (campaign.status === 'scheduled') {
      states.push('queued');
    } else if (campaign.status === 'failed') {
      if (i < completedCount) states.push('complete');
      else if (i < completedCount + failedCount) states.push('failed');
      else states.push('queued');
    } else {
      if (i < completedCount) states.push('complete');
      else if (i < completedCount + failedCount) states.push('failed');
      else states.push('rollback');
    }
  }

  const stages = ['canary', 'stage25', 'stage50', 'full'];
  const stageIndex = stages.indexOf(campaign.stage);
  // Use fixed NOW to avoid hydration mismatch
  const now = new Date(1745283200000);

  const detRand = (i: number) => Math.abs(Math.sin((i + 3) * 12.9898 + 78.233) * 43758.5453) % 1

  campaignRadios.forEach((r, i) => {
    const state = states[i];
    const sIdx = Math.min(stageIndex, stages.length - 1);
    const progress =
      state === 'complete' ? 100 :
      state === 'failed' ? Math.floor(20 + detRand(i) * 60) :
      state === 'in-progress' ? Math.floor(15 + detRand(i + 50) * 55) :
      state === 'rollback' ? 0 : 0;

    const minutesAgo = i * 3 + Math.floor(detRand(i + 100) * 5);
    const startH = Math.floor(((1745283200000 - (minutesAgo + 10) * 60000) % 86400000) / 3600000);
    const startM = Math.floor(((1745283200000 - (minutesAgo + 10) * 60000) % 3600000) / 60000);
    const started = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
    const finished = state === 'complete'
      ? (() => { const h = Math.floor(((1745283200000 - minutesAgo * 60000) % 86400000) / 3600000); const m = Math.floor(((1745283200000 - minutesAgo * 60000) % 3600000) / 60000); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; })()
      : state === 'failed'
      ? (() => { const h = Math.floor(((1745283200000 - (minutesAgo + 2) * 60000) % 86400000) / 3600000); const m = Math.floor(((1745283200000 - (minutesAgo + 2) * 60000) % 3600000) / 60000); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; })()
      : '—';

    const result =
      state === 'complete' ? 'Success' :
      state === 'failed' ? 'Timeout' :
      state === 'rollback' ? 'Rolled back' : '—';

    const stageLabel =
      state === 'queued' ? 'Queued' :
      state === 'in-progress' ? 'In Progress' :
      state === 'rollback' ? 'Rollback' :
      stages[sIdx].replace('stage', 'Stage ');

    rows.push({
      radioId: r.id,
      callsign: r.callsign,
      site: r.siteName,
      state,
      stage: stageLabel,
      progress,
      started,
      finished,
      result,
    });
  });

  return rows;
}

// ─── Campaign Statistics Strip ───────────────────────────────────────────────

function CampaignStatsStrip() {
  const total = otaCampaigns.length;
  const active = otaCampaigns.filter(c => c.status === 'active').length;
  const completed = otaCampaigns.filter(c => c.status === 'done').length;
  const failed = otaCampaigns.filter(c => c.status === 'failed').length;

  const stats = [
    { label: 'Total Campaigns', value: total, color: COLORS.amber },
    { label: 'Active', value: active, color: COLORS.ok },
    { label: 'Completed', value: completed, color: COLORS.cyan },
    { label: 'Failed', value: failed, color: COLORS.err },
  ];

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border p-3 transition-all duration-200 hover:scale-[1.02]"
          style={{
            backgroundColor: BG.card,
            borderColor: BORDER.default,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = stat.color + '40';
            e.currentTarget.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.02), 0 0 12px ${stat.color}15`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = BORDER.default;
            e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.02)';
          }}
        >
          <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: TEXT.tertiary }}>
            {stat.label}
          </div>
          <div
            className="text-xl font-bold tabular-nums leading-tight mt-1"
            style={{ color: stat.color }}
          >
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Stage Progress Bar (Visual step indicator) ──────────────────────────────

const STAGES = [
  { key: 'canary', label: 'Canary', pct: '10%', icon: '1' },
  { key: 'stage25', label: '25%', pct: '25%', icon: '2' },
  { key: 'stage50', label: '50%', pct: '50%', icon: '3' },
  { key: 'full', label: 'Full Rollout', pct: '100%', icon: '4' },
] as const;

type StageKey = typeof STAGES[number]['key'];

function getStageStatus(campaign: OTACampaign): Record<StageKey, 'complete' | 'in-progress' | 'queued'> {
  const stageOrder: StageKey[] = ['canary', 'stage25', 'stage50', 'full'];
  const currentIdx = stageOrder.indexOf(campaign.stage as StageKey);

  if (campaign.status === 'failed') {
    const result: Record<StageKey, 'complete' | 'in-progress' | 'queued'> = {
      canary: 'complete',
      stage25: currentIdx >= 1 ? 'complete' : 'queued',
      stage50: currentIdx >= 2 ? 'in-progress' : 'queued',
      full: 'queued',
    };
    return result;
  }

  if (campaign.status === 'done') {
    return {
      canary: 'complete',
      stage25: 'complete',
      stage50: 'complete',
      full: 'complete',
    };
  }

  if (campaign.status === 'scheduled') {
    return {
      canary: 'queued',
      stage25: 'queued',
      stage50: 'queued',
      full: 'queued',
    };
  }

  const result: Record<StageKey, 'complete' | 'in-progress' | 'queued'> = {
    canary: 'complete',
    stage25: 'complete',
    stage50: 'complete',
    full: 'queued',
  };

  for (let i = 0; i < 4; i++) {
    if (i < currentIdx) {
      result[stageOrder[i]] = 'complete';
    } else if (i === currentIdx) {
      result[stageOrder[i]] = 'in-progress';
    } else {
      result[stageOrder[i]] = 'queued';
    }
  }

  return result;
}

function StageProgressBar({ campaign }: { campaign: OTACampaign }) {
  const stageStatus = getStageStatus(campaign);

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-0">
      {STAGES.map((stage, idx) => {
        const status = stageStatus[stage.key];
        const isLast = idx === STAGES.length - 1;

        const circleColor = status === 'complete' ? COLORS.ok
          : status === 'in-progress' ? COLORS.amber
          : TEXT.muted;

        const lineColor = status === 'complete' ? COLORS.ok : BORDER.default;

        return (
          <div key={stage.key} className="flex flex-col sm:flex-row sm:items-center flex-1 sm:min-w-0">
            {/* Circle + label */}
            <div className="flex flex-row sm:flex-col items-center gap-2 sm:gap-1.5 flex-shrink-0" style={{ minWidth: 56 }}>
              <div
                className="flex items-center justify-center rounded-full transition-all duration-300"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: status === 'complete' ? COLORS.ok + '20'
                    : status === 'in-progress' ? COLORS.amber + '20'
                    : BG.input,
                  border: `2px solid ${circleColor}`,
                  boxShadow: status === 'in-progress' ? `0 0 12px ${COLORS.amber}30` : 'none',
                }}
              >
                {status === 'complete' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.ok} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="text-xs font-bold" style={{ color: circleColor }}>{stage.icon}</span>
                )}
              </div>
              <span className="text-[10px] font-medium text-center leading-tight" style={{
                color: status === 'queued' ? TEXT.muted : TEXT.primary,
              }}>
                {stage.label}
              </span>
            </div>

            {/* Connector line - vertical on mobile, horizontal on desktop */}
            {!isLast && (
              <div className="sm:flex-1 sm:flex sm:items-center sm:justify-center hidden sm:block" style={{ marginTop: -16 }}>
                <div
                  className="w-full max-w-[80px] h-1 rounded-full transition-all duration-500 hidden sm:block"
                  style={{
                    backgroundColor: lineColor,
                    opacity: status === 'complete' ? 0.8 : 0.3,
                  }}
                />
              </div>
            )}
            {!isLast && (
              <div className="flex sm:hidden justify-start ml-4 sm:ml-0 py-0.5">
                <div
                  className="w-1 h-4 rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: lineColor,
                    opacity: status === 'complete' ? 0.8 : 0.3,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Estimated Completion Time ───────────────────────────────────────────────

function EstimatedCompletion({ campaign }: { campaign: OTACampaign }) {
  if (campaign.status !== 'active') return null;

  const remaining = campaign.total - campaign.completed - campaign.failed;
  if (remaining <= 0) return null;

  // Mock estimate: ~3 min per radio for current stage
  const minutesPerRadio = 3;
  const estimatedMinutes = remaining * minutesPerRadio;
  const hours = Math.floor(estimatedMinutes / 60);
  const mins = estimatedMinutes % 60;

  const etaText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg mt-3"
      style={{
        backgroundColor: COLORS.amber + '08',
        border: `1px solid ${COLORS.amber}20`,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
      <span className="text-[11px]" style={{ color: TEXT.secondary }}>
        <span style={{ color: COLORS.amber }}>Est. completion:</span> {etaText} ({remaining} radios remaining)
      </span>
    </div>
  );
}

// ─── Per-Radio Progress Bar ──────────────────────────────────────────────────

function RadioProgressBar({
  progress,
  state,
  stage,
}: {
  progress: number;
  state: RadioOTAState;
  stage: string;
}) {
  const barColor =
    state === 'complete' ? COLORS.ok :
    state === 'in-progress' ? COLORS.amber :
    state === 'failed' ? COLORS.err :
    BORDER.default;

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div
        className="flex-1 rounded-full overflow-hidden h-2"
        style={{ backgroundColor: '#222b39' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progress}%`,
            backgroundColor: barColor,
            boxShadow: progress > 0 && progress < 100 ? `0 0 6px ${barColor}44` : 'none',
          }}
        />
      </div>
      <span className="text-[10px] tabular-nums font-mono min-w-[28px] text-right" style={{
        color: state === 'queued' ? TEXT.muted : barColor,
      }}>
        {progress}%
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OTAView() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(otaCampaigns[0].id);

  const selectedCampaign = useMemo(
    () => otaCampaigns.find(c => c.id === selectedCampaignId) ?? otaCampaigns[0],
    [selectedCampaignId]
  );

  const otaRows = useMemo(() => generateOTARows(selectedCampaign), [selectedCampaign]);

  return (
    <div className="p-4 lg:p-6 space-y-4 fade-in">
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold" style={{ color: TEXT.primary }}>OTA Campaigns</h1>
            <span
              className="inline-flex items-center justify-center rounded-full text-[10px] font-bold px-2 py-0.5"
              style={{ backgroundColor: COLORS.amber + '20', color: COLORS.amber, border: `1px solid ${COLORS.amber}30` }}
            >
              {otaCampaigns.length}
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: TEXT.tertiary }}>
            Delta updates · signed artifacts · A/B slot · auto rollback on health failure
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <OTAHeaderButton icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
            </svg>
          } label="Firmware Library" />
          <OTAHeaderButton primary icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="M12 5v14" />
            </svg>
          } label="New Campaign" />
        </div>
      </div>

      {/* ─── Campaign Statistics Strip ─────────────────────────────────── */}
      <CampaignStatsStrip />

      {/* ─── Two-Column Layout ──────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* ─── Left Column: Campaign List ──────────────────────────────── */}
        <div className="w-full lg:w-[420px] flex-shrink-0">
          <Panel header={<PanelHeader title="Campaigns" subtitle={`${otaCampaigns.length} total`} />} noPadding>
            <div className="max-h-[calc(100vh-240px)] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2c3647 transparent' }}>
              {otaCampaigns.map((campaign) => {
                const isSelected = campaign.id === selectedCampaignId;
                const progress = campaign.total > 0 ? Math.round((campaign.completed / campaign.total) * 100) : 0;

                return (
                  <button
                    key={campaign.id}
                    onClick={() => setSelectedCampaignId(campaign.id)}
                    className="w-full text-left p-4 transition-all duration-200 active:scale-[0.99]"
                    style={{
                      backgroundColor: isSelected ? BG.elevated : 'transparent',
                      borderLeft: isSelected ? `3px solid ${COLORS.amber}` : '3px solid transparent',
                      borderBottom: `1px solid ${BORDER.default}`,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.backgroundColor = BG.elevated; e.currentTarget.style.borderLeftColor = COLORS.amber + '40'; } }}
                    onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent'; } }}
                  >
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-2">
                      <StatusChip
                        status={campaign.status}
                        label={CAMPAIGN_STATUS_LABELS[campaign.status]}
                        size="sm"
                      />
                      <span className="text-[10px] font-mono" style={{ color: TEXT.muted }}>
                        {campaign.id}
                      </span>
                    </div>
                    {/* Name */}
                    <p className="text-sm font-medium mb-1" style={{ color: TEXT.primary }}>
                      {campaign.name}
                    </p>
                    {/* Progress */}
                    <div className="mb-2">
                      <ProgressBar
                        value={campaign.completed}
                        max={campaign.total}
                        color={campaign.failed > 0 ? COLORS.warn : COLORS.ok}
                        height={4}
                        showPercent
                      />
                    </div>
                    {/* Meta */}
                    <div className="flex items-center justify-between text-[10px]" style={{ color: TEXT.tertiary }}>
                      <span>{campaign.completed}/{campaign.total} done · {campaign.failed} failed</span>
                      <span>{campaign.owner}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* ─── Right Column: Campaign Detail ───────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Campaign Header */}
          <div className="rounded-lg border p-4" style={{
            backgroundColor: BG.card,
            borderColor: BORDER.default,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
          }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold" style={{ color: TEXT.primary }}>
                    {selectedCampaign.name}
                  </h2>
                  <StatusChip status={selectedCampaign.status} label={CAMPAIGN_STATUS_LABELS[selectedCampaign.status]} size="sm" />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: TEXT.secondary }}>
                  <span className="font-mono">FW: {selectedCampaign.firmware}</span>
                  <span>Owner: {selectedCampaign.owner}</span>
                  <span>Total targets: {selectedCampaign.total}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold tabular-nums" style={{ color: TEXT.primary }}>
                  {selectedCampaign.total > 0 ? Math.round((selectedCampaign.completed / selectedCampaign.total) * 100) : 0}%
                </div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: TEXT.tertiary }}>
                  Progress
                </div>
              </div>
            </div>
          </div>

          {/* Stage Progress (Visual step indicator) */}
          <Panel header={<PanelHeader title="Rollout Stages" subtitle="Progressive deployment pipeline" />}>
            <StageProgressBar campaign={selectedCampaign} />
            <EstimatedCompletion campaign={selectedCampaign} />
          </Panel>

          {/* Per-Radio Table */}
          <Panel
            header={
              <PanelHeader
                title="Per-Radio Status"
                subtitle={`${otaRows.length} targets`}
                right={
                  <div className="flex items-center gap-2">
                    <OTAAction icon={
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                      </svg>
                    } label="Pause" />
                    <OTAAction icon={
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                        <path d="M16 16h5v5" />
                      </svg>
                    } label="Retry Failed" />
                    <OTAAction icon={
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" x2="12" y1="15" y2="3" />
                      </svg>
                    } label="Export" />
                  </div>
                }
              />
            }
            noPadding
          >
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2c3647 transparent' }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ backgroundColor: BG.elevated }}>
                    <th className="text-left px-4 py-2.5 font-medium uppercase tracking-wider" style={{ color: TEXT.tertiary, width: 36 }}></th>
                    <th className="text-left px-4 py-2.5 font-medium uppercase tracking-wider" style={{ color: TEXT.tertiary }}>Radio</th>
                    <th className="text-left px-4 py-2.5 font-medium uppercase tracking-wider" style={{ color: TEXT.tertiary }}>Site</th>
                    <th className="text-left px-4 py-2.5 font-medium uppercase tracking-wider" style={{ color: TEXT.tertiary }}>Stage</th>
                    <th className="text-left px-4 py-2.5 font-medium uppercase tracking-wider" style={{ color: TEXT.tertiary }}>Progress</th>
                    <th className="text-left px-4 py-2.5 font-medium uppercase tracking-wider" style={{ color: TEXT.tertiary }}>Started</th>
                    <th className="text-left px-4 py-2.5 font-medium uppercase tracking-wider" style={{ color: TEXT.tertiary }}>Finished</th>
                    <th className="text-left px-4 py-2.5 font-medium uppercase tracking-wider" style={{ color: TEXT.tertiary }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {otaRows.map((row) => {
                    const dotColor =
                      row.state === 'complete' ? COLORS.ok :
                      row.state === 'in-progress' ? COLORS.amber :
                      row.state === 'failed' ? COLORS.err :
                      row.state === 'rollback' ? COLORS.info : TEXT.muted;

                    const resultColor =
                      row.result === 'Success' ? COLORS.ok :
                      row.result === 'Timeout' ? COLORS.err :
                      row.result === 'Rolled back' ? COLORS.info : TEXT.muted;

                    return (
                      <tr
                        key={row.radioId}
                        className="transition-all duration-200"
                        style={{ borderBottom: `1px solid ${BORDER.default}` }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = BG.elevated; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <td className="px-4 py-2">
                          <StatusDot
                            status={row.state === 'complete' ? 'online' : row.state === 'failed' ? 'error' : row.state === 'in-progress' ? 'degraded' : 'offline'}
                            size="sm"
                            pulse={false}
                          />
                        </td>
                        <td className="px-4 py-2 font-medium font-mono" style={{ color: TEXT.primary }}>
                          {row.callsign}
                        </td>
                        <td className="px-4 py-2" style={{ color: TEXT.secondary }}>
                          {row.site}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{
                              backgroundColor: dotColor + '15',
                              color: dotColor,
                            }}
                          >
                            {row.stage}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <RadioProgressBar
                            progress={row.progress}
                            state={row.state}
                            stage={row.stage}
                          />
                        </td>
                        <td className="px-4 py-2 font-mono tabular-nums" style={{ color: TEXT.secondary }}>
                          {row.started}
                        </td>
                        <td className="px-4 py-2 font-mono tabular-nums" style={{ color: TEXT.secondary }}>
                          {row.finished}
                        </td>
                        <td className="px-4 py-2">
                          <span className="font-medium" style={{ color: resultColor }}>
                            {row.result}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ─── OTA Header Button ───────────────────────────────────────────────────────

function OTAHeaderButton({
  label,
  icon,
  primary = false,
}: {
  label: string;
  icon: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all active:scale-[0.97]"
      style={{
        backgroundColor: primary ? COLORS.amber + '20' : BG.elevated,
        color: primary ? COLORS.amber : TEXT.secondary,
        border: `1px solid ${primary ? COLORS.amber + '40' : BORDER.default}`,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (primary) {
          e.currentTarget.style.backgroundColor = COLORS.amber + '30';
        } else {
          e.currentTarget.style.borderColor = BORDER.hover;
          e.currentTarget.style.color = TEXT.primary;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = primary ? COLORS.amber + '20' : BG.elevated;
        e.currentTarget.style.color = primary ? COLORS.amber : TEXT.secondary;
        e.currentTarget.style.borderColor = primary ? COLORS.amber + '40' : BORDER.default;
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── OTA Action Button (smaller) ─────────────────────────────────────────────

function OTAAction({
  label,
  icon,
}: {
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors active:scale-[0.97]"
      style={{
        backgroundColor: BG.input,
        color: TEXT.secondary,
        border: `1px solid ${BORDER.default}`,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = BORDER.hover;
        e.currentTarget.style.color = TEXT.primary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = BORDER.default;
        e.currentTarget.style.color = TEXT.secondary;
      }}
    >
      {icon}
      {label}
    </button>
  );
}
