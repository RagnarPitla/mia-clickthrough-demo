import type { Task, Wave, Project, Phase, E2EProcess, ProjectMember, KzkPlaybook, WatchdogSchedule, CustomerDataFile, CustomerDataSourceType } from '../types/domain';
import { STATUS_MAP, PHASE_STATUS_MAP, MEMBER_ROLE_MAP, PLAYBOOK_LAYER_MAP, WATCHDOG_STATUS_MAP } from '../types/domain';
import { Kzk_tasksService } from '../generated/services/Kzk_tasksService';
import { Kzk_wavesService } from '../generated/services/Kzk_wavesService';
import { Kzk_projectsService } from '../generated/services/Kzk_projectsService';
import { Kzk_taskdependenciesService } from '../generated/services/Kzk_taskdependenciesService';
import { Kzk_phasesService } from '../generated/services/Kzk_phasesService';
import { Kzk_e2eprocessesService } from '../generated/services/Kzk_e2eprocessesService';
import { Kzk_projectmembersService } from '../generated/services/Kzk_projectmembersService';
import { Kzk_playbooksService } from '../generated/services/Kzk_playbooksService';
import { Kzk_skillsService } from '../generated/services/Kzk_skillsService';
import { timed } from '../hooks/usePerfLog';
import { isDemoModeCached } from './demoBootstrap';

const TASK_TYPE_MAP: Record<number, string> = {
  950000010: 'Discovery', 950000020: 'Design Decision', 950000030: 'Configuration',
  950000040: 'Approval', 950000050: 'Data Migration', 950000060: 'Test',
  950000070: 'Review', 950000080: 'Documentation',
};
const ASSIGNEE_KIND_MAP: Record<number, string> = { 950000010: 'Worker', 950000020: 'Role' };
const ASSIGNEE_ROLE_MAP: Record<number, string> = { 950000010: 'DA', 950000020: 'Consultant', 950000030: 'SME' };
const CUSTOMER_DATA_UPLOAD_PREFIX = 'Customer data upload:';
const MAMAMIA8_DATA_PACK_PREFIX = 'Mamamia8 data pack:';
const MAX_CUSTOMER_DATA_BODY_CHARS = 95000;

const LOCAL_TIMEOUT_MS = 4000;
const LOCAL_PROJECT_ID = 'a1f26465-52c2-5730-94cd-dcd632501803';
const LOCAL_WAVE_ID = 'dda362e8-fefa-5e48-ad93-09550d509973';

const LOCAL_PROJECTS: Project[] = [{
  id: LOCAL_PROJECT_ID,
  name: 'Zava Agentic Retailer - R2R Foundation',
  description: 'Read-only local preview of the seeded Zava Record-to-Report implementation wave.',
  customerName: 'Zava Agentic Retailer',
  products: 'Dynamics 365 Finance, Dynamics 365 Supply Chain Management',
  startDate: '2026-01-15',
  targetGoLive: '2026-06-30',
  scopeSummary: 'Customer-driven Record to Report foundation wave for ZAUS, ZAUK, and ZAIN. Covers GAB prerequisites, legal entities, fiscal calendar, ZA-GLOBAL chart of accounts, dimensions, ledgers, bank, tax, opening balances, and validation.',
  autopilot: true,
  foSandboxUrl: 'https://d365commerce.sandbox.operations.dynamics.com',
  dataverseUrl: 'https://project-kazuki-rag.crm.dynamics.com',
}];

const LOCAL_PHASES: Phase[] = [
  { id: 'local-phase-foundation', name: 'R2R Foundation', description: 'GAB, legal entities, fiscal calendar, currencies', order: 1, status: 'Active', projectId: LOCAL_PROJECT_ID },
  { id: 'local-phase-coa', name: 'Chart of Accounts and Dimensions', description: 'COA, main accounts, financial dimensions, account structures', order: 2, status: 'NotStarted', projectId: LOCAL_PROJECT_ID },
  { id: 'local-phase-ledger', name: 'Ledger Operations', description: 'Ledger assignment, journals, posting profiles, bank, budget, consolidation', order: 3, status: 'NotStarted', projectId: LOCAL_PROJECT_ID },
  { id: 'local-phase-migration', name: 'Opening Balances', description: 'Legacy trial balance mapping and opening balance journal', order: 4, status: 'NotStarted', projectId: LOCAL_PROJECT_ID },
  { id: 'local-phase-validation', name: 'Validation and Signoff', description: 'Trial balance, financial reports, close readiness, signoff', order: 5, status: 'NotStarted', projectId: LOCAL_PROJECT_ID },
];

const LOCAL_PROCESSES: E2EProcess[] = [
  {
    id: 'local-process-r2r',
    name: '90 Record to Report',
    bpcId: '90',
    areas: 'Configure GAB; company structure; fiscal calendar; posting policies; chart of accounts; budgeting; currency; banking; costing; asset policies; tax',
    modules: 'General ledger, Cash and bank management, Tax, Budgeting, Consolidation',
    isInScope: true,
    projectId: LOCAL_PROJECT_ID,
  },
];

const LOCAL_MEMBERS: ProjectMember[] = [
  { id: 'local-member-da', displayName: 'Ragnar Pitla', email: 'ragnarpitla@Dynamics365SA.com', role: 'DA', projectId: LOCAL_PROJECT_ID },
  { id: 'local-member-consultant', displayName: 'Kazuki Configuration Consultant', email: 'kazuki-consultant@example.com', role: 'Consultant', projectId: LOCAL_PROJECT_ID },
  { id: 'local-member-controller', displayName: 'Zava Finance Controller', email: 'finance.controller@zava.example', role: 'CustomerSponsor', projectId: LOCAL_PROJECT_ID },
  { id: 'local-member-r2r-sme', displayName: 'Zava Record-to-Report SME', email: 'r2r.sme@zava.example', role: 'CustomerSME', projectId: LOCAL_PROJECT_ID },
  { id: 'local-member-technical-sme', displayName: 'Zava Technical SME', email: 'technical.sme@zava.example', role: 'SME', projectId: LOCAL_PROJECT_ID },
];

