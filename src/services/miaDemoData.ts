import type {
  ActivityFeedEntry,
  CustomerDataFile,
  E2EProcess,
  KzkPlaybook,
  Phase,
  Project,
  ProjectMember,
  Task,
  Wave,
} from '../types/domain';

// Internal identifier used to scope Mia's seeded data. Kept user-facing-clean
// (no "demo" wording) since the truncated value is surfaced in some UI shells.
export const MIA_DEMO_PROJECT_ID = 'mia-zava-us-legal-entity';
export const MIA_DEMO_PLAYBOOK_ID = 'mia-sbd-zava-agentic-retailer';
export const MIA_DEMO_PLAYBOOK_NAME = 'mia-sbd-zava-agentic-retailer';
export const MIA_DEMO_PLAYBACK_KEY = 'mia-playback-step';
export const MIA_FINANCE_SCM_WAVE_KEY = 'mia-finance-scm-wave';
// localStorage flag set by the Cowork app once the user has executed the
// configuration plan there. Read by getMiaDemoTasks to resolve the
// awaiting-user license-plate task to Completed.
export const MIA_COWORK_DECISION_KEY = 'mia-license-plate-decision';
export const MIA_SCM_PENDING_KEY = 'mia-scm-pending-intervention';
export const MIA_COWORK_DECISION_URL = '/cowork?from=mia&task=warehouse';
export const MIA_SCM_DECISION_URL = '/SCM/decision?from=mia&task=warehouse&assigned=decision';

const PHASE_DISCOVER = 'mia-phase-discover';
const PHASE_INITIATE = 'mia-phase-initiate';
const PHASE_IMPLEMENT = 'mia-phase-implement';
const PHASE_PREPARE = 'mia-phase-prepare';
const PHASE_OPERATE = 'mia-phase-operate';

export const MIA_DEMO_DOCUMENTS = [
  { name: 'zava-us-sow.md', displayName: 'Statement of Work', type: 'SOW', summary: 'Requests a US legal entity setup and D365 Finance + Supply Chain implementation scope.' },
  { name: 'zava-rfp.pdf', displayName: 'Request for Proposal', type: 'RFP', summary: 'Outlines vendor selection criteria, scope expectations, and evaluation timeline for the implementation.' },
  { name: 'business-goals.json', displayName: 'Business Goals', type: 'Goals', summary: 'Maps close acceleration, credit control, inventory accuracy, and product governance goals to four E2Es.' },
  { name: 'legal-entities.csv', displayName: 'Legal Entities', type: 'Master Data', summary: 'Provides the ZAUS legal entity seed values, address, currency, calendar, and tax assumptions.' },
  { name: 'chart-of-accounts.csv', displayName: 'Chart of Accounts', type: 'Finance Data', summary: 'Defines the ZA-GLOBAL chart of accounts and financial dimension setup inputs.' },
  { name: 'customers-products-inventory.xlsx', displayName: 'Customers, Products & Inventory', type: 'Operations Data', summary: 'Supplies customers, products, sites, warehouses, and blocked-order scenarios.' },
  { name: 'zava-success-by-design-notes.md', displayName: 'Success by Design Notes', type: 'Reference', summary: 'Explains why Mia selected Record to Report, Order to Cash, Inventory to Deliver, and Design to Retire.' },
];

export const MIA_DEMO_SETUP_DEFAULTS = {
  projectName: 'Zava US Legal Entity Setup',
  customerName: 'Zava Agentic Retailer',
  description:
    'Set up a US legal entity and map the required Success by Design business processes from uploaded customer documents.',
  devopsUrl: '',
  uploadedFiles: MIA_DEMO_DOCUMENTS.map(doc => doc.name),
};

