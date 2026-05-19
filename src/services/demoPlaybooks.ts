import type { KzkPlaybook } from '../types/domain';

/**
 * Clean Dynamics 365 example playbooks shown in click-through demo mode.
 * These are display-only — selecting any of them in WelcomePage routes back to
 * the existing Mia click-through dashboard (which shows the Zava 11-wave dataset).
 *
 * They replace the live Dataverse playbook list (which includes branded
 * customer-specific playbooks like "Mamamia8 Success by Design Four E2E Demo")
 * so the public demo stays generic and product-focused.
 */

export const SCM2_DEMO_PLAYBOOK_ID = 'demo-playbook-d365-scm2';

export const DEMO_PLAYBOOKS: KzkPlaybook[] = [
  {
    id: 'demo-playbook-d365-finance',
    name: 'd365-finance-foundation',
    displayName: 'Dynamics 365 Finance',
    description:
      'End-to-end Finance & Operations setup: chart of accounts, ledgers, fiscal calendars, posting profiles, AP/AR, tax, and budgeting.',
    publisher: 'Microsoft',
    layer: 'Microsoft',
    iconEmoji: '💰',
    phases: [
      'Finance Foundation',
      'Chart of Accounts',
      'Ledger Operations',
      'Accounts Payable',
      'Accounts Receivable',
      'Period Close',
    ],
    modulesCovered: 'General ledger, AR, AP, Tax, Cash and bank management, Budgeting, Consolidation',
    scopeTrees: '90 Record to Report, 50 Procure to Pay (finance slice), 60 Order to Cash (finance slice)',
    waveCount: 11,
    taskCount: 27,
    sortOrder: 1,
    ctaLabel: 'Start your Journey →',
  },
  {
    id: 'demo-playbook-d365-scm',
    name: 'd365-supply-chain',
    displayName: 'Dynamics 365 Supply Chain',
    description:
      'Inventory, procurement, warehousing, and manufacturing flows for D365 Supply Chain Management.',
    publisher: 'Microsoft',
    layer: 'Microsoft',
    iconEmoji: '📦',
    phases: [
      'SCM Foundation',
      'Item Setup',
      'Inventory & Warehouse',
      'Procurement',
      'Sales & Distribution',
      'Production Control',
    ],
    modulesCovered: 'Inventory management, Warehouse management, Procurement and sourcing, Sales and marketing, Production control',
    scopeTrees: '50 Procure to Pay, 60 Order to Cash, 30 Plan to Produce',
    waveCount: 9,
    taskCount: 22,
    sortOrder: 2,
    ctaLabel: 'Start your Journey →',
  },
  {
    id: 'demo-playbook-d365-contact-center',
    name: 'd365-contact-center',
    displayName: 'Dynamics 365 Contact Center',
    description:
      'Omnichannel contact center: queues, routing, knowledge base, agent workspaces, and Copilot-powered responses.',
    publisher: 'Microsoft',
    layer: 'Microsoft',
    iconEmoji: '📞',
    phases: [
      'Contact Center Foundation',
      'Channels & Routing',
      'Queues & SLAs',
      'Knowledge & Macros',
      'Agent Experience',
      'Reporting & Insights',
    ],
    modulesCovered: 'Omnichannel for Customer Service, Customer Service Hub, Unified Routing, Copilot Studio',
    scopeTrees: '40 Service to Cash, 70 Case to Resolution',
    waveCount: 8,
    taskCount: 19,
    sortOrder: 3,
    ctaLabel: 'Start your Journey →',
  },
];

/**
 * Pre-filled setup form values shown in demo mode for each demo playbook.
 * Lets the click-through skip manual data entry on the New Project page —
 * the user just clicks ⚡ Create and the project flows on.
 */
export interface DemoSetupDefaults {
  projectName: string;
  customerName: string;
  description: string;
  devopsUrl: string;
  uploadedFiles: string[];
}

export interface DemoDocument {
  name: string;
  displayName: string;
  type: string;
}