const LOCAL_TASKS: Task[] = [
  {
    id: '61b12609-1ed3-53c7-a58d-832cecdbfdfd',
    name: '01. Validate address and country prerequisites',
    status: 'Ready',
    skillName: 'r2r-skills',
    waveId: LOCAL_WAVE_ID,
    waveName: 'R2R Wave 1 - Legal Entity to Ledger',
    attempt: 0,
    predecessorIds: [],
    outputSummary: 'Address setup supports legal entity creation.',
    modifiedOn: '2026-01-15T00:00:00Z',
    description: 'Confirm required countries, states or regions, cities, postal codes, and address formats exist for all in-scope legal entities.',
    type: 'Discovery',
    assigneeKind: 'Worker',
  },
  {
    id: '49c98c1d-1884-5e82-a590-a6c78cd982be',
    name: '02. Create legal entity records',
    status: 'Pending',
    skillName: 'r2r-skills',
    waveId: LOCAL_WAVE_ID,
    waveName: 'R2R Wave 1 - Legal Entity to Ledger',
    attempt: 0,
    predecessorIds: ['61b12609-1ed3-53c7-a58d-832cecdbfdfd'],
    outputSummary: 'Each legal entity exists and can receive ledger setup.',
    modifiedOn: '2026-01-15T00:00:00Z',
    description: 'Create each legal entity using customer-provided ID, name, country, address, language, time zone, and tax identifiers.',
    type: 'Configuration',
    assigneeKind: 'Worker',
  },
  {
    id: '9205e7be-b490-57ac-b8b7-0d461f854bbc',
    name: '03. Create fiscal calendars',
    status: 'Ready',
    skillName: 'fiscal-calendar-setup',
    waveId: LOCAL_WAVE_ID,
    waveName: 'R2R Wave 1 - Legal Entity to Ledger',
    attempt: 0,
    predecessorIds: [],
    outputSummary: 'Fiscal calendars are ready for ledger assignment.',
    modifiedOn: '2026-01-15T00:00:00Z',
    description: 'Create fiscal calendars, fiscal years, and periods based on customer close calendar and go-live timeline.',
    type: 'Configuration',
    assigneeKind: 'Worker',
  },
  {
    id: '6ed7195c-8f26-58d3-a838-48332334ceaa',
    name: '04. Configure currencies and exchange rate types',
    status: 'Ready',
    skillName: 'currency-setup',
    waveId: LOCAL_WAVE_ID,
    waveName: 'R2R Wave 1 - Legal Entity to Ledger',
    attempt: 0,
    predecessorIds: [],
    outputSummary: 'Currencies and exchange rate types are ready for ledger and transaction use.',
    modifiedOn: '2026-01-15T00:00:00Z',
    description: 'Validate currencies and create exchange rate types needed for accounting, reporting, budget, and revaluation.',
    type: 'Configuration',
    assigneeKind: 'Worker',
  },
  {
    id: '5a13ccb1-6cb9-5d4f-a7cf-50825a6676a9',
    name: '05. Design chart of accounts',
    status: 'Pending',
    skillName: 'coa-designer',
    waveId: LOCAL_WAVE_ID,
    waveName: 'R2R Wave 1 - Legal Entity to Ledger',
    attempt: 0,
    predecessorIds: ['49c98c1d-1884-5e82-a590-a6c78cd982be'],
    outputSummary: 'Approved chart of accounts design.',
    modifiedOn: '2026-01-15T00:00:00Z',
    description: 'Design chart of accounts strategy, main account ranges, categories, reporting groups, and legal entity override needs.',
    type: 'Design Decision',
    assigneeKind: 'Worker',
  },
  {
    id: 'eef96659-44b5-5e03-8637-85ad199ace0a',
    name: '06. Create or import main accounts',
    status: 'Pending',
    skillName: 'coa-designer',
    waveId: LOCAL_WAVE_ID,
    waveName: 'R2R Wave 1 - Legal Entity to Ledger',
    attempt: 0,
    predecessorIds: ['5a13ccb1-6cb9-5d4f-a7cf-50825a6676a9'],
    outputSummary: 'Main accounts are available for structures, ledger, and posting profiles.',
    modifiedOn: '2026-01-15T00:00:00Z',
    description: 'Create or import main accounts with account type, category, default debit or credit, manual entry controls, and legal entity overrides.',
    type: 'Configuration',
    assigneeKind: 'Worker',
  },
  {
    id: 'a4d121e0-d188-5e96-a079-600c9d5edcd2',
    name: '07. Create financial dimensions',
    status: 'Pending',
    skillName: 'dimension-config',
    waveId: LOCAL_WAVE_ID,
    waveName: 'R2R Wave 1 - Legal Entity to Ledger',
    attempt: 0,
    predecessorIds: ['5a13ccb1-6cb9-5d4f-a7cf-50825a6676a9'],
    outputSummary: 'Financial dimensions exist.',
    modifiedOn: '2026-01-15T00:00:00Z',
    description: 'Create custom and entity-backed financial dimensions needed for reporting, posting, and analysis.',
    type: 'Configuration',
    assigneeKind: 'Worker',
  },
  {
    id: '115b0167-9371-5d7d-a906-afd2172d7d82',
    name: '08. Create custom dimension values',
    status: 'Pending',
    skillName: 'dimension-config',
    waveId: LOCAL_WAVE_ID,
    waveName: 'R2R Wave 1 - Legal Entity to Ledger',
    attempt: 0,
    predecessorIds: ['a4d121e0-d188-5e96-a079-600c9d5edcd2'],
    outputSummary: 'Dimension values are available for account structures and posting.',
    modifiedOn: '2026-01-15T00:00:00Z',
    description: 'Create values for custom financial dimensions and confirm source records for entity-backed dimensions.',
    type: 'Configuration',
    assigneeKind: 'Worker',
  },
  {
    id: '2619a7c4-54f8-5262-bed8-7001b998b6e0',
    name: '09. Configure account structures',
    status: 'Pending',
    skillName: 'dimension-config, coa-designer',
    waveId: LOCAL_WAVE_ID,
    waveName: 'R2R Wave 1 - Legal Entity to Ledger',
    attempt: 0,
    predecessorIds: ['eef96659-44b5-5e03-8637-85ad199ace0a', '115b0167-9371-5d7d-a906-afd2172d7d82'],
    outputSummary: 'Account structures are configured and ready for activation.',
    modifiedOn: '2026-01-15T00:00:00Z',
    description: 'Create account structures that define valid main account and financial dimension combinations. Avoid overlapping ranges for structures assigned to the same ledger.',
    type: 'Configuration',
    assigneeKind: 'Worker',
  },
  {
    id: '547fe11e-de38-552b-9c31-7313ed7eaa19',
    name: '10. Activate account structures',
    status: 'Pending',
    skillName: 'dimension-config, coa-designer',
    waveId: LOCAL_WAVE_ID,
    waveName: 'R2R Wave 1 - Legal Entity to Ledger',
    attempt: 0,
    predecessorIds: ['2619a7c4-54f8-5262-bed8-7001b998b6e0'],
    outputSummary: 'Active account structures can be assigned to ledgers.',
    modifiedOn: '2026-01-15T00:00:00Z',
    description: 'Activate account structures and resolve any validation issues before assigning them to ledgers.',
    type: 'Configuration',
    assigneeKind: 'Worker',
  },
  {
    id: '689a5427-ecf2-5335-b2dd-da056f704ca1',
    name: '11. Configure ledger per legal entity',
    status: 'Pending',
    skillName: 'r2r-skills, fiscal-calendar-setup, currency-setup, coa-designer, dimension-config',
    waveId: LOCAL_WAVE_ID,
    waveName: 'R2R Wave 1 - Legal Entity to Ledger',
    attempt: 0,
    predecessorIds: ['49c98c1d-1884-5e82-a590-a6c78cd982be', '9205e7be-b490-57ac-b8b7-0d461f854bbc', '6ed7195c-8f26-58d3-a838-48332334ceaa', '547fe11e-de38-552b-9c31-7313ed7eaa19'],
    outputSummary: 'Ledger is configured for each legal entity.',
    modifiedOn: '2026-01-15T00:00:00Z',
    description: 'Assign chart of accounts, active account structures, fiscal calendar, accounting currency, reporting currency if required, exchange rate types, and balancing dimension if required.',
    type: 'Configuration',
    assigneeKind: 'Worker',
  },
  {
    id: '40d46215-35c3-5965-9e92-58cde1a7a0b2',
    name: '12. Configure journal names',
    status: 'Pending',
    skillName: 'posting-profile-config',
    waveId: LOCAL_WAVE_ID,
    waveName: 'R2R Wave 1 - Legal Entity to Ledger',
    attempt: 0,
    predecessorIds: ['689a5427-ecf2-5335-b2dd-da056f704ca1'],
    outputSummary: 'Journal names support controlled journal processing.',
    modifiedOn: '2026-01-15T00:00:00Z',
    description: 'Create journal names for daily, adjustments, accruals, corrections, intercompany, and opening balances with workflow, default values, and journal controls where required.',
    type: 'Configuration',
    assigneeKind: 'Worker',
  },
  {
    id: 'e7fb01f4-acfb-5265-8ff8-b7629a48eab6',
    name: '13. Configure posting profiles and automatic accounts',
    status: 'Pending',
    skillName: 'posting-profile-config',
    waveId: LOCAL_WAVE_ID,
    waveName: 'R2R Wave 1 - Legal Entity to Ledger',
    attempt: 0,
    predecessorIds: ['eef96659-44b5-5e03-8637-85ad199ace0a', '689a5427-ecf2-5335-b2dd-da056f704ca1'],
    outputSummary: 'Subledger and automatic postings map to valid ledger accounts.',
    modifiedOn: '2026-01-15T00:00:00Z',
    description: 'Configure control accounts, clearing accounts, currency revaluation accounts, tax accounts, interunit accounts, and subledger posting profiles.',
    type: 'Configuration',
    assigneeKind: 'Worker',
  },
  {
    id: 'cc3897d6-b417-5802-a9db-f2d6ae7ac770',
    name: '14. Configure bank accounts and reconciliation',
    status: 'Pending',
    skillName: 'bank-reconciliation-setup',
    waveId: LOCAL_WAVE_ID,
    waveName: 'R2R Wave 1 - Legal Entity to Ledger',
    attempt: 0,
    predecessorIds: ['689a5427-ecf2-5335-b2dd-da056f704ca1', 'e7fb01f4-acfb-5265-8ff8-b7629a48eab6'],
    outputSummary: 'Bank accounts are ledger-linked and ready for reconciliation.',
    modifiedOn: '2026-01-15T00:00:00Z',
    description: 'Create bank groups and bank accounts, assign ledger accounts, and configure statement import and matching rules if advanced bank reconciliation is in scope.',
    type: 'Configuration',
    assigneeKind: 'Worker',
  },
  {
    id: '11a35a7e-061e-5dbf-b60c-6dd488087308',
    name: '15. Configure budgeting',
    status: 'Pending',
    skillName: 'budget-config',
    waveId: LOCAL_WAVE_ID,
    waveName: 'R2R Wave 1 - Legal Entity to Ledger',
    attempt: 0,
    predecessorIds: ['547fe11e-de38-552b-9c31-7313ed7eaa19', '689a5427-ecf2-5335-b2dd-da056f704ca1'],
    outputSummary: 'Budgeting supports planning, control, and reporting.',
    modifiedOn: '2026-01-15T00:00:00Z',
    description: 'Configure budget models, budget cycles, dimensions, controls, workflows, and exchange rate type if budgeting is in scope.',
    type: 'Configuration',
    assigneeKind: 'Worker',
  },
  {
    id: '87b44898-38eb-5933-b50f-8ed4fae5df7f',
    name: '16. Configure consolidation',
    status: 'Pending',
    skillName: 'consolidation-setup',
    waveId: LOCAL_WAVE_ID,
    waveName: 'R2R Wave 1 - Legal Entity to Ledger',
    attempt: 0,
    predecessorIds: ['689a5427-ecf2-5335-b2dd-da056f704ca1', 'e7fb01f4-acfb-5265-8ff8-b7629a48eab6'],
    outputSummary: 'Consolidation setup is ready for close and reporting.',
    modifiedOn: '2026-01-15T00:00:00Z',
    description: 'Configure consolidation scope, currency, translation assumptions, and elimination requirements if consolidation is in scope.',
    type: 'Configuration',
    assigneeKind: 'Worker',
  },
  {
    id: '958e7bf2-0328-5bd3-b0b1-c9429e1ff0f4',
    name: '17. Map legacy trial balance to D365 accounts and dimensions',
    status: 'Pending',
    skillName: 'r2r-skills, coa-designer, dimension-config',
    waveId: LOCAL_WAVE_ID,
    waveName: 'R2R Wave 1 - Legal Entity to Ledger',
    attempt: 0,
    predecessorIds: ['eef96659-44b5-5e03-8637-85ad199ace0a', '115b0167-9371-5d7d-a906-afd2172d7d82'],
    outputSummary: 'Approved opening balance mapping.',
    modifiedOn: '2026-01-15T00:00:00Z',
    description: 'Map legacy main accounts and dimension values to D365 main accounts and financial dimensions. Flag unmapped, invalid, inactive, or duplicate values.',
    type: 'Design Decision',
    assigneeKind: 'Worker',
  },
  {
    id: '21b29fdf-2761-5479-9065-9f4dc2077e74',
    name: '18. Import and validate opening balance journal',
    status: 'Pending',
    skillName: 'posting-profile-config',
    waveId: LOCAL_WAVE_ID,
    waveName: 'R2R Wave 1 - Legal Entity to Ledger',
    attempt: 0,
    predecessorIds: ['40d46215-35c3-5965-9e92-58cde1a7a0b2', '958e7bf2-0328-5bd3-b0b1-c9429e1ff0f4'],
    outputSummary: 'Opening balance journal is posted.',
    modifiedOn: '2026-01-15T00:00:00Z',
    description: 'Prepare opening balance journal lines, import through data management or Excel, validate or simulate posting, correct errors, and post after finance approval.',
    type: 'Data Migration',
    assigneeKind: 'Worker',
  },
  {
    id: '83e65e37-f215-5d8a-8659-c68bf0cedb72',
    name: '19. Run R2R validation checks',
    status: 'Pending',
    skillName: 'r2r-skills',
    waveId: LOCAL_WAVE_ID,
    waveName: 'R2R Wave 1 - Legal Entity to Ledger',
    attempt: 0,
    predecessorIds: ['21b29fdf-2761-5479-9065-9f4dc2077e74'],
    outputSummary: 'R2R validation report with pass, fail, and remediation items.',
    modifiedOn: '2026-01-15T00:00:00Z',
    description: 'Run trial balance, financial reports, journal validation, close checklist review, and source reconciliation checks.',
    type: 'Test',
    assigneeKind: 'Worker',
  },
  {
    id: '0e502d3f-c94a-528b-a084-e98d231c3245',
    name: '20. Produce R2R go-live readiness signoff',
    status: 'Pending',
    skillName: 'r2r-skills',
    waveId: LOCAL_WAVE_ID,
    waveName: 'R2R Wave 1 - Legal Entity to Ledger',
    attempt: 0,
    predecessorIds: ['83e65e37-f215-5d8a-8659-c68bf0cedb72'],
    outputSummary: 'R2R go-live readiness summary.',
    modifiedOn: '2026-01-15T00:00:00Z',
    description: 'Summarize completed deliverables, unresolved risks, reconciliation status, testing status, and finance signoff.',
    type: 'Review',
    assigneeKind: 'Worker',
  },
];

