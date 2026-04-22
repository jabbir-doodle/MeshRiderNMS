// =============================================================================
// Mesh Rider Fleet NMS — Mock Data Layer
// Task ID: 2-a | Comprehensive in-memory mock data for all 8 screens
// =============================================================================

// ─── Type Definitions ───────────────────────────────────────────────────────

export type RadioState = 'online' | 'degraded' | 'offline' | 'error';
export type RadioFormFactor = 'Nano²' | 'Mini' | 'OEM' | 'Boost' | 'Wearable';
export type RadioBand = 'L-Band' | 'S-Band' | 'C-Band' | 'L+S Band' | 'L+S+C Band';
export type ConfigState = 'in-sync' | 'drift';
export type LinkQuality = 'ok' | 'warn' | 'err';
export type TenantStatus = 'active' | 'suspended';
export type OperatorStatus = 'active' | 'inactive';
export type OTACampaignStatus = 'active' | 'scheduled' | 'paused' | 'done' | 'failed';
export type OTACampaignStage = 'canary' | 'stage25' | 'stage50' | 'full';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type ActionType = 'ota' | 'config' | 'alert' | 'agent' | 'access' | 'system';
export type ChannelTone = 'ok' | 'warn' | 'err';
export type SpectrumEventSeverity = 'err' | 'warn' | 'info';

export interface Radio {
  id: number;
  callsign: string;
  mac: string;
  ip: string;
  state: RadioState;
  formFactor: RadioFormFactor;
  band: RadioBand;
  firmware: string;
  agentVersion: string;
  siteName: string;
  siteId: string;
  snr: number;
  throughput: number;
  txPower: number;
  cpu: number;
  temp: number;
  battery: number;
  uptime: string;
  lastSeen: string;
  configTemplate: string;
  configState: ConfigState;
  enrolled: string;
  certExpiry: string;
  lat: number;
  lng: number;
  neighbors: number;
}

export interface Link {
  id: number;
  radioA: number;
  radioB: number;
  snr: number;
  quality: LinkQuality;
  rxAvg: number;
  txAvg: number;
  retries: number;
}

export interface Tenant {
  id: string;
  name: string;
  type: string;
  radios: number;
  operators: number;
  status: TenantStatus;
}

export interface Operator {
  id: string;
  name: string;
  email: string;
  role: string;
  scope: string;
  mfa: string;
  lastActive: string;
  status: OperatorStatus;
  tenantId: string;
}

export interface OTACampaign {
  id: string;
  name: string;
  firmware: string;
  status: OTACampaignStatus;
  total: number;
  completed: number;
  failed: number;
  owner: string;
  createdAt: string;
  stage: OTACampaignStage;
}

export interface Alert {
  id: number;
  severity: AlertSeverity;
  title: string;
  description: string;
  site: string;
  timestamp: string;
  rule: string;
  scope: string;
  predicted: string;
  model: string;
  acknowledged: boolean;
}

export interface AuditEvent {
  id: number;
  timestamp: string;
  operator: string;
  action: string;
  actionType: ActionType;
  object: string;
  sourceIp: string;
}

export interface SpectrumPoint {
  frequency: number;
  power: number;
}

export interface ChannelUtilization {
  channel: number;
  frequency: string;
  utilization: number;
  tone: ChannelTone;
}

export interface SpectrumEvent {
  severity: SpectrumEventSeverity;
  frequency: string;
  description: string;
  site: string;
  duration: string;
}

// ─── Helper generators ──────────────────────────────────────────────────────

const siteMeta = [
  { name: 'Alpha', id: 'site-alpha', lat: 34.052, lng: -118.244 },
  { name: 'Bravo', id: 'site-bravo', lat: 34.064, lng: -118.298 },
  { name: 'Charlie', id: 'site-charlie', lat: 34.028, lng: -118.315 },
  { name: 'Delta', id: 'site-delta', lat: 34.085, lng: -118.195 },
  { name: 'Echo', id: 'site-echo', lat: 34.048, lng: -118.352 },
] as const;