const FINANCE_DEFAULTS: DemoSetupDefaults = {
  projectName: 'Contoso Finance Go-Live',
  customerName: 'Contoso Ltd.',
  description:
    'Stand up Dynamics 365 Finance for Contoso US: chart of accounts, ledgers, fiscal calendars, AP/AR, tax, posting profiles, and period close.',
  devopsUrl: 'https://dev.azure.com/contoso/d365-finance-go-live/_git/finance-config',
  uploadedFiles: [
    'contoso-finance-sow.md',
    'chart-of-accounts.csv',
    'fiscal-calendar.csv',
    'tax-jurisdictions.xlsx',
    'posting-profiles.json',
    'finance-business-goals.md',
  ],
};

const SCM_DEFAULTS: DemoSetupDefaults = {
  projectName: 'Contoso Supply Chain Foundation',
  customerName: 'Contoso Ltd.',
  description:
    'Implement Dynamics 365 Supply Chain Management for Contoso: items, sites, warehouses, procurement, sales, production, and master planning.',
  devopsUrl: 'https://dev.azure.com/contoso/d365-scm-foundation/_git/scm-config',
  uploadedFiles: [
    'contoso-scm-sow.md',
    'released-products.csv',
    'sites-warehouses.csv',
    'vendor-master.xlsx',
    'bom-routes.json',
    'scm-business-goals.md',
  ],
};

export const SCM2_DEMO_DOCUMENTS: DemoDocument[] = [
  { name: 'ATL-warehouse-footprint.xlsx', displayName: 'ATL Warehouse Footprint', type: '480-row bin map' },
  { name: 'ATL-policy-brief.md', displayName: 'ATL Policy Brief', type: 'Zoning, LP, cycle-count rules' },
  { name: 'zaus-site-master.csv', displayName: 'ZAUS Site Master', type: 'Site US-SE validation' },
  { name: 'whs-admin-access.json', displayName: 'WHS Admin Access', type: 'Security role evidence' },
  { name: 'dc-atlanta-cutover-plan.md', displayName: 'DC-Atlanta Cutover Plan', type: 'Tracker handoff' },
];

const SCM2_DEFAULTS: DemoSetupDefaults = {
  projectName: 'DC-Atlanta Warehouse Setup',
  customerName: 'Zava Agentic Retailer',
  description:
    'Configure warehouse ATL-01 for the ZAUS legal entity: zones, 480 bin locations, location profiles, docks, and Dataverse cutover tracking.',
  devopsUrl: 'https://dev.azure.com/zava/d365-scm/_git/dc-atlanta',
  uploadedFiles: SCM2_DEMO_DOCUMENTS.map(doc => doc.name),
};

const CC_DEFAULTS: DemoSetupDefaults = {
  projectName: 'Contoso Contact Center Modernization',
  customerName: 'Contoso Ltd.',
  description:
    'Stand up Dynamics 365 Contact Center for Contoso: omnichannel routing, queues, SLAs, knowledge base, agent workspaces, and Copilot for Service.',
  devopsUrl: 'https://dev.azure.com/contoso/d365-contact-center/_git/cc-config',
  uploadedFiles: [
    'contoso-cc-sow.md',
    'channels-and-workstreams.json',
    'queues-and-routing.csv',
    'service-schedules.xlsx',
    'knowledge-articles.zip',
    'cc-business-goals.md',
  ],
};

const DEMO_SETUP_DEFAULTS_BY_PLAYBOOK: Record<string, DemoSetupDefaults> = {
  'demo-playbook-d365-finance': FINANCE_DEFAULTS,
  'demo-playbook-d365-scm': SCM_DEFAULTS,
  'demo-playbook-d365-contact-center': CC_DEFAULTS,
  [SCM2_DEMO_PLAYBOOK_ID]: SCM2_DEFAULTS,
};

export function isDemoPlaybookId(id: string | null | undefined): boolean {
  return !!id && id in DEMO_SETUP_DEFAULTS_BY_PLAYBOOK;
}

export function isScm2DemoPlaybookId(id: string | null | undefined): boolean {
  return id === SCM2_DEMO_PLAYBOOK_ID;
}

export function getDemoSetupDefaults(playbookId: string | null | undefined): DemoSetupDefaults | null {
  if (!playbookId) return null;
  return DEMO_SETUP_DEFAULTS_BY_PLAYBOOK[playbookId] ?? null;
}