const LOCAL_WAVES: Wave[] = [{
  id: LOCAL_WAVE_ID,
  name: 'R2R Wave 1 - Legal Entity to Ledger',
  description: 'Customer-driven Zava R2R foundation wave from GAB prerequisites through ledger readiness.',
  status: 'Released',
  projectId: LOCAL_PROJECT_ID,
  taskCount: LOCAL_TASKS.length,
  errorCount: LOCAL_TASKS.filter(t => t.status === 'Failed').length,
  phaseId: 'local-phase-foundation',
}];

const LOCAL_DEPENDENCIES = LOCAL_TASKS.flatMap(task =>
  task.predecessorIds.map(predecessorId => ({ taskId: task.id, predecessorId })),
);

const LOCAL_PLAYBOOKS: KzkPlaybook[] = [{
  id: 'local-playbook-zava-r2r',
  name: 'zava-r2r-wave-playbook',
  displayName: 'Zava R2R Wave Playbook',
  description: 'Customer-driven Record to Report wave playbook for Zava Agentic Retailer.',
  publisher: 'Kazuki-Rag',
  layer: 'Customer',
  iconEmoji: 'R2R',
  phases: ['R2R Foundation', 'Chart of Accounts and Dimensions', 'Ledger Operations', 'Opening Balances', 'Validation and Signoff'],
  modulesCovered: 'General ledger, Cash and bank management, Tax, Budgeting, Consolidation',
  scopeTrees: '90 Record to Report: ZAUS, ZAUK, ZAIN',
  waveCount: LOCAL_WAVES.length,
  taskCount: 20,
  sortOrder: 1,
}];