const formFactors: RadioFormFactor[] = ['Nano²', 'Mini', 'OEM', 'Boost', 'Wearable'];
const bands: RadioBand[] = ['L-Band', 'S-Band', 'C-Band', 'L+S Band', 'L+S+C Band'];
const firmwareVersions = ['v4.2.1-stable', 'v4.2.0-stable', 'v4.1.8-stable', 'v4.3.0-rc1', 'v4.1.5-stable'];
const agentVersions = ['2.8.1', '2.8.0', '2.7.4', '2.9.0-rc1', '2.7.3'];
const configTemplates = ['mesh-default-v3', 'mesh-high-gain-v2', 'mesh-low-power-v1', 'mesh-backbone-v2', 'mesh-edge-v1'];
const states: RadioState[] = ['online', 'online', 'online', 'online', 'online', 'online', 'online', 'online', 'degraded', 'degraded', 'offline', 'error'];

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function macFromIndex(i: number): string {
  const base = 0xD0C7A0;
  const b0 = (base + Math.floor(i / 3)) & 0xFF;
  const b1 = (0x12 + i) & 0xFF;
  const b2 = (0x80 + (i * 7) & 0xFF);
  return [b0, b1, b2].map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(':') +
    ':AA:' + ((i * 3 + 0x10) & 0xFF).toString(16).toUpperCase().padStart(2, '0') +
    ':' + ((i * 5 + 0x20) & 0xFF).toString(16).toUpperCase().padStart(2, '0');
}

function ipFromIndex(i: number): string {
  const octet3 = 1 + Math.floor(i / 254);
  const octet4 = 100 + (i % 154);
  return `10.42.${octet3}.${octet4}`;
}