export const MIA_SBD_PLAYBOOK: KzkPlaybook = {
  id: MIA_DEMO_PLAYBOOK_ID,
  name: MIA_DEMO_PLAYBOOK_NAME,
  displayName: 'FastTrack Success by Design',
  description: 'Document-driven setup for a US legal entity and four selected E2E processes.',
  publisher: 'Microsoft',
  layer: 'Microsoft',
  iconEmoji: 'SBD',
  phases: ['Discover', 'Initiate', 'Implement', 'Prepare', 'Operate'],
  modulesCovered:
    'General Ledger, Tax, Financial Reporting, Accounts Receivable, Sales and Marketing, Product Information Management, Inventory Management, Warehouse Management',
  scopeTrees: '90,65,60,40',
  waveCount: 11,
  taskCount: 58,
  sortOrder: 0,
  version: 'demo-clickthrough',
};

// ABC Partner-published playbook — used to demonstrate that partners can author
// their own playbooks and run them through the same agent experience.
export const MIA_ABC_PARTNER_PLAYBOOK: KzkPlaybook = {
  id: 'mia-abc-partner-retail-accelerator',
  name: 'mia-abc-partner-retail-accelerator',
  displayName: 'Retail Go-Live Accelerator',
  description: 'Partner-authored playbook codifying ABC Partner\'s retail delivery IP — store ops, POS, and omnichannel inventory.',
  publisher: 'ABC Partner',
  layer: 'Partner',
  iconEmoji: '🛍️',
  phases: ['Discover', 'Initiate', 'Implement', 'Prepare', 'Operate'],
  modulesCovered:
    'Retail and Commerce, Inventory Management, Warehouse Management, Sales and Marketing',
  scopeTrees: '90,65,60',
  waveCount: 9,
  taskCount: 42,
  sortOrder: 1,
  version: 'partner-clickthrough',
  ctaLabel: 'Start your Journey →',
};

export const MIA_DEMO_PROJECT: Project = {
  id: MIA_DEMO_PROJECT_ID,
  name: MIA_DEMO_SETUP_DEFAULTS.projectName,
  description: MIA_DEMO_SETUP_DEFAULTS.description,
  customerName: MIA_DEMO_SETUP_DEFAULTS.customerName,
  products: 'D365 Finance + Supply Chain',
  scopeSummary: 'Four Success by Design E2Es selected from uploaded Zava documents for a US legal entity setup.',
  autopilot: true,
  foSandboxUrl: 'https://d365perflab.sandbox.operations.dynamics.com',
  dataverseUrl: 'demo-playback',
};

const WAVE_DEFINITIONS = [
  // ── Discover (2 waves) ──
  { id: 'mia-wave-discovery-vision',     name: '1.1 Discovery & Vision',            phaseId: PHASE_DISCOVER,  taskCount: 6 },
  { id: 'mia-wave-document-ingestion',   name: '1.2 Document Ingestion',            phaseId: PHASE_DISCOVER,  taskCount: 3 },
  // ── Initiate (1 wave) ──
  { id: 'mia-wave-planning-streams',     name: '2.1 Planning & Work Streams',       phaseId: PHASE_INITIATE,  taskCount: 7 },
  // ── Implement (4 waves; 3.4 highlighted in the demo) ──
  { id: 'mia-wave-foundation-config',    name: '3.1 Foundation & Org Config',       phaseId: PHASE_IMPLEMENT, taskCount: 6 },
  { id: 'mia-wave-core-financials',      name: '3.2 Core Financials (R2R)',         phaseId: PHASE_IMPLEMENT, taskCount: 6 },
  { id: 'mia-wave-order-to-cash',        name: '3.3 Order to Cash (O2C)',           phaseId: PHASE_IMPLEMENT, taskCount: 5 },
  { id: 'mia-wave-inventory-to-deliver', name: '3.4 Inventory to Deliver',          phaseId: PHASE_IMPLEMENT, taskCount: 5 },
  // ── Prepare ──
  { id: 'mia-wave-data-cutover',         name: '4.1 Data Migration & Cutover',      phaseId: PHASE_PREPARE,   taskCount: 6 },
  { id: 'mia-wave-uat-training',         name: '4.2 UAT & Training',                phaseId: PHASE_PREPARE,   taskCount: 5 },
  { id: 'mia-wave-gate-golive',          name: '4.3 Gate: Go-Live Readiness',       phaseId: PHASE_PREPARE,   taskCount: 5 },
  // ── Operate ──
  { id: 'mia-wave-golive-hypercare',     name: '5.1 Go-Live & Hypercare',           phaseId: PHASE_OPERATE,   taskCount: 4 },
] as const;