const LOCAL_SKILLS: Skill[] = [
  { id: 'local-skill-r2r', name: 'r2r-skills', version: '1', description: 'Record to Report configuration skill package.' },
  { id: 'local-skill-coa', name: 'coa-designer', version: '1', description: 'Design and configure chart of accounts structure.' },
  { id: 'local-skill-dimension', name: 'dimension-config', version: '1', description: 'Configure financial dimensions and account structures.' },
  { id: 'local-skill-fiscal', name: 'fiscal-calendar-setup', version: '1', description: 'Set up fiscal calendars and periods.' },
  { id: 'local-skill-currency', name: 'currency-setup', version: '1', description: 'Configure currencies and exchange rates.' },
  { id: 'local-skill-posting', name: 'posting-profile-config', version: '1', description: 'Configure posting profiles and automatic accounts.' },
  { id: 'local-skill-bank', name: 'bank-reconciliation-setup', version: '1', description: 'Set up bank accounts and reconciliation.' },
  { id: 'local-skill-budget', name: 'budget-config', version: '1', description: 'Configure budgeting.' },
  { id: 'local-skill-consolidation', name: 'consolidation-setup', version: '1', description: 'Configure financial consolidation.' },
];

function isLocalDevHost(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

function isStandaloneLocalDevHost(): boolean {
  return isLocalDevHost() && window.parent === window;
}

async function withLocalReadFallback<T>(label: string, read: () => Promise<T>, fallback: () => T): Promise<T> {
  // Click-through demo / web-app mode: skip the Power Apps SDK entirely. Without
  // a Power Apps host the read() call would hang or throw and we would only
  // return fallback() after a 4s timeout, which makes the demo feel broken.
  if (isDemoModeCached()) return fallback();

  if (!isLocalDevHost()) return read();
  if (isStandaloneLocalDevHost()) return fallback();

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(`[kazuki-local] ${label} did not resolve within ${LOCAL_TIMEOUT_MS}ms; using read-only local preview data.`);
      resolve(fallback());
    }, LOCAL_TIMEOUT_MS);
  });

  try {
    return await Promise.race([read(), timeout]);
  } catch (error) {
    console.warn(`[kazuki-local] ${label} failed; using read-only local preview data.`, error);
    return fallback();
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function mapTask(r: any): Task {
  return {
    id: r.kzk_taskid,
    name: r.kzk_title,
    status: STATUS_MAP[r.kzk_status as unknown as number] ?? 'Pending',
    skillName: r.kzk_requiredskills ?? '',
    waveId: r._kzk_waveid_value ?? '',
    waveName: r.kzk_waveidname ?? '',
    attempt: 0,
    predecessorIds: [],
    outputSummary: r.kzk_output,
    modifiedOn: r.modifiedon ?? '',
    description: r.kzk_description ?? '',
    type: TASK_TYPE_MAP[r.kzk_type as number] ?? '',
    assigneeKind: ASSIGNEE_KIND_MAP[r.kzk_assigneekind as number] ?? '',
    assigneeRole: ASSIGNEE_ROLE_MAP[r.kzk_assigneerole as number] ?? '',
    skillContext: r.kzk_skillcontext ?? '',
    claimedAt: r.kzk_claimedat ?? '',
    completedAt: r.kzk_completedat ?? '',
    checkpoint: r.kzk_checkpoint ?? '',
  };
}

export async function fetchTasks(waveId: string): Promise<Task[]> {
  return timed('fetchTasks', () => withLocalReadFallback<Task[]>('fetchTasks', async () => {
    try {
      const result = await Kzk_tasksService.getAll({
        filter: `_kzk_waveid_value eq '${waveId}'`,
        orderBy: ['kzk_title'],
      });
      return (result.data ?? []).map(mapTask);
    } catch {
      const result = await Kzk_tasksService.getAll();
      return (result.data ?? [])
        .filter((r: any) => r._kzk_waveid_value === waveId)
        .map(mapTask);
    }
  }, () => LOCAL_TASKS.filter(t => t.waveId === waveId)));
}

export async function fetchProjectTasks(projectId: string): Promise<Task[]> {
  return timed('fetchProjectTasks', () => withLocalReadFallback<Task[]>('fetchProjectTasks', async () => {
    try {
      const result = await Kzk_tasksService.getAll({
        filter: `_kzk_projectid_value eq '${projectId}'`,
        orderBy: ['kzk_title'],
      });
      return (result.data ?? []).map(mapTask);
    } catch {
      const result = await Kzk_tasksService.getAll();
      return (result.data ?? [])
        .filter((r: any) => r._kzk_projectid_value === projectId)
        .map(mapTask);
    }
  }, () => LOCAL_TASKS.filter(t => t.waveId && LOCAL_WAVES.some(w => w.projectId === projectId && w.id === t.waveId))));
}

export async function fetchWaves(projectId: string): Promise<Wave[]> {
  return timed('fetchWaves', () => withLocalReadFallback<Wave[]>('fetchWaves', async () => {
    // Fetch waves
    let waveRows: any[];
    try {
      const result = await Kzk_wavesService.getAll({
        filter: `_kzk_projectid_value eq '${projectId}'`,
        orderBy: ['kzk_name'],
      });
      waveRows = result.data ?? [];
    } catch {
      const result = await Kzk_wavesService.getAll();
      waveRows = (result.data ?? []).filter((r: any) => r._kzk_projectid_value === projectId);
    }

    // Fetch all tasks to count per wave
    let taskRows: any[] = [];
    try {
      const taskResult = await Kzk_tasksService.getAll();
      taskRows = taskResult.data ?? [];
    } catch { /* ignore — counts will be 0 */ }

    const taskCountByWave = new Map<string, number>();
    const errorCountByWave = new Map<string, number>();
    for (const t of taskRows) {
      const wId = t._kzk_waveid_value ?? '';
      taskCountByWave.set(wId, (taskCountByWave.get(wId) ?? 0) + 1);
      const status = STATUS_MAP[t.kzk_status as unknown as number];
      if (status === 'Failed') {
        errorCountByWave.set(wId, (errorCountByWave.get(wId) ?? 0) + 1);
      }
    }

    const WAVE_STATUS_MAP: Record<number, string> = {
      950000010: 'Draft',
      950000020: 'Released',
      950000030: 'Closed',
    };

    return waveRows.map((r: any) => ({
      id: r.kzk_waveid,
      name: r.kzk_name,
      description: '',
      status: WAVE_STATUS_MAP[r.kzk_status as number] ?? r.kzk_statusname ?? 'Draft',
      projectId: r._kzk_projectid_value ?? '',
      taskCount: taskCountByWave.get(r.kzk_waveid) ?? 0,
      errorCount: errorCountByWave.get(r.kzk_waveid) ?? 0,
        phaseId: r._kzk_phaseid_value ?? undefined,
      }));
  }, () => LOCAL_WAVES.filter(w => w.projectId === projectId)));
}

export async function fetchProjects(): Promise<Project[]> {
  return timed('fetchProjects', () => withLocalReadFallback<Project[]>('fetchProjects', async () => {
    const result = await Kzk_projectsService.getAll({
      filter: 'statecode eq 0',
      orderBy: ['kzk_name'],
    });
    return (result.data ?? []).map((r: any) => ({
      id: r.kzk_projectid as string,
      name: r.kzk_name as string,
      description: '',
      customerName: (r.kzk_customername as string) ?? undefined,
      products: (r.kzk_products as string) ?? undefined,
      startDate: (r.kzk_startdate as string) ?? undefined,
      targetGoLive: (r.kzk_targetgolive as string) ?? undefined,
      scopeSummary: (r.kzk_scopesummary as string) ?? undefined,
      autopilot: (r.kzk_autopilot as boolean) ?? false,
      sharepointUrl: (r.kzk_sharepointurl as string) ?? undefined,
      teamsChannelUrl: (r.kzk_teamschannelurl as string) ?? undefined,
      foSandboxUrl: (r.kzk_fosandboxurl as string) ?? undefined,
      dataverseUrl: (r.kzk_dataverseurl as string) ?? undefined,
      devopsUrl: (r.kzk_devopsurl as string) ?? undefined,
    }));
  }, () => LOCAL_PROJECTS));
}

export async function fetchPhases(projectId: string): Promise<Phase[]> {
  return timed('fetchPhases', () => withLocalReadFallback<Phase[]>('fetchPhases', async () => {
    try {
      const result = await Kzk_phasesService.getAll({
        filter: `_kzk_projectid_value eq '${projectId}'`,
        orderBy: ['kzk_order'],
      });
      return (result.data ?? []).map((r: any) => ({
        id: r.kzk_phaseid,
        name: r.kzk_name,
        description: r.kzk_description ?? '',
        order: r.kzk_order ?? 0,
        status: PHASE_STATUS_MAP[r.kzk_status as number] ?? 'NotStarted',
        projectId: r._kzk_projectid_value ?? '',
      }));
    } catch {
      const result = await Kzk_phasesService.getAll();
      return (result.data ?? [])
        .filter((r: any) => r._kzk_projectid_value === projectId)
        .map((r: any) => ({
          id: r.kzk_phaseid,
          name: r.kzk_name,
          description: r.kzk_description ?? '',
          order: r.kzk_order ?? 0,
          status: PHASE_STATUS_MAP[r.kzk_status as number] ?? 'NotStarted',
          projectId: r._kzk_projectid_value ?? '',
        }));
    }
  }, () => LOCAL_PHASES.filter(p => p.projectId === projectId)));
}

export async function fetchE2EProcesses(projectId: string): Promise<E2EProcess[]> {
  return timed('fetchE2EProcesses', () => withLocalReadFallback<E2EProcess[]>('fetchE2EProcesses', async () => {
    try {
      const result = await Kzk_e2eprocessesService.getAll({
        filter: `_kzk_projectid_value eq '${projectId}'`,
        orderBy: ['kzk_name'],
      });
      return (result.data ?? []).map((r: any) => ({
        id: r.kzk_e2eprocessid,
        name: r.kzk_name,
        bpcId: r.kzk_bpcid ?? '',
        areas: r.kzk_areas ?? '',
        modules: r.kzk_modules ?? '',
        isInScope: r.kzk_isinscope ?? false,
        projectId: r._kzk_projectid_value ?? '',
      }));
    } catch {
      const result = await Kzk_e2eprocessesService.getAll();
      return (result.data ?? [])
        .filter((r: any) => r._kzk_projectid_value === projectId)
        .map((r: any) => ({
          id: r.kzk_e2eprocessid,
          name: r.kzk_name,
          bpcId: r.kzk_bpcid ?? '',
          areas: r.kzk_areas ?? '',
          modules: r.kzk_modules ?? '',
          isInScope: r.kzk_isinscope ?? false,
          projectId: r._kzk_projectid_value ?? '',
        }));
    }
  }, () => LOCAL_PROCESSES.filter(p => p.projectId === projectId)));
}

export async function fetchProjectMembers(projectId: string): Promise<ProjectMember[]> {
  return timed('fetchProjectMembers', () => withLocalReadFallback<ProjectMember[]>('fetchProjectMembers', async () => {
    try {
      const result = await Kzk_projectmembersService.getAll({
        filter: `_kzk_projectid_value eq '${projectId}'`,
        orderBy: ['kzk_displayname'],
      });
      return (result.data ?? []).map((r: any) => ({
        id: r.kzk_projectmemberid,
        displayName: r.kzk_displayname ?? '',
        email: r.kzk_email ?? '',
        role: MEMBER_ROLE_MAP[r.kzk_role as number] ?? 'Consultant',
        projectId: r._kzk_projectid_value ?? '',
      }));
    } catch {
      const result = await Kzk_projectmembersService.getAll();
      return (result.data ?? [])
        .filter((r: any) => r._kzk_projectid_value === projectId)
        .map((r: any) => ({
          id: r.kzk_projectmemberid,
          displayName: r.kzk_displayname ?? '',
          email: r.kzk_email ?? '',
          role: MEMBER_ROLE_MAP[r.kzk_role as number] ?? 'Consultant',
          projectId: r._kzk_projectid_value ?? '',
        }));
    }
  }, () => LOCAL_MEMBERS.filter(m => m.projectId === projectId)));
}

export async function fetchDependencies(taskIds: string[]): Promise<{ taskId: string; predecessorId: string }[]> {
  if (taskIds.length === 0) return [];
  return timed('fetchDeps', () => withLocalReadFallback<{ taskId: string; predecessorId: string }[]>('fetchDeps', async () => {
    try {
      const filterParts = taskIds.map(id => `_kzk_successorid_value eq '${id}'`);
      const CHUNK = 15;
      const results: { taskId: string; predecessorId: string }[] = [];
      for (let i = 0; i < filterParts.length; i += CHUNK) {
        const chunk = filterParts.slice(i, i + CHUNK).join(' or ');
        const result = await Kzk_taskdependenciesService.getAll({ filter: chunk });
        for (const r of result.data ?? []) {
          results.push({
            taskId: (r as any)._kzk_successorid_value ?? '',
            predecessorId: (r as any)._kzk_predecessorid_value ?? '',
          });
        }
      }
      return results;
    } catch {
      const idSet = new Set(taskIds);
      const result = await Kzk_taskdependenciesService.getAll();
      return (result.data ?? [])
        .filter((r: any) => idSet.has(r._kzk_successorid_value ?? ''))
        .map((r: any) => ({
          taskId: (r as any)._kzk_successorid_value ?? '',
          predecessorId: (r as any)._kzk_predecessorid_value ?? '',
        }));
    }
  }, () => LOCAL_DEPENDENCIES.filter(d => taskIds.includes(d.taskId))));
}

function phaseLabel(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['name', 'displayName', 'label', 'title', 'key', 'id']) {
      const label = phaseLabel(record[key]);
      if (label) return label;
    }
  }
  return null;
}

