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

  // Fill states based on campaign progress
  for (let i = 0; i < campaignRadios.length; i++) {
    if (i < completedCount) {
      states.push('complete');
    } else if (i < completedCount + failedCount) {
      states.push('failed');
    } else if (campaign.status === 'active') {
      // A few in-progress, rest queued
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
      // done
      if (i < completedCount) states.push('complete');
      else if (i < completedCount + failedCount) states.push('failed');
      else states.push('rollback');
    }
  }

  const stages = ['canary', 'stage25', 'stage50', 'full'];
  const stageIndex = stages.indexOf(campaign.stage);
  const now = new Date();

  // Deterministic pseudo-random for hydration safety
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
    const started = new Date(now.getTime() - (minutesAgo + 10) * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const finished = state === 'complete'
      ? new Date(now.getTime() - minutesAgo * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      : state === 'failed'
      ? new Date(now.getTime() - (minutesAgo + 2) * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
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

// ─── Stage Progress Bar ──────────────────────────────────────────────────────

const STAGES = [
  { key: 'canary', label: 'Canary', pct: '10%', icon: '1' },
  { key: 'stage25', label: 'Stage 25%', pct: '25%', icon: '2' },
  { key: 'stage50', label: 'Stage 50%', pct: '50%', icon: '3' },
  { key: 'full', label: 'Full Rollout', pct: '100%', icon: '4' },
] as const;

type StageKey = typeof STAGES[number]['key'];

function getStageStatus(campaign: OTACampaign): Record<StageKey, 'complete' | 'in-progress' | 'queued'> {
  const stageOrder: StageKey[] = ['canary', 'stage25', 'stage50', 'full'];
  const currentIdx = stageOrder.indexOf(campaign.stage as StageKey);

  if (campaign.status === 'failed') {
    // Mark up to current stage as failed scenario
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

  // active or paused
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
    <div className="space-y-3">
      {STAGES.map((stage, idx) => {
        const status = stageStatus[stage.key];
        const isLast = idx === STAGES.length - 1;
        return (
          <div key={stage.key} className="flex items-center gap-3">
            {/* Connector line */}
            {!isLast && (
              <div className="flex flex-col items-center" style={{ width: 32 }}>
                <div
                  className="w-0.5 h-3"
                  style={{ backgroundColor: status === 'complete' ? COLORS.ok : BORDER.default }}
                />
              </div>
            )}
            {/* Circle / Check */}
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: 32,
                height: 32,
                backgroundColor: status === 'complete' ? COLORS.ok + '20' :
                  status === 'in-progress' ? COLORS.amber + '20' : BG.input,
                border: `1.5px solid ${status === 'complete' ? COLORS.ok : status === 'in-progress' ? COLORS.amber : BORDER.default}`,
              }}
            >
              {status === 'complete' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.ok} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : status === 'in-progress' ? (
                <span className="text-xs font-bold" style={{ color: COLORS.amber }}>{stage.icon}</span>
              ) : (
                <span className="text-xs font-medium" style={{ color: TEXT.muted }}>{stage.icon}</span>
              )}
            </div>
            {/* Label + status */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: status === 'queued' ? TEXT.tertiary : TEXT.primary }}>
                  {stage.label}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-medium" style={{
                  color: status === 'complete' ? COLORS.ok : status === 'in-progress' ? COLORS.amber : TEXT.muted,
                }}>
                  {status === 'complete' ? 'Complete' : status === 'in-progress' ? 'In Progress' : 'Queued'}
                </span>
              </div>
              {!isLast && (
                <div
                  className="w-full h-0.5 mt-1 rounded-full"
                  style={{ backgroundColor: status === 'complete' ? COLORS.ok + '40' : BORDER.default }}
                />
              )}
            </div>
          </div>
        );
      })}
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
    <div className="p-4 lg:p-6 space-y-4">
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
                    className="w-full text-left p-4 transition-colors"
                    style={{
                      backgroundColor: isSelected ? BG.elevated : 'transparent',
                      borderLeft: isSelected ? `3px solid ${COLORS.amber}` : '3px solid transparent',
                      borderBottom: `1px solid ${BORDER.default}`,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = BG.elevated; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
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
          <div className="rounded-lg border p-4" style={{ backgroundColor: BG.card, borderColor: BORDER.default }}>
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

          {/* Stage Progress */}
          <Panel header={<PanelHeader title="Rollout Stages" subtitle="Progressive deployment pipeline" />}>
            <StageProgressBar campaign={selectedCampaign} />
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

                    const progressColor =
                      row.state === 'complete' ? COLORS.ok :
                      row.state === 'in-progress' ? COLORS.amber :
                      row.state === 'failed' ? COLORS.err : BORDER.default;

                    const resultColor =
                      row.result === 'Success' ? COLORS.ok :
                      row.result === 'Timeout' ? COLORS.err :
                      row.result === 'Rolled back' ? COLORS.info : TEXT.muted;

                    return (
                      <tr
                        key={row.radioId}
                        className="transition-colors"
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
                          <div className="flex items-center gap-2">
                            <div className="w-16">
                              <ProgressBar
                                value={row.progress}
                                max={100}
                                color={progressColor}
                                height={3}
                              />
                            </div>
                            <span className="text-[10px] tabular-nums" style={{ color: TEXT.tertiary }}>
                              {row.progress}%
                            </span>
                          </div>
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
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
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
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors"
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