const TASK_TITLES_BY_WAVE: string[][] = [
  // 1.1 Discovery & Vision
  ['Kickoff with sponsor and stakeholders', 'Capture business vision and outcomes', 'Profile customer org structure', 'Identify executive priorities', 'Draft success criteria', 'Publish discovery summary'],
  // 1.2 Document Ingestion
  ['Read uploaded customer documents', 'Extract entities, processes, and goals', 'Normalize document index'],
  // 2.1 Planning & Work Streams
  ['Define work streams and owners', 'Build implementation timeline', 'Allocate resources by stream', 'Set up status cadence', 'Define risk and issue log', 'Confirm dependencies', 'Publish program plan'],
  // 3.1 Foundation & Org Config
  ['Provision sandbox environment', 'Configure legal entities', 'Configure number sequences', 'Configure currencies and exchange rates', 'Configure security roles', 'Validate foundation setup'],
  // 3.2 Core Financials (R2R)
  ['Configure chart of accounts', 'Configure financial dimensions', 'Configure fiscal calendar', 'Configure ledger and posting profiles', 'Configure tax setup', 'Validate trial balance'],
  // 3.3 Order to Cash (O2C)
  ['Configure customer master setup', 'Configure credit and collections', 'Configure invoicing flow', 'Configure receivables setup', 'Validate O2C cycle'],
  // 3.4 Inventory to Deliver
  ['Configure sites and warehouses', 'Configure license plate scope', 'Configure inventory tracking dimensions', 'Configure picking and put-away rules', 'Validate I2D cycle'],
  // 4.1 Data Migration & Cutover
  ['Define migration entities', 'Build data templates', 'Run mock cutover #1', 'Run mock cutover #2', 'Reconcile balances', 'Approve cutover plan'],
  // 4.2 UAT & Training
  ['Build UAT scenarios', 'Run UAT cycle', 'Triage UAT findings', 'Deliver end-user training', 'Capture UAT sign-off'],
  // 4.3 Gate: Go-Live Readiness
  ['Compile go-live evidence', 'Confirm hypercare staffing', 'Confirm rollback plan', 'Sponsor go/no-go decision', 'Approve go-live'],
  // 5.1 Go-Live & Hypercare
  ['Execute production cutover', 'Validate first day operations', 'Run hypercare standups', 'Transition to steady state'],
];

const MIA_DEMO_TASK_SEEDS = WAVE_DEFINITIONS.flatMap((wave, waveIndex) =>
  TASK_TITLES_BY_WAVE[waveIndex].map((title, taskIndex) => {
    const id = `${wave.id}-task-${taskIndex + 1}`;
    const previousTask = taskIndex > 0 ? `${wave.id}-task-${taskIndex}` : undefined;
    const previousWave = waveIndex > 0 ? WAVE_DEFINITIONS[waveIndex - 1] : undefined;
    const previousWaveTask = previousWave
      ? `${previousWave.id}-task-${TASK_TITLES_BY_WAVE[waveIndex - 1].length}`
      : undefined;
    return {
      waveIndex,
      task: {
        id,
        name: `${String(taskIndex + 1).padStart(2, '0')}. ${title}`,
        status: 'Pending' as const,
        skillName: taskIndex % 3 === 0 ? 'mia-document-scope' : taskIndex % 3 === 1 ? 'mia-setup-prep' : 'mia-validation',
        waveId: wave.id,
        waveName: wave.name,
        attempt: 1,
        predecessorIds: [previousTask ?? previousWaveTask].filter((value): value is string => Boolean(value)),
        outputSummary: `Mia prepared evidence for: ${title}.`,
        modifiedOn: '2026-05-07T13:00:00Z',
        description: `Playback task for ${title.toLowerCase()}. This is simulated and does not write to ERP.`,
        type: wave.name.includes('Gate') ? 'Approval' : 'Configuration',
        assigneeKind: wave.name.includes('Gate') ? 'Role' : 'Worker',
        assigneeRole: wave.name.includes('Gate') ? 'DA' : undefined,
      } satisfies Task,
    };
  }),
);