function safeParsePhases(json?: string): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed)
      ? parsed.map(phaseLabel).filter((label): label is string => Boolean(label))
      : [];
  } catch {
    return [];
  }
}

// ── Write operations ──────────────────────────────────────────────

export interface CreateWaveInput {
  name: string;
  projectId: string;
  phaseId?: string;
  description?: string;
}

export async function createWave(input: CreateWaveInput): Promise<string> {
  const record: any = {
    kzk_name: input.name,
    'kzk_ProjectId@odata.bind': `/kzk_projects(${input.projectId})`,
    kzk_status: 950000010, // Draft
  };
  if (input.phaseId) {
    record['kzk_PhaseId@odata.bind'] = `/kzk_phases(${input.phaseId})`;
  }
  const result = await Kzk_wavesService.create(record);
  return (result.data as any)?.kzk_waveid ?? '';
}

export async function updateWave(waveId: string, fields: { name?: string; description?: string }): Promise<void> {
  const patch: any = {};
  if (fields.name !== undefined) patch.kzk_name = fields.name;
  if (fields.description !== undefined) patch.kzk_description = fields.description;
  await Kzk_wavesService.update(waveId, patch);
}

export async function releaseWave(waveId: string): Promise<void> {
  try {
    await Kzk_wavesService.update(waveId, {
      kzk_status: 950000020,
    } as any);
  } catch (e) {
    console.error('releaseWave failed:', e);
    throw e;
  }
}

