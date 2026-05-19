export type TaskStatus =
  | 'Pending'
  | 'Ready'
  | 'InProgress'
  | 'WaitingOnChild'
  | 'Completed'
  | 'Failed'
  | 'Cancelled';

export const STATUS_MAP: Record<number, TaskStatus> = {
  950000010: 'Pending',
  950000020: 'Ready',
  950000030: 'InProgress',
  950000040: 'WaitingOnChild',
  950000050: 'Completed',
  950000060: 'Failed',
  950000070: 'Cancelled',
};

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  skillName: string;
  waveId: string;
  waveName: string;
  attempt: number;
  predecessorIds: string[];
  outputSummary?: string;
  modifiedOn: string;
  description?: string;
  type?: string;
  assigneeKind?: string;
  assigneeRole?: string;
  skillContext?: string;
  claimedAt?: string;
  completedAt?: string;
  checkpoint?: string;
  // When true, the agent has paused this step pending a human decision —
  // surfaces a pulsing "Awaiting decision" pill in the UI.
  awaitingUser?: boolean;
}

export interface Wave {
  id: string;
  name: string;
  description: string;
  status: string;
  projectId: string;
  taskCount: number;
  errorCount: number;
  phaseId?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  customerName?: string;
  products?: string;
  startDate?: string;
  targetGoLive?: string;
  scopeSummary?: string;
  autopilot?: boolean;
  sharepointUrl?: string;
  teamsChannelUrl?: string;
  foSandboxUrl?: string;
  dataverseUrl?: string;
  devopsUrl?: string;
}

export type PhaseStatus = 'NotStarted' | 'Active' | 'Completed';

export const PHASE_STATUS_MAP: Record<number, PhaseStatus> = {
  950000010: 'NotStarted',
  950000020: 'Active',
  950000030: 'Completed',
};

export interface Phase {
  id: string;
  name: string;
  description: string;
  order: number;
  status: PhaseStatus;
  projectId: string;
}

export type MemberRole = 'DA' | 'Consultant' | 'SME' | 'CustomerSponsor' | 'CustomerSME';

export const MEMBER_ROLE_MAP: Record<number, MemberRole> = {
  950000010: 'DA',
  950000020: 'Consultant',
  950000030: 'SME',
  950000040: 'CustomerSponsor',
  950000050: 'CustomerSME',
};

export interface ProjectMember {
  id: string;
  displayName: string;
  email: string;
  role: MemberRole;
  projectId: string;
}

export interface E2EProcess {
  id: string;
  name: string;
  bpcId: string;
  areas: string;
  modules: string;
  isInScope: boolean;
  projectId: string;
}

export type NavPage =
  | 'home'
  | 'process'
  | 'phases'
  | 'waves'
  | 'tasks'
  | 'customerData'
  | 'skills'
  | 'team'
  | 'watchdog'
  | 'settings';

export type CustomerDataSourceType = 'Seeded' | 'Uploaded' | 'Reference';

export interface CustomerDataFile {
  id: string;
  name: string;
  subject: string;
  body: string;
  sourceType: CustomerDataSourceType;
  fileType: string;
  mimeType: string;
  projectId: string;
  createdOn: string;
  modifiedOn: string;
  uploadedBy: string;
  truncated: boolean;
}

// ── Playbook ──

export type PlaybookLayer = 'Microsoft' | 'Partner' | 'Customer';

export const PLAYBOOK_LAYER_MAP: Record<number, PlaybookLayer> = {
  950000010: 'Microsoft',
  950000020: 'Partner',
  950000030: 'Customer',
};

export interface KzkPlaybook {
  id: string;
  name: string;
  displayName: string;
  description: string;
  publisher: string;
  layer: PlaybookLayer;
  iconEmoji: string;
  phases: string[];
  modulesCovered: string;
  scopeTrees: string;
  waveCount: number;
  taskCount: number;
  sortOrder: number;
  version?: string;
  // Optional per-playbook override for the call-to-action button label on
  // PlaybookCard. When omitted, the layer-based default from CTA_BY_LAYER is
  // used.
  ctaLabel?: string;
}

const CTA_BY_LAYER: Record<PlaybookLayer, string> = {
  Microsoft: 'Start with Documents →',
  Partner: 'Start Conversation →',
  Customer: 'Start your Journey →',
};

const CTA_COLOR_BY_LAYER: Record<PlaybookLayer, string> = {
  Microsoft: '#EA580C',
  Partner: '#EA580C',
  Customer: '#EA580C',
};

export function playbookCtaColor(layer: PlaybookLayer): string {
  return CTA_COLOR_BY_LAYER[layer] ?? '#8E8E93';
}