export const MIA_DEMO_WAVE_COUNT = WAVE_DEFINITIONS.length;

/**
 * Released-wave set: indices into WAVE_DEFINITIONS that have been released.
 * Replaces the older linear `progress: number` API so the user can release
 * waves out of order in the click-through demo.
 */
export type ReleasedWaves = ReadonlySet<number>;

function asSet(input: ReleasedWaves | number): ReadonlySet<number> {
  if (typeof input === 'number') {
    const step = Math.max(0, Math.min(MIA_DEMO_WAVE_COUNT, input));
    const set = new Set<number>();
    for (let i = 0; i < step; i++) set.add(i);
    return set;
  }
  return input;
}

function countReleasedInPhase(released: ReadonlySet<number>, phaseId: string): { done: number; total: number } {
  let done = 0;
  let total = 0;
  WAVE_DEFINITIONS.forEach((wave, index) => {
    if (wave.phaseId !== phaseId) return;
    total += 1;
    if (released.has(index)) done += 1;
  });
  return { done, total };
}

function phaseStatus(released: ReadonlySet<number>, phaseId: string): 'Completed' | 'Active' | 'NotStarted' {
  const { done, total } = countReleasedInPhase(released, phaseId);
  if (total === 0) return 'NotStarted';
  if (done >= total) return 'Completed';
  if (done > 0) return 'Active';
  return 'NotStarted';
}

export function getMiaDemoPhases(progress: ReleasedWaves | number): Phase[] {
  const released = asSet(progress);
  return [
    {
      id: PHASE_DISCOVER,
      name: 'Discover',
      description: 'Discovery, document ingestion, and scope confirmation',
      order: 1,
      status: phaseStatus(released, PHASE_DISCOVER),
      projectId: MIA_DEMO_PROJECT_ID,
    },
    {
      id: PHASE_INITIATE,
      name: 'Initiate',
      description: 'Planning, work streams, and program kickoff',
      order: 2,
      status: phaseStatus(released, PHASE_INITIATE),
      projectId: MIA_DEMO_PROJECT_ID,
    },
    {
      id: PHASE_IMPLEMENT,
      name: 'Implement',
      description: 'Foundation, R2R, O2C, and Inventory to Deliver configuration waves',
      order: 3,
      status: phaseStatus(released, PHASE_IMPLEMENT),
      projectId: MIA_DEMO_PROJECT_ID,
    },
    {
      id: PHASE_PREPARE,
      name: 'Prepare',
      description: 'Data migration, UAT, and go-live readiness gate',
      order: 4,
      status: phaseStatus(released, PHASE_PREPARE),
      projectId: MIA_DEMO_PROJECT_ID,
    },
    {
      id: PHASE_OPERATE,
      name: 'Operate',
      description: 'Go-live execution and hypercare',
      order: 5,
      status: phaseStatus(released, PHASE_OPERATE),
      projectId: MIA_DEMO_PROJECT_ID,
    },
  ];
}