export async function releaseAllDraftWaves(projectId: string): Promise<number> {
  const result = await Kzk_wavesService.getAll({
    filter: `_kzk_projectid_value eq '${projectId}' and kzk_status eq 950000010`,
    orderBy: ['kzk_name'],
  });
  const draftWaves = result.data ?? [];
  await Promise.all(draftWaves.map((wave: any) => Kzk_wavesService.update(wave.kzk_waveid, {
    kzk_status: 950000020,
  } as any)));
  return draftWaves.length;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  type?: number;
  assigneeKind?: number;
  assigneeRole?: number;
  requiredSkills?: string;
  skillContext?: string;
  waveId: string;
  projectId: string;
  hasDependencies: boolean;
}

export async function createTask(input: CreateTaskInput): Promise<string> {
  const record: any = {
    kzk_title: input.title,
    'kzk_WaveId@odata.bind': `/kzk_waves(${input.waveId})`,
    'kzk_ProjectId@odata.bind': `/kzk_projects(${input.projectId})`,
    kzk_status: 950000010,
  };
  if (input.description) record.kzk_description = input.description;
  if (input.type) record.kzk_type = input.type;
  if (input.assigneeKind) record.kzk_assigneekind = input.assigneeKind;
  if (input.assigneeRole) record.kzk_assigneerole = input.assigneeRole;
  if (input.requiredSkills) record.kzk_requiredskills = input.requiredSkills;
  if (input.skillContext) record.kzk_skillcontext = input.skillContext;
  const result = await Kzk_tasksService.create(record);
  return (result.data as any)?.kzk_taskid ?? '';
}

export async function updateTask(
  taskId: string,
  fields: {
    title?: string;
    description?: string;
    type?: number;
    assigneeKind?: number;
    assigneeRole?: number;
    requiredSkills?: string;
    skillContext?: string;
    status?: number;
    output?: string;
    checkpoint?: string;
    completedAt?: string;
  },
): Promise<void> {
  const patch: any = {};
  if (fields.title !== undefined) patch.kzk_title = fields.title;
  if (fields.description !== undefined) patch.kzk_description = fields.description;
  if (fields.type !== undefined) patch.kzk_type = fields.type;
  if (fields.assigneeKind !== undefined) patch.kzk_assigneekind = fields.assigneeKind;
  if (fields.assigneeRole !== undefined) patch.kzk_assigneerole = fields.assigneeRole;
  if (fields.requiredSkills !== undefined) patch.kzk_requiredskills = fields.requiredSkills;
  if (fields.skillContext !== undefined) patch.kzk_skillcontext = fields.skillContext;
  if (fields.status !== undefined) patch.kzk_status = fields.status;
  if (fields.output !== undefined) patch.kzk_output = fields.output;
  if (fields.checkpoint !== undefined) patch.kzk_checkpoint = fields.checkpoint;
  if (fields.completedAt !== undefined) patch.kzk_completedat = fields.completedAt;
  await Kzk_tasksService.update(taskId, patch);
}

export async function completeHumanApprovalTask(taskId: string, projectId: string): Promise<void> {
  const result = await Kzk_tasksService.get(taskId, {
    select: [
      'kzk_taskid',
      'kzk_title',
      '_kzk_projectid_value',
      'kzk_status',
      'kzk_assigneekind',
      'kzk_assigneerole',
      'kzk_type',
      'kzk_output',
      'kzk_checkpoint',
    ],
  });
  const task = result.data as any;
  if (!task) {
    throw new Error(`Task ${taskId} was not found.`);
  }
  if ((task._kzk_projectid_value ?? projectId) !== projectId) {
    throw new Error(`Task ${taskId} does not belong to the active project.`);
  }
  const isReadyDaApproval = task.kzk_status === 950000020
    && task.kzk_assigneekind === 950000020
    && task.kzk_assigneerole === 950000010
    && task.kzk_type === 950000040;
  if (!isReadyDaApproval) {
    throw new Error(`Task ${taskId} is not a Ready DA approval gate.`);
  }

  const approvedAt = new Date().toISOString();
  const ts = approvedAt.slice(11, 19);
  const outputLine = `DA approval completed from Kazuki Console at ${approvedAt}. Scope verdict accepted for downstream promotion.`;
  const checkpointLine = `[${ts}] **Approved** — Agent=Kazuki Console; action=da_approval_gate_completed; status=Completed; downstream released tasks are eligible for Dispatcher promotion`;

  await Kzk_tasksService.update(taskId, {
    kzk_status: 950000050,
    kzk_output: [task.kzk_output, outputLine].filter(Boolean).join('\n\n'),
    kzk_checkpoint: [task.kzk_checkpoint, checkpointLine].filter(Boolean).join('\n'),
    kzk_completedat: approvedAt,
  } as any);
}

export async function deleteTask(taskId: string): Promise<void> {
  await Kzk_tasksService.delete(taskId);
}

export async function createDependency(successorId: string, predecessorId: string): Promise<string> {
  const record: any = {
    kzk_name: `${predecessorId} → ${successorId}`,
    'kzk_PredecessorId@odata.bind': `/kzk_tasks(${predecessorId})`,
    'kzk_SuccessorId@odata.bind': `/kzk_tasks(${successorId})`,
  };
  const result = await Kzk_taskdependenciesService.create(record);
  return (result.data as any)?.kzk_taskdependencyid ?? '';
}

export async function deleteDependency(depId: string): Promise<void> {
  await Kzk_taskdependenciesService.delete(depId);
}

export interface Skill {
  id: string;
  name: string;
  version: string;
  description: string;
}