const ICON_BG_BY_LAYER: Record<PlaybookLayer, string> = {
  Microsoft: 'rgba(0,122,255,0.12)',
  Partner: 'rgba(48,209,88,0.12)',
  Customer: 'rgba(142,142,147,0.12)',
};

export function playbookIconBg(layer: PlaybookLayer): string {
  return ICON_BG_BY_LAYER[layer] ?? 'rgba(142,142,147,0.12)';
}

export function playbookCtaLabel(playbookOrLayer: KzkPlaybook | PlaybookLayer): string {
  if (typeof playbookOrLayer === 'object' && playbookOrLayer !== null) {
    if (playbookOrLayer.ctaLabel) return playbookOrLayer.ctaLabel;
    return CTA_BY_LAYER[playbookOrLayer.layer] ?? 'Get Started';
  }
  return CTA_BY_LAYER[playbookOrLayer] ?? 'Get Started';
}

export function playbookE2ECount(scopeTrees: string): number {
  if (!scopeTrees) return 0;
  const trimmed = scopeTrees.trim();
  if (!trimmed) return 0;
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.length;
      if (parsed && typeof parsed === 'object') {
        const record = parsed as Record<string, unknown>;
        if (Array.isArray(record.selectedL1)) return record.selectedL1.length;
        if (typeof record.process === 'string' && record.process.trim()) return 1;
      }
    } catch {
      // Fall through to comma-delimited legacy format.
    }
  }
  return trimmed.split(',').filter(s => s.trim().length > 0).length;
}

// ── Playbook previews (Setup flow) ──

export interface PlaybookTaskPreview {
  id: string;
  title: string;
  assigneeKind: 'Worker' | 'Role';
  assigneeRole?: string;
  skillName?: string;
  dependsOn: string[];
}

export interface PlaybookWavePreview {
  id: string;
  name: string;
  phaseLabel: string;
  tasks: PlaybookTaskPreview[];
  gateRequirements?: string[];
}

export interface TeamMemberDraft {
  id: string;
  displayName: string;
  email: string;
  role: MemberRole;
  isCurrentUser?: boolean;
}

export interface ProjectSetupData {
  projectName: string;
  customerName: string;
  products: string;
  targetGoLive: string;
  foSandboxUrl: string;
  goals: string[];
  team: TeamMemberDraft[];
  selectedE2Es: string[];
  playbook: KzkPlaybook;
}

// E2E phase progression (DA quality status per E2E)
export type E2EPhase =
  | 'Kick-off'
  | 'Collect'
  | 'Ingest & Clarify'
  | 'Configure'
  | 'Test'
  | 'Go-Live'
  | 'Complete';

export const E2E_PHASE_ORDER: readonly E2EPhase[] = [
  'Kick-off',
  'Collect',
  'Ingest & Clarify',
  'Configure',
  'Test',
  'Go-Live',
  'Complete',
] as const;

export const E2E_PHASE_MAP: Record<number, E2EPhase> = {
  950000010: 'Kick-off',
  950000020: 'Collect',
  950000030: 'Ingest & Clarify',
  950000040: 'Configure',
  950000050: 'Test',
  950000060: 'Go-Live',
  950000070: 'Complete',
};

// Gate requirement item (parsed from JSON)
export interface GateRequirement {
  label: string;
  met: boolean;
}

// ── WatchDog Schedules ──

export type WatchdogScheduleStatus = 'Success' | 'Failed' | 'Running';

export const WATCHDOG_STATUS_MAP: Record<number, WatchdogScheduleStatus> = {
  950000010: 'Success',
  950000020: 'Failed',
  950000030: 'Running',
};

export interface WatchdogSchedule {
  id: string;
  name: string;
  cronExpression: string;
  skillName: string;
  projectId?: string;
  promptText: string;
  toolsAllowed: string;
  enabled: boolean;
  lastRunTime?: string;
  lastStatus?: WatchdogScheduleStatus;
}

// Gate (derived from task/wave data until kzk_gate table exists)
export interface KzkGate {
  kzk_gateid: string;
  kzk_name: string;
  kzk_waveid: string;
  kzk_projectid: string;
  kzk_outcome: 'Open' | 'Pass' | 'Conditional' | 'Fail';
  kzk_requiredjson: string;
  kzk_passedat?: string;
  kzk_passedby?: string;
}

// Activity feed entry with icon support
export interface ActivityFeedEntry {
  id: string;
  icon: '🤖' | '✓' | '📋' | '▶' | '✗';
  taskId: string;
  message: string;
  timestamp: string;
}