export function getMiaDemoWaves(progress: ReleasedWaves | number, runningIndex: number = -1): Wave[] {
  const released = asSet(progress);
  return WAVE_DEFINITIONS.map((wave, index) => {
    let status: string;
    if (index === runningIndex) status = 'InProgress';
    else if (released.has(index)) status = 'Completed';
    else status = 'Draft';
    return {
      id: wave.id,
      name: wave.name,
      description: 'Playback wave for the Mia Console executive walkthrough.',
      status,
      projectId: MIA_DEMO_PROJECT_ID,
      taskCount: wave.taskCount,
      errorCount: 0,
      phaseId: wave.phaseId,
    };
  });
}

export function getMiaDemoTasks(progress: ReleasedWaves | number): Task[] {
  const released = asSet(progress);
  return MIA_DEMO_TASK_SEEDS.map(({ waveIndex, task }) => {
    const waveReleased = released.has(waveIndex);
    const isAwaitingUser =
      waveReleased
      && task.id === 'mia-wave-inventory-to-deliver-task-2'
      && isScmInterventionPending();
    return {
      ...task,
      status: isAwaitingUser
        ? ('InProgress' as const)
        : waveReleased
          ? ('Completed' as const)
          : ('Pending' as const),
      completedAt: waveReleased && !isAwaitingUser ? '2026-05-07T13:30:00Z' : undefined,
      awaitingUser: isAwaitingUser ? true : undefined,
    };
  });
}

function isScmInterventionPending(): boolean {
  try {
    return typeof localStorage !== 'undefined'
      && localStorage.getItem(MIA_SCM_PENDING_KEY) === 'true'
      && localStorage.getItem(MIA_COWORK_DECISION_KEY) !== 'complete';
  } catch {
    return false;
  }
}

export const MIA_DEMO_PROCESSES: E2EProcess[] = [
  {
    id: 'mia-process-r2r',
    name: 'Record to Report',
    bpcId: '90',
    areas: 'Legal entity, ledger, chart of accounts, financial dimensions, fiscal calendar, tax, close validation. Selected from legal-entities.csv, chart-of-accounts.csv, and close acceleration goals.',
    modules: 'General Ledger, Tax, Financial Reporting',
    isInScope: true,
    projectId: MIA_DEMO_PROJECT_ID,
  },
  {
    id: 'mia-process-o2c',
    name: 'Order to Cash',
    bpcId: '65',
    areas: 'Customer credit, blocked order handling, invoice readiness, and receivables setup. Selected from customer data and blocked-order goals.',
    modules: 'Accounts Receivable, Sales and Marketing, Credit and Collections',
    isInScope: true,
    projectId: MIA_DEMO_PROJECT_ID,
  },
  {
    id: 'mia-process-i2d',
    name: 'Inventory to Deliver',
    bpcId: '60',
    areas: 'Site, warehouse, inventory accuracy, and fulfillment defaults. Selected from inventory/site/warehouse data.',
    modules: 'Inventory Management, Warehouse Management',
    isInScope: true,
    projectId: MIA_DEMO_PROJECT_ID,
  },
  {
    id: 'mia-process-d2r',
    name: 'Design to Retire',
    bpcId: '40',
    areas: 'Product classification, item setup defaults, and lifecycle governance. Selected from product master data.',
    modules: 'Product Information Management',
    isInScope: true,
    projectId: MIA_DEMO_PROJECT_ID,
  },
];

export const MIA_DEMO_MEMBERS: ProjectMember[] = [
  { id: 'mia-member-da', displayName: 'Ragnar Pitla', email: 'ragnarpitla@example.com', role: 'DA', projectId: MIA_DEMO_PROJECT_ID },
  { id: 'mia-member-finance', displayName: 'Zava Finance Sponsor', email: 'finance.sponsor@zava.example', role: 'CustomerSponsor', projectId: MIA_DEMO_PROJECT_ID },
  { id: 'mia-member-operations', displayName: 'Zava Operations SME', email: 'operations.sme@zava.example', role: 'CustomerSME', projectId: MIA_DEMO_PROJECT_ID },
  { id: 'mia-member-worker', displayName: 'Mia Hosted Worker', email: 'mia-worker@example.com', role: 'Consultant', projectId: MIA_DEMO_PROJECT_ID },
];