export async function fetchSkills(): Promise<Skill[]> {
  return timed('fetchSkills', () => withLocalReadFallback<Skill[]>('fetchSkills', async () => {
    try {
      const result = await Kzk_skillsService.getAll({
        filter: 'statecode eq 0',
        orderBy: ['kzk_name'],
        select: ['kzk_skillid', 'kzk_name', 'kzk_version', 'kzk_description'],
      });
      return (result.data ?? []).map((r: any) => ({
        id: r.kzk_skillid as string,
        name: r.kzk_name as string,
        version: (r.kzk_version as string) ?? '1',
        description: (r.kzk_description as string) ?? '',
      }));
    } catch {
      return [];
    }
  }, () => LOCAL_SKILLS));
}

export async function fetchPlaybooks(): Promise<KzkPlaybook[]> {
  return timed('fetchPlaybooks', () => withLocalReadFallback<KzkPlaybook[]>('fetchPlaybooks', async () => {
    const result = await Kzk_playbooksService.getAll({
      filter: 'statecode eq 0',
      orderBy: ['kzk_sortorder'],
      select: [
        'kzk_playbookid', 'kzk_name', 'kzk_displayname', 'kzk_description',
        'kzk_publisher', 'kzk_layer', 'kzk_iconemoji', 'kzk_phasesjson',
        'kzk_modulescovered', 'kzk_scopetrees', 'kzk_wavecount',
        'kzk_taskcount', 'kzk_sortorder',
      ],
    });
    return (result.data ?? []).map((r: any) => ({
      id: r.kzk_playbookid as string,
      name: r.kzk_name as string,
      displayName: (r.kzk_displayname as string) ?? r.kzk_name ?? '',
      description: (r.kzk_description as string) ?? '',
      publisher: (r.kzk_publisher as string) ?? '',
      layer: PLAYBOOK_LAYER_MAP[r.kzk_layer as number] ?? 'Customer',
      iconEmoji: (r.kzk_iconemoji as string) ?? '📋',
      phases: safeParsePhases(r.kzk_phasesjson as string),
      modulesCovered: (r.kzk_modulescovered as string) ?? '',
      scopeTrees: (r.kzk_scopetrees as string) ?? '',
      waveCount: (r.kzk_wavecount as number) ?? 0,
      taskCount: (r.kzk_taskcount as number) ?? 0,
      sortOrder: (r.kzk_sortorder as number) ?? 0,
    }));
  }, () => LOCAL_PLAYBOOKS));
}

// ── Annotation uploads (project document attachments) ──────────────

function dataverseClient(): any {
  return (Kzk_projectsService as any).client;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

const MIME_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  txt: 'text/plain',
  md: 'text/markdown',
};

const TEXT_EXTENSIONS = new Set(['csv', 'txt', 'md', 'json', 'yaml', 'yml', 'xml']);

function parseCustomerDataName(subject: string): string {
  for (const prefix of [MAMAMIA8_DATA_PACK_PREFIX, CUSTOMER_DATA_UPLOAD_PREFIX]) {
    if (subject.startsWith(prefix)) return subject.slice(prefix.length).trim();
  }
  return subject;
}

function parseMailHeader(body: string, label: string): string {
  const prefix = `${label}:`;
  const line = body.split('\n').find(item => item.startsWith(prefix));
  return line ? line.slice(prefix.length).trim() : '';
}

function customerDataSourceType(subject: string): CustomerDataSourceType {
  if (subject.startsWith(CUSTOMER_DATA_UPLOAD_PREFIX)) return 'Uploaded';
  const name = parseCustomerDataName(subject);
  if (name.startsWith('Zava-Agentic-Retailer-V1E/') || name.startsWith('D365-cowork-Knowledge/')) return 'Reference';
  return 'Seeded';
}

function mapCustomerDataRow(row: any): CustomerDataFile {
  const subject = row.kzk_subject ?? row.kzk_name ?? '';
  const body = row.kzk_body ?? '';
  return {
    id: row.kzk_mailid,
    name: parseCustomerDataName(subject),
    subject,
    body,
    sourceType: customerDataSourceType(subject),
    fileType: parseMailHeader(body, 'Type') || parseMailHeader(body, 'File').split('.').pop() || '',
    mimeType: parseMailHeader(body, 'MIME') || '',
    projectId: row._kzk_projectid_value ?? '',
    createdOn: row.createdon ?? '',
    modifiedOn: row.modifiedon ?? '',
    uploadedBy: row.kzk_fromparticipant ?? '',
    truncated: body.includes('[TRUNCATED'),
  };
}

function sortCustomerDataRows(rows: CustomerDataFile[]): CustomerDataFile[] {
  return [...rows].sort((a, b) => {
    const typeOrder: Record<CustomerDataSourceType, number> = { Seeded: 0, Uploaded: 1, Reference: 2 };
    const byType = typeOrder[a.sourceType] - typeOrder[b.sourceType];
    if (byType !== 0) return byType;
    return a.name.localeCompare(b.name);
  });
}

export async function fetchProjectCustomerData(projectId: string): Promise<CustomerDataFile[]> {
  return timed('fetchProjectCustomerData', () => withLocalReadFallback<CustomerDataFile[]>('fetchProjectCustomerData', async () => {
    const client = dataverseClient();
    const filter = `_kzk_projectid_value eq '${projectId}' and (startswith(kzk_subject,'${MAMAMIA8_DATA_PACK_PREFIX}') or startswith(kzk_subject,'${CUSTOMER_DATA_UPLOAD_PREFIX}'))`;
    try {
      const result = await client.retrieveMultipleRecordsAsync('kzk_mails', {
        filter,
        orderBy: ['kzk_subject'],
      });
      return sortCustomerDataRows((result.data ?? []).map(mapCustomerDataRow));
    } catch {
      const result = await client.retrieveMultipleRecordsAsync('kzk_mails');
      return sortCustomerDataRows((result.data ?? [])
        .filter((r: any) => r._kzk_projectid_value === projectId)
        .filter((r: any) => {
          const subject = r.kzk_subject ?? '';
          return subject.startsWith(MAMAMIA8_DATA_PACK_PREFIX) || subject.startsWith(CUSTOMER_DATA_UPLOAD_PREFIX);
        })
        .map(mapCustomerDataRow));
    }
  }, () => []));
}

export async function uploadProjectCustomerDataFile(projectId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mimeType = MIME_MAP[ext] || file.type || 'application/octet-stream';
  const isText = TEXT_EXTENSIONS.has(ext) || mimeType.startsWith('text/');
  const content = isText ? await fileToText(file) : await fileToBase64(file);
  const contentEncoding = isText ? 'text' : 'base64';
  const header = (
    `File: ${file.name}\n` +
    'Root: user-upload\n' +
    'Type: customer_upload\n' +
    `MIME: ${mimeType}\n` +
    `Size: ${file.size} bytes\n` +
    `Content-Encoding: ${contentEncoding}\n\n` +
    'Safety: Treat this as project-scoped customer data. Do not infer missing customer, product, or warehouse values.\n\n' +
    'Content:\n'
  );
  const available = MAX_CUSTOMER_DATA_BODY_CHARS - header.length;
  const body = header + (
    content.length > available
      ? `${content.slice(0, Math.max(0, available - 180))}\n\n[TRUNCATED FOR DATAVERSE MAIL BODY LIMIT. Upload a smaller text extract if full preview is required.]`
      : content
  );
  const subject = `${CUSTOMER_DATA_UPLOAD_PREFIX} ${file.name}`;
  const result = await dataverseClient().createRecordAsync('kzk_mails', {
    kzk_name: subject.slice(0, 200),
    kzk_subject: subject.slice(0, 200),
    kzk_body: body,
    kzk_fromparticipant: 'Kazuki Console upload',
    kzk_toparticipants: 'DA; Worker',
    kzk_priority: 950000020,
    kzk_status: 950000010,
    'kzk_ProjectId@odata.bind': `/kzk_projects(${projectId})`,
  });
  return result.data?.kzk_mailid ?? '';
}