function generateUptime(days: number): string {
  const h = days * 24 + Math.floor(Math.random() * 12);
  if (h >= 48) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${Math.floor(Math.random() * 59)}m`;
}

function relativeTime(minutesAgo: number): string {
  const d = new Date(Date.now() - minutesAgo * 60_000);
  return d.toISOString();
}

// ─── Radios (24 units) ─────────────────────────────────────────────────────

export const radios: Radio[] = Array.from({ length: 24 }, (_, i) => {
  const siteIdx = i % 5;
  const site = siteMeta[siteIdx];
  const state = randomPick(states);
  const isOnline = state === 'online' || state === 'degraded';
  const letter = String.fromCharCode(65 + (i % 5));

  return {
    id: i + 1,
    callsign: `MR-${String(i + 1).padStart(3, '0')}-${letter}`,
    mac: macFromIndex(i),
    ip: ipFromIndex(i),
    state,
    formFactor: formFactors[i % formFactors.length],
    band: bands[i % bands.length],
    firmware: firmwareVersions[i % firmwareVersions.length],
    agentVersion: agentVersions[i % agentVersions.length],
    siteName: site.name,
    siteId: site.id,
    snr: isOnline ? Math.round(12 + Math.random() * 25) : state === 'degraded' ? Math.round(5 + Math.random() * 10) : 0,
    throughput: isOnline ? Math.round(20 + Math.random() * 180) : state === 'degraded' ? Math.round(5 + Math.random() * 30) : 0,
    txPower: isOnline ? Math.round(15 + Math.random() * 10) : 0,
    cpu: isOnline ? Math.round(15 + Math.random() * 60) : 0,
    temp: isOnline ? Math.round(38 + Math.random() * 22) : 25,
    battery: i < 6 ? Math.round(85 + Math.random() * 15) : 100,
    uptime: isOnline ? generateUptime(Math.floor(1 + Math.random() * 30)) : '0d 0h',
    lastSeen: isOnline ? relativeTime(Math.floor(Math.random() * 5)) : relativeTime(Math.floor(15 + Math.random() * 2880)),
    configTemplate: configTemplates[i % configTemplates.length],
    configState: Math.random() > 0.85 ? 'drift' : 'in-sync',
    enrolled: relativeTime(Math.floor(1440 * (5 + Math.random() * 60))),
    certExpiry: new Date(Date.now() + (180 + Math.floor(Math.random() * 365)) * 86400000).toISOString().split('T')[0],
    lat: site.lat + (Math.random() - 0.5) * 0.02,
    lng: site.lng + (Math.random() - 0.5) * 0.02,
    neighbors: isOnline ? Math.floor(2 + Math.random() * 6) : 0,
  };
});

// ─── Links (40+) ────────────────────────────────────────────────────────────

// Deterministic link generation: connect radios within same site and between adjacent sites
function generateLinks(): Link[] {
  const links: Link[] = [];
  let id = 1;

  // Intra-site links: connect radios within each site
  for (let s = 0; s < 5; s++) {
    const siteRadios = radios.filter(r => r.siteId === siteMeta[s].id && (r.state === 'online' || r.state === 'degraded'));
    for (let i = 0; i < siteRadios.length; i++) {
      for (let j = i + 1; j < siteRadios.length; j++) {
        const a = siteRadios[i];
        const b = siteRadios[j];
        const snr = Math.round(18 + Math.random() * 20);
        links.push({
          id: id++,
          radioA: a.id,
          radioB: b.id,
          snr,
          quality: snr > 25 ? 'ok' : snr > 15 ? 'warn' : 'err',
          rxAvg: Math.round(30 + Math.random() * 120),
          txAvg: Math.round(30 + Math.random() * 120),
          retries: Math.round(Math.random() * 5),
        });
      }
    }
  }

  // Inter-site links: connect between adjacent sites
  const adjacencies: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 3], [1, 4]];
  for (const [s1, s2] of adjacencies) {
    const siteA = radios.filter(r => r.siteId === siteMeta[s1].id && (r.state === 'online' || r.state === 'degraded'));
    const siteB = radios.filter(r => r.siteId === siteMeta[s2].id && (r.state === 'online' || r.state === 'degraded'));
    // Connect 1-2 pairs between sites
    const pairCount = 1 + Math.floor(Math.random() * 2);
    for (let p = 0; p < Math.min(pairCount, siteA.length, siteB.length); p++) {
      const snr = Math.round(10 + Math.random() * 18);
      links.push({
        id: id++,
        radioA: siteA[p].id,
        radioB: siteB[p].id,
        snr,
        quality: snr > 22 ? 'ok' : snr > 14 ? 'warn' : 'err',
        rxAvg: Math.round(15 + Math.random() * 80),
        txAvg: Math.round(15 + Math.random() * 80),
        retries: Math.round(Math.random() * 8),
      });
    }
  }

  return links;
}

export const links: Link[] = generateLinks();

// ─── Tenants (3) ────────────────────────────────────────────────────────────

export const tenants: Tenant[] = [
  {
    id: 'tenant-acme',
    name: 'Acme Industrial',
    type: 'Enterprise',
    radios: 10,
    operators: 3,
    status: 'active',
  },
  {
    id: 'tenant-defense',
    name: 'Defense Systems Inc',
    type: 'Government',
    radios: 8,
    operators: 3,
    status: 'active',
  },
  {
    id: 'tenant-pacific',
    name: 'Pacific Mining Corp',
    type: 'Industrial',
    radios: 6,
    operators: 2,
    status: 'active',
  },
];

// ─── Operators (8) ──────────────────────────────────────────────────────────

export const operators: Operator[] = [
  {
    id: 'op-001',
    name: 'Marcus Chen',
    email: 'marcus.chen@acme-industrial.com',
    role: 'Super Admin',
    scope: 'Global',
    mfa: 'TOTP',
    lastActive: relativeTime(2),
    status: 'active',
    tenantId: 'tenant-acme',
  },
  {
    id: 'op-002',
    name: 'Sarah Okonkwo',
    email: 'sarah.okonkwo@acme-industrial.com',
    role: 'Network Operator',
    scope: 'Alpha, Bravo',
    mfa: 'TOTP',
    lastActive: relativeTime(15),
    status: 'active',
    tenantId: 'tenant-acme',
  },
  {
    id: 'op-003',
    name: 'James Rivera',
    email: 'james.rivera@acme-industrial.com',
    role: 'Viewer',
    scope: 'Alpha',
    mfa: 'None',
    lastActive: relativeTime(1440),
    status: 'inactive',
    tenantId: 'tenant-acme',
  },
  {
    id: 'op-004',
    name: 'Col. Robert Harwell',
    email: 'r.harwell@defense-systems.mil',
    role: 'Super Admin',
    scope: 'Global',
    mfa: 'FIDO2',
    lastActive: relativeTime(5),
    status: 'active',
    tenantId: 'tenant-defense',
  },
  {
    id: 'op-005',
    name: 'Lt. Priya Sharma',
    email: 'p.sharma@defense-systems.mil',
    role: 'Network Operator',
    scope: 'Charlie, Delta',
    mfa: 'FIDO2',
    lastActive: relativeTime(30),
    status: 'active',
    tenantId: 'tenant-defense',
  },
  {
    id: 'op-006',
    name: 'SSG Tyler Brooks',
    email: 't.brooks@defense-systems.mil',
    role: 'Network Operator',
    scope: 'Echo',
    mfa: 'TOTP',
    lastActive: relativeTime(180),
    status: 'active',
    tenantId: 'tenant-defense',
  },
  {
    id: 'op-007',
    name: 'Kenji Tanaka',
    email: 'kenji.tanaka@pacific-mining.com',
    role: 'Super Admin',
    scope: 'Global',
    mfa: 'TOTP',
    lastActive: relativeTime(8),
    status: 'active',
    tenantId: 'tenant-pacific',
  },
  {
    id: 'op-008',
    name: 'Ana Vasquez',
    email: 'ana.vasquez@pacific-mining.com',
    role: 'Viewer',
    scope: 'Delta, Echo',
    mfa: 'None',
    lastActive: relativeTime(4320),
    status: 'inactive',
    tenantId: 'tenant-pacific',
  },
];

// ─── OTA Campaigns (5) ──────────────────────────────────────────────────────

export const otaCampaigns: OTACampaign[] = [
  {
    id: 'ota-001',
    name: 'Firmware v4.3.0 Staged Rollout',
    firmware: 'v4.3.0-rc1',
    status: 'active',
    total: 18,
    completed: 12,
    failed: 1,
    owner: 'Marcus Chen',
    createdAt: relativeTime(180),
    stage: 'stage50',
  },
  {
    id: 'ota-002',
    name: 'Agent v2.9.0 Canary Test',
    firmware: 'v2.9.0-rc1',
    status: 'active',
    total: 24,
    completed: 2,
    failed: 0,
    owner: 'Col. Robert Harwell',
    createdAt: relativeTime(60),
    stage: 'canary',
  },
  {
    id: 'ota-003',
    name: 'Security Patch v4.2.1-hotfix',
    firmware: 'v4.2.1-stable',
    status: 'done',
    total: 24,
    completed: 23,
    failed: 1,
    owner: 'Sarah Okonkwo',
    createdAt: relativeTime(4320),
    stage: 'full',
  },
  {
    id: 'ota-004',
    name: 'Config Template Sync v3',
    firmware: 'v4.2.0-stable',
    status: 'scheduled',
    total: 10,
    completed: 0,
    failed: 0,
    owner: 'Kenji Tanaka',
    createdAt: relativeTime(10),
    stage: 'canary',
  },
  {
    id: 'ota-005',
    name: 'Legacy Radio Deprecation',
    firmware: 'v4.1.5-stable',
    status: 'failed',
    total: 6,
    completed: 2,
    failed: 4,
    owner: 'Lt. Priya Sharma',
    createdAt: relativeTime(7200),
    stage: 'stage25',
  },
];

// ─── Alerts (12) ────────────────────────────────────────────────────────────

export const alerts: Alert[] = [
  {
    id: 1,
    severity: 'critical',
    title: 'Radio MR-009-D Offline — No Heartbeat',
    description: 'MR-009-D at Site Bravo has not responded for 45 minutes. Last seen 2025-01-15T08:32:00Z. Link quality degraded for 2 neighboring radios.',
    site: 'Bravo',
    timestamp: relativeTime(45),
    rule: 'radio.heartbeat.missed',
    scope: 'tenant-acme',
    predicted: 'Hardware failure — PSU indicator',
    model: 'anomaly-v3.1',
    acknowledged: false,
  },
  {
    id: 2,
    severity: 'critical',
    title: 'Possible Jamming Detected — Site Charlie',
    description: 'Broadband interference detected at 2.44 GHz with duty cycle >85%. Mesh throughput dropped 40% on 3 radio links. Source direction: SW sector.',
    site: 'Charlie',
    timestamp: relativeTime(12),
    rule: 'spectrum.jammer.detected',
    scope: 'tenant-defense',
    predicted: 'Hostile jamming — high confidence',
    model: 'spectrum-ml-v2.4',
    acknowledged: false,
  },
  {
    id: 3,
    severity: 'critical',
    title: 'CPU Thermal Throttle — MR-017-C',
    description: 'MR-017-C CPU temperature exceeded 72°C threshold. Throughput capped at 60%. Ambient temp elevated due to enclosure solar loading.',
    site: 'Delta',
    timestamp: relativeTime(22),
    rule: 'radio.cpu.thermal',
    scope: 'tenant-defense',
    predicted: 'Continued degradation 2-4h',
    model: 'thermal-v1.2',
    acknowledged: false,
  },
  {
    id: 4,
    severity: 'warning',
    title: 'Config Drift Detected — MR-014-A',
    description: 'MR-014-A running config differs from template mesh-high-gain-v2. Channel width mismatch: expected 40MHz, actual 20MHz.',
    site: 'Alpha',
    timestamp: relativeTime(120),
    rule: 'config.drift.detected',
    scope: 'tenant-acme',
    predicted: 'Manual override by operator',
    model: 'config-audit-v1.0',
    acknowledged: true,
  },
  {
    id: 5,
    severity: 'warning',
    title: 'SNR Degradation — Link MR-005→MR-006',
    description: 'SNR dropped from 28dB to 14dB over last 2 hours. Retries increased 340%. Possible antenna misalignment or fresnel zone obstruction.',
    site: 'Bravo',
    timestamp: relativeTime(95),
    rule: 'link.snr.degraded',
    scope: 'tenant-acme',
    predicted: 'Antenna shift from wind loading',
    model: 'link-predict-v2.1',
    acknowledged: false,
  },
  {
    id: 6,
    severity: 'warning',
    title: 'Certificate Expiring — 12 radios',
    description: '12 radios have TLS certificates expiring within 45 days. Renewal automation should trigger 14 days before expiry.',
    site: 'All Sites',
    timestamp: relativeTime(240),
    rule: 'security.cert.expiry',
    scope: 'global',
    predicted: 'Auto-renewal will handle 10 of 12',
    model: 'cert-tracker-v1.0',
    acknowledged: true,
  },
  {
    id: 7,
    severity: 'warning',
    title: 'Battery Low — MR-020-E (Wearable)',
    description: 'MR-020-E battery at 23%. Estimated 2.1 hours remaining. Charger not connected. Device is currently relaying 3 mesh hops.',
    site: 'Echo',
    timestamp: relativeTime(30),
    rule: 'radio.battery.low',
    scope: 'tenant-pacific',
    predicted: 'Will go offline ~14:30 UTC',
    model: 'battery-v1.1',
    acknowledged: false,
  },
  {
    id: 8,
    severity: 'warning',
    title: 'Firmware v4.1.5 EOL Warning',
    description: '6 radios on firmware v4.1.5-stable (EOL). No security patches after 2025-03-01. Schedule upgrade to v4.2.1+.',
    site: 'Echo, Delta',
    timestamp: relativeTime(1440),
    rule: 'firmware.eol.warning',
    scope: 'tenant-pacific',
    predicted: 'Security vulnerabilities after EOL date',
    model: 'firmware-lifecycle-v1.0',
    acknowledged: true,
  },
  {
    id: 9,
    severity: 'info',
    title: 'OTA Campaign ota-003 Completed',
    description: 'Security Patch v4.2.1-hotfix campaign completed. 23/24 radios updated successfully. 1 failure (MR-009-D offline).',
    site: 'All Sites',
    timestamp: relativeTime(2880),
    rule: 'ota.campaign.done',
    scope: 'global',
    predicted: 'N/A',
    model: 'N/A',
    acknowledged: true,
  },
  {
    id: 10,
    severity: 'info',
    title: 'New Radio Enrolled — MR-024-D',
    description: 'MR-024-D (Boost, L+S Band) enrolled at Site Delta. Assigned template mesh-backbone-v2. Config sync complete.',
    site: 'Delta',
    timestamp: relativeTime(600),
    rule: 'radio.enrolled',
    scope: 'tenant-defense',
    predicted: 'N/A',
    model: 'N/A',
    acknowledged: true,
  },
  {
    id: 11,
    severity: 'info',
    title: 'Scheduled Maintenance Window — 0200-0400 UTC',
    description: 'Network maintenance scheduled for tonight. Non-critical radio reboots at Site Alpha and Bravo. Expected downtime < 5 minutes per node.',
    site: 'Alpha, Bravo',
    timestamp: relativeTime(480),
    rule: 'maintenance.scheduled',
    scope: 'tenant-acme',
    predicted: 'N/A',
    model: 'N/A',
    acknowledged: true,
  },
  {
    id: 12,
    severity: 'info',
    title: 'Spectrum Scan Complete — All Clear',
    description: 'Automated spectrum scan at Site Alpha completed. No anomalous signals detected. Channel 11 utilization 34%.',
    site: 'Alpha',
    timestamp: relativeTime(180),
    rule: 'spectrum.scan.complete',
    scope: 'tenant-acme',
    predicted: 'N/A',
    model: 'N/A',
    acknowledged: true,
  },
];

// ─── Audit Events (20+) ────────────────────────────────────────────────────

export const auditEvents: AuditEvent[] = [
  { id: 1, timestamp: relativeTime(2), operator: 'Marcus Chen', action: 'Logged in via TOTP', actionType: 'access', object: 'session:marcus-chen', sourceIp: '10.42.1.50' },
  { id: 2, timestamp: relativeTime(5), operator: 'Col. Robert Harwell', action: 'Approved OTA campaign ota-002 canary', actionType: 'ota', object: 'ota-002', sourceIp: '10.42.2.10' },
  { id: 3, timestamp: relativeTime(8), operator: 'Kenji Tanaka', action: 'Logged in via TOTP', actionType: 'access', object: 'session:kenji-tanaka', sourceIp: '10.42.3.15' },
  { id: 4, timestamp: relativeTime(12), operator: 'System', action: 'Jamming alert auto-generated', actionType: 'alert', object: 'alert:2', sourceIp: '10.42.0.1' },
  { id: 5, timestamp: relativeTime(15), operator: 'Sarah Okonkwo', action: 'Logged in via TOTP', actionType: 'access', object: 'session:sarah-okonkwo', sourceIp: '10.42.1.55' },
  { id: 6, timestamp: relativeTime(20), operator: 'Marcus Chen', action: 'Acknowledge alert #3 — thermal throttle', actionType: 'alert', object: 'alert:3', sourceIp: '10.42.1.50' },
  { id: 7, timestamp: relativeTime(25), operator: 'Lt. Priya Sharma', action: 'Deployed config to MR-022-E', actionType: 'config', object: 'radio:MR-022-E', sourceIp: '10.42.2.30' },
  { id: 8, timestamp: relativeTime(30), operator: 'SSG Tyler Brooks', action: 'Viewed radio detail MR-020-E', actionType: 'access', object: 'radio:MR-020-E', sourceIp: '10.42.4.20' },
  { id: 9, timestamp: relativeTime(40), operator: 'Marcus Chen', action: 'Created OTA campaign ota-004', actionType: 'ota', object: 'ota-004', sourceIp: '10.42.1.50' },
  { id: 10, timestamp: relativeTime(50), operator: 'System', action: 'Agent heartbeat batch processed (23/24)', actionType: 'agent', object: 'system:heartbeat-batch', sourceIp: '10.42.0.1' },
  { id: 11, timestamp: relativeTime(60), operator: 'Col. Robert Harwell', action: 'Started OTA campaign ota-002', actionType: 'ota', object: 'ota-002', sourceIp: '10.42.2.10' },
  { id: 12, timestamp: relativeTime(75), operator: 'Sarah Okonkwo', action: 'Modified config template mesh-default-v3', actionType: 'config', object: 'template:mesh-default-v3', sourceIp: '10.42.1.55' },
  { id: 13, timestamp: relativeTime(90), operator: 'System', action: 'Config drift detected on MR-014-A', actionType: 'config', object: 'radio:MR-014-A', sourceIp: '10.42.0.1' },
  { id: 14, timestamp: relativeTime(100), operator: 'Lt. Priya Sharma', action: 'Triggered manual spectrum scan at Charlie', actionType: 'system', object: 'site-charlie:spectrum', sourceIp: '10.42.2.30' },
  { id: 15, timestamp: relativeTime(120), operator: 'Kenji Tanaka', action: 'Scheduled OTA campaign ota-004', actionType: 'ota', object: 'ota-004', sourceIp: '10.42.3.15' },
  { id: 16, timestamp: relativeTime(150), operator: 'Marcus Chen', action: 'Updated operator role for James Rivera', actionType: 'access', object: 'operator:op-003', sourceIp: '10.42.1.50' },
  { id: 17, timestamp: relativeTime(180), operator: 'Marcus Chen', action: 'Created OTA campaign ota-001', actionType: 'ota', object: 'ota-001', sourceIp: '10.42.1.50' },
  { id: 18, timestamp: relativeTime(200), operator: 'System', action: 'Certificate auto-renewal for MR-003-A', actionType: 'system', object: 'cert:MR-003-A', sourceIp: '10.42.0.1' },
  { id: 19, timestamp: relativeTime(240), operator: 'Sarah Okonkwo', action: 'Enrolled new radio MR-024-D', actionType: 'agent', object: 'radio:MR-024-D', sourceIp: '10.42.1.55' },
  { id: 20, timestamp: relativeTime(300), operator: 'Col. Robert Harwell', action: 'Exported audit log (30 days)', actionType: 'access', object: 'audit:export', sourceIp: '10.42.2.10' },
  { id: 21, timestamp: relativeTime(360), operator: 'System', action: 'Auto-scaled spectrum scan frequency at Delta', actionType: 'system', object: 'site-delta:spectrum', sourceIp: '10.42.0.1' },
  { id: 22, timestamp: relativeTime(420), operator: 'Kenji Tanaka', action: 'Acknowledge alert #6 — cert expiry', actionType: 'alert', object: 'alert:6', sourceIp: '10.42.3.15' },
  { id: 23, timestamp: relativeTime(480), operator: 'System', action: 'Maintenance window scheduled notification sent', actionType: 'system', object: 'maintenance:2025-01-16', sourceIp: '10.42.0.1' },
  { id: 24, timestamp: relativeTime(600), operator: 'Sarah Okonkwo', action: 'Config push to 4 radios at Site Alpha', actionType: 'config', object: 'batch:alpha-config-sync', sourceIp: '10.42.1.55' },
];

// ─── Spectrum Data (86 points: 2412–2484 MHz, 1 MHz steps) ─────────────────

function generateSpectrumData(): SpectrumPoint[] {
  const points: SpectrumPoint[] = [];
  const noiseFloor = -95;
  let lastPower = noiseFloor;

  for (let freq = 2412; freq <= 2484; freq++) {
    let power = noiseFloor + Math.random() * 8; // baseline noise

    // WiFi channel centers (1-14 in 2.4GHz)
    const wifiChannels = [
      { center: 2412, width: 22 }, // Channel 1
      { center: 2437, width: 22 }, // Channel 6
      { center: 2462, width: 22 }, // Channel 11
      { center: 2484, width: 22 }, // Channel 14 (Japan only)
    ];

    for (const ch of wifiChannels) {
      const dist = Math.abs(freq - ch.center);
      if (dist < ch.width / 2) {
        // Bell curve power distribution around channel center
        const shape = Math.exp(-(dist * dist) / (2 * 6 * 6));
        power += shape * (20 + Math.random() * 15);
      }
    }

    // Narrowband interference at 2450 MHz (Bluetooth)
    if (freq >= 2445 && freq <= 2455) {
      power += 12 + Math.random() * 5;
    }

    // Jammer signature: broad interference at 2440-2460 MHz
    if (freq >= 2440 && freq <= 2460) {
      power += 8 + Math.random() * 4;
    }

    // Smooth with previous point to avoid jitter
    power = power * 0.7 + lastPower * 0.3;
    lastPower = power;

    points.push({ frequency: freq, power: Math.round(power * 10) / 10 });
  }

  return points;
}

export const spectrumData: SpectrumPoint[] = generateSpectrumData();

// ─── Channel Utilization ────────────────────────────────────────────────────

export const channelUtilization: ChannelUtilization[] = [
  { channel: 1, frequency: '2412 MHz', utilization: 62, tone: 'warn' },
  { channel: 2, frequency: '2417 MHz', utilization: 28, tone: 'ok' },
  { channel: 3, frequency: '2422 MHz', utilization: 35, tone: 'ok' },
  { channel: 4, frequency: '2427 MHz', utilization: 41, tone: 'ok' },
  { channel: 5, frequency: '2432 MHz', utilization: 38, tone: 'ok' },
  { channel: 6, frequency: '2437 MHz', utilization: 71, tone: 'warn' },
  { channel: 7, frequency: '2442 MHz', utilization: 52, tone: 'ok' },
  { channel: 8, frequency: '2447 MHz', utilization: 48, tone: 'ok' },
  { channel: 9, frequency: '2452 MHz', utilization: 44, tone: 'ok' },
  { channel: 10, frequency: '2457 MHz', utilization: 39, tone: 'ok' },
  { channel: 11, frequency: '2462 MHz', utilization: 68, tone: 'warn' },
  { channel: 12, frequency: '2467 MHz', utilization: 31, tone: 'ok' },
  { channel: 13, frequency: '2472 MHz', utilization: 22, tone: 'ok' },
  { channel: 14, frequency: '2484 MHz', utilization: 15, tone: 'ok' },
];

// ─── Spectrum Events ────────────────────────────────────────────────────────

export const spectrumEvents: SpectrumEvent[] = [
  {
    severity: 'err',
    frequency: '2440–2460 MHz',
    description: 'Broadband interference detected — possible jammer. Duty cycle 85%, sweep rate 200Hz. Source direction: SW 225°.',
    site: 'Charlie',
    duration: '42 min (ongoing)',
  },
  {
    severity: 'warn',
    frequency: '2412 MHz (Ch 1)',
    description: 'High WiFi utilization — 3 SSIDs detected on channel 1. Mesh traffic competing with civilian devices.',
    site: 'Alpha',
    duration: 'Intermittent (last 4h)',
  },
  {
    severity: 'warn',
    frequency: '2437 MHz (Ch 6)',
    description: 'Enterprise AP broadcasting at high power (-12 dBm EIRP). Adjacent channel interference affecting channels 5-7.',
    site: 'Bravo',
    duration: 'Continuous (last 12h)',
  },
  {
    severity: 'warn',
    frequency: '2445–2455 MHz',
    description: 'Bluetooth Classic devices detected — frequency hopping pattern overlapping mesh channels. 4 device pairs counted.',
    site: 'Alpha',
    duration: 'Intermittent (last 2h)',
  },
  {
    severity: 'info',
    frequency: '2462 MHz (Ch 11)',
    description: 'Background WiFi traffic within normal bounds. No action required. Utilization tracking normal.',
    site: 'Delta',
    duration: 'Baseline',
  },
  {
    severity: 'info',
    frequency: '2484 MHz (Ch 14)',
    description: 'Legacy device detected on Ch 14 (Japan regulatory). Low power. Not affecting mesh operations.',
    site: 'Echo',
    duration: '15 min burst',
  },
];

// ─── KPI helpers ────────────────────────────────────────────────────────────

export function getRadioStats() {
  const online = radios.filter(r => r.state === 'online').length;
  const degraded = radios.filter(r => r.state === 'degraded').length;
  const offline = radios.filter(r => r.state === 'offline').length;
  const error = radios.filter(r => r.state === 'error').length;
  const avgSnr = Math.round(radios.filter(r => r.state !== 'offline').reduce((s, r) => s + r.snr, 0) / Math.max(1, radios.filter(r => r.state !== 'offline').length));
  const avgThroughput = Math.round(radios.filter(r => r.state !== 'offline').reduce((s, r) => s + r.throughput, 0) / Math.max(1, radios.filter(r => r.state !== 'offline').length));
  const avgCpu = Math.round(radios.filter(r => r.state !== 'offline').reduce((s, r) => s + r.cpu, 0) / Math.max(1, radios.filter(r => r.state !== 'offline').length));
  const avgTemp = Math.round(radios.filter(r => r.state !== 'offline').reduce((s, r) => s + r.temp, 0) / Math.max(1, radios.filter(r => r.state !== 'offline').length));

  return { total: radios.length, online, degraded, offline, error, avgSnr, avgThroughput, avgCpu, avgTemp };
}

export function getAlertStats() {
  const critical = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
  const warning = alerts.filter(a => a.severity === 'warning' && !a.acknowledged).length;
  const info = alerts.filter(a => a.severity === 'info' && !a.acknowledged).length;
  const total = alerts.length;
  const acked = alerts.filter(a => a.acknowledged).length;
  return { critical, warning, info, total, acked };
}

export function getLinkStats() {
  const ok = links.filter(l => l.quality === 'ok').length;
  const warn = links.filter(l => l.quality === 'warn').length;
  const err = links.filter(l => l.quality === 'err').length;
  const avgSnr = Math.round(links.reduce((s, l) => s + l.snr, 0) / Math.max(1, links.length));
  return { total: links.length, ok, warn, err, avgSnr };
}