export const MIA_DEMO_CUSTOMER_DATA: CustomerDataFile[] = MIA_DEMO_DOCUMENTS.map((doc, index) => ({
  id: `mia-file-${index + 1}`,
  name: doc.name,
  subject: `Mia data: ${doc.name}`,
  body:
    `File: ${doc.name}\n` +
    'Root: mia\n' +
    `Type: ${doc.type}\n` +
    'MIME: text/plain\n\n' +
    'Safety: Sample playback source. This is not live customer data and does not trigger ERP writes.\n\n' +
    'Content:\n' +
    doc.summary,
  sourceType: doc.type === 'Reference' ? 'Reference' : 'Seeded',
  fileType: doc.name.split('.').pop() ?? '',
  mimeType: 'text/plain',
  projectId: MIA_DEMO_PROJECT_ID,
  createdOn: '2026-05-07T13:00:00Z',
  modifiedOn: '2026-05-07T13:00:00Z',
  uploadedBy: 'Mia Console',
  truncated: false,
}));

export function getMiaDemoActivity(progress: ReleasedWaves | number): ActivityFeedEntry[] {
  const released = asSet(progress);
  const step = released.size;
  const entries: ActivityFeedEntry[] = [
    {
      id: 'mia-activity-docs',
      icon: '📋',
      taskId: 'mia-docs',
      message: 'Documents uploaded: SOW, business goals, legal entities, COA, customers, products, and inventory data.',
      timestamp: '2026-05-07T13:00:00Z',
    },
    {
      id: 'mia-activity-scope',
      icon: '🤖',
      taskId: 'mia-scope',
      message: 'Mia identified 4 Success by Design E2Es from the uploaded documents.',
      timestamp: '2026-05-07T13:01:00Z',
    },
    {
      id: 'mia-activity-waves',
      icon: '▶',
      taskId: 'mia-waves',
      message: `Mia generated ${MIA_DEMO_WAVE_COUNT} waves and ${MIA_DEMO_TASK_SEEDS.length} tasks for the click-through workspace.`,
      timestamp: '2026-05-07T13:02:00Z',
    },
  ];

  if (step > 0) {
    entries.push({
      id: 'mia-activity-playback',
      icon: '▶',
      taskId: 'mia-playback',
      message: `Released ${step} of ${MIA_DEMO_WAVE_COUNT} waves without live ERP writes.`,
      timestamp: '2026-05-07T13:03:00Z',
    });
  }

  if (step >= MIA_DEMO_WAVE_COUNT) {
    entries.push({
      id: 'mia-activity-complete',
      icon: '✓',
      taskId: 'mia-complete',
      message: 'All demo waves and tasks are complete. Operate readiness handoff is prepared.',
      timestamp: '2026-05-07T13:04:00Z',
    });
  }

  return entries.reverse();
}

export function isMiaDemoPlaybook(playbook: KzkPlaybook | null | undefined): boolean {
  return playbook?.id === MIA_DEMO_PLAYBOOK_ID || playbook?.name === MIA_DEMO_PLAYBOOK_NAME;
}

export function isMiaDemoProjectId(projectId: string | null | undefined): boolean {
  return projectId === MIA_DEMO_PROJECT_ID;
}

export function mergeMiaDemoPlaybookFirst(playbooks: KzkPlaybook[]): KzkPlaybook[] {
  const withoutDemo = playbooks.filter(playbook => !isMiaDemoPlaybook(playbook));
  return [MIA_SBD_PLAYBOOK, ...withoutDemo];
}

export function mergeMiaDemoProject(projects: Project[]): Project[] {
  const withoutDemo = projects.filter(project => project.id !== MIA_DEMO_PROJECT_ID);
  return [MIA_DEMO_PROJECT, ...withoutDemo];
}