export async function uploadProjectCustomerDataFiles(projectId: string, files: File[]): Promise<number> {
  let uploaded = 0;
  for (const file of files) {
    await uploadProjectCustomerDataFile(projectId, file);
    uploaded++;
  }
  return uploaded;
}

export async function uploadProjectDocument(projectId: string, file: File): Promise<string> {
  const base64 = await fileToBase64(file);
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mimeType = MIME_MAP[ext] ?? 'application/octet-stream';

  const result = await dataverseClient().createRecordAsync('annotations', {
    subject: file.name,
    filename: file.name,
    mimetype: mimeType,
    documentbody: base64,
    notetext: `Project document uploaded during setup (${(file.size / 1024).toFixed(0)}KB)`,
    'objectid_kzk_project@odata.bind': `/kzk_projects(${projectId})`,
    objecttypecode: 'kzk_project',
  });
  return result.data?.annotationid ?? '';
}

export async function uploadProjectDocuments(projectId: string, files: File[]): Promise<number> {
  let uploaded = 0;
  for (const file of files) {
    try {
      await uploadProjectDocument(projectId, file);
      uploaded++;
    } catch (e) {
      console.error(`Failed to upload ${file.name}:`, e);
    }
  }
  return uploaded;
}

// ── Watchdog Schedule CRUD ──────────────────────────────────────────
// The kzk_watchdogschedules table may not be provisioned yet.
// All fetch functions catch errors gracefully and return safe defaults.

let _watchdogClient: any = null;
function getWatchdogClient() {
  if (!_watchdogClient) {
    _watchdogClient = (Kzk_projectsService as any).client;
  }
  return _watchdogClient;
}

const WATCHDOG_TABLE = 'kzk_watchdogschedules';

export async function fetchWatchdogSchedules(): Promise<WatchdogSchedule[]> {
  return timed('fetchWatchdogSchedules', () => withLocalReadFallback<WatchdogSchedule[]>('fetchWatchdogSchedules', async () => {
    try {
      const client = getWatchdogClient();
      const result = await client.retrieveMultipleRecordsAsync(WATCHDOG_TABLE, {
        filter: 'statecode eq 0',
        orderBy: ['kzk_name'],
      });
      return (result.data ?? []).map((r: any) => ({
        id: r.kzk_watchdogscheduleid as string,
        name: (r.kzk_name as string) ?? '',
        cronExpression: (r.kzk_cronexpression as string) ?? '',
        skillName: (r.kzk_skillname as string) ?? '',
        projectId: (r._kzk_projectid_value as string) ?? undefined,
        promptText: (r.kzk_prompttext as string) ?? '',
        toolsAllowed: (r.kzk_toolsallowed as string) ?? '',
        enabled: r.kzk_enabled ?? false,
        lastRunTime: (r.kzk_lastruntime as string) ?? undefined,
        lastStatus: WATCHDOG_STATUS_MAP[r.kzk_laststatus as number] ?? undefined,
      }));
    } catch {
      return [];
    }
  }, () => []));
}

export interface CreateWatchdogScheduleInput {
  name: string;
  cronExpression: string;
  skillName: string;
  projectId?: string;
  promptText: string;
  toolsAllowed: string;
  enabled: boolean;
}

export async function createWatchdogSchedule(input: CreateWatchdogScheduleInput): Promise<string> {
  const client = getWatchdogClient();
  const record: any = {
    kzk_name: input.name,
    kzk_cronexpression: input.cronExpression,
    kzk_skillname: input.skillName,
    kzk_prompttext: input.promptText,
    kzk_toolsallowed: input.toolsAllowed,
    kzk_enabled: input.enabled,
  };
  if (input.projectId) {
    record['kzk_ProjectId@odata.bind'] = `/kzk_projects(${input.projectId})`;
  }
  const result = await client.createRecordAsync(WATCHDOG_TABLE, record);
  return result.data?.kzk_watchdogscheduleid ?? '';
}

export async function updateWatchdogSchedule(
  id: string,
  fields: Partial<Omit<CreateWatchdogScheduleInput, 'projectId'>>,
): Promise<void> {
  const client = getWatchdogClient();
  const patch: any = {};
  if (fields.name !== undefined) patch.kzk_name = fields.name;
  if (fields.cronExpression !== undefined) patch.kzk_cronexpression = fields.cronExpression;
  if (fields.skillName !== undefined) patch.kzk_skillname = fields.skillName;
  if (fields.promptText !== undefined) patch.kzk_prompttext = fields.promptText;
  if (fields.toolsAllowed !== undefined) patch.kzk_toolsallowed = fields.toolsAllowed;
  if (fields.enabled !== undefined) patch.kzk_enabled = fields.enabled;
  await client.updateRecordAsync(WATCHDOG_TABLE, id, patch);
}

export async function deleteWatchdogSchedule(id: string): Promise<void> {
  const client = getWatchdogClient();
  await client.deleteRecordAsync(WATCHDOG_TABLE, id);
}

export function parseSkillNames(requiredSkills: string): string[] {
  if (!requiredSkills) return [];
  try {
    const parsed = JSON.parse(requiredSkills);
    if (Array.isArray(parsed)) {
      return parsed.map((s: any) => s.name ?? s).filter(Boolean);
    }
  } catch { /* raw string fallback */ }
  return requiredSkills ? [requiredSkills] : [];
}

export async function fetchWatchdogActivity(skillNames: string[]): Promise<Task[]> {
  if (skillNames.length === 0) return [];
  return timed('fetchWatchdogActivity', () => withLocalReadFallback<Task[]>('fetchWatchdogActivity', async () => {
    try {
      const result = await Kzk_tasksService.getAll({
        orderBy: ['modifiedon desc'],
      });
      const nameSet = new Set(skillNames.map(s => s.toLowerCase()));
      return (result.data ?? [])
        .filter((r: any) => {
          const parsed = parseSkillNames(r.kzk_requiredskills ?? '');
          return parsed.some(n => nameSet.has(n.toLowerCase()));
        })
        .slice(0, 20)
        .map((r: any) => ({
          id: r.kzk_taskid,
          name: r.kzk_title,
          status: STATUS_MAP[r.kzk_status as unknown as number] ?? 'Pending',
          skillName: r.kzk_requiredskills ?? '',
          waveId: r._kzk_waveid_value ?? '',
          waveName: r.kzk_waveidname ?? '',
          attempt: 0,
          predecessorIds: [],
          outputSummary: r.kzk_output,
          modifiedOn: r.modifiedon ?? '',
        }));
    } catch {
      return [];
    }
  }, () => {
    const nameSet = new Set(skillNames.map(s => s.toLowerCase()));
    return LOCAL_TASKS.filter(task => nameSet.has(task.skillName.toLowerCase()));
  }));
}
