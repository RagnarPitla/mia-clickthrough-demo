/**
 * Skills catalog — read-only view of the agent capabilities Mia has available
 * for the active project. Mirrors the Kazuki "Skill row IS the SKILL.md"
 * principle: each card is a discrete, governed capability that wave tasks
 * dispatch to.
 */

interface Skill {
  id: string;
  name: string;
  icon: string;
  category: 'Discover' | 'Initiate' | 'Implement' | 'Prepare' | 'Operate' | 'Cross-cutting';
  summary: string;
  invokedBy: string;
  autonomy: 'ReadOnly' | 'Draft' | 'SandboxAutopilot' | 'Human-in-loop';
}

const SKILLS: Skill[] = [
  {
    id: 'doc-scope',
    name: 'Document Scope',
    icon: '📄',
    category: 'Discover',
    summary:
      'Extracts entities, in-scope modules, and decisions from SOWs, RFPs, questionnaires, and chart-of-accounts files. Grounds every downstream wave in real customer context.',
    invokedBy: 'Wave 1.2 Document Ingestion · Wave 1.1 Discovery & Vision',
    autonomy: 'ReadOnly',
  },
  {
    id: 'setup-prep',
    name: 'Setup Prep',
    icon: '🛠️',
    category: 'Initiate',
    summary:
      'Prepares the D365 F&O / Dataverse setup steps for a chosen module — legal entities, ledgers, posting profiles, security roles — based on the scoped configuration plan.',
    invokedBy: 'Wave 2.1 Planning & Work Streams · Wave 3.1 Foundation & Org Config',
    autonomy: 'Draft',
  },
  {
    id: 'validation',
    name: 'Configuration Validation',
    icon: '🧪',
    category: 'Implement',
    summary:
      'Runs targeted validations against staged setup and master data: orphaned references, posting-profile coverage, dimension defaults. Surfaces issues before wave release.',
    invokedBy: 'Wave 3.2 Core Financials · Wave 4.1 Data Migration & Cutover',
    autonomy: 'ReadOnly',
  },
  {
    id: 'config-worker',
    name: 'Configuration Worker',
    icon: '⚙️',
    category: 'Implement',
    summary:
      'Applies governed F&O configuration changes through allow-listed MCP tools. Sandbox writes only; production changes require an approved Gate.',
    invokedBy: 'Wave 3.3 Order to Cash · Wave 3.4 Inventory to Deliver',
    autonomy: 'SandboxAutopilot',
  },
  {
    id: 'license-plate-decision',
    name: 'License-Plate Decision',
    icon: '🟠',
    category: 'Implement',
    summary:
      'Human-in-loop helper for warehouse setup. Drafts the recommended scope (PICK / SHIP only vs every zone) and pauses for the architect\'s call before continuing.',
    invokedBy: 'Wave 3.4 Inventory to Deliver',
    autonomy: 'Human-in-loop',
  },
  {
    id: 'wave-orchestrator',
    name: 'Wave Orchestrator',
    icon: '🌊',
    category: 'Cross-cutting',
    summary:
      'Schedules wave releases, claims Ready tasks for the Worker, and respects manual vs autopilot mode. Never bypasses Gates.',
    invokedBy: 'All phases · Dispatcher loop',
    autonomy: 'ReadOnly',
  },
  {
    id: 'watchdog',
    name: 'WatchDog',
    icon: '🐕',
    category: 'Cross-cutting',
    summary:
      'Monitors agent runs on a schedule, surfaces failures and stuck tasks into the inbox, and pings owners. Read-only against agent logs and Dataverse.',
    invokedBy: 'Continuous · Schedule-driven',
    autonomy: 'ReadOnly',
  },
  {
    id: 'cutover-runbook',
    name: 'Cutover Runbook',
    icon: '🚀',
    category: 'Prepare',
    summary:
      'Builds the cutover checklist from prior waves: data freezes, sequence of imports, rollback gates. Read-only until a human approves execution.',
    invokedBy: 'Wave 4.1 Data Migration & Cutover · Wave 4.2 UAT & Training',
    autonomy: 'Draft',
  },
];

const CATEGORY_COLOR: Record<Skill['category'], string> = {
  Discover: '#7B61FF',
  Initiate: '#0EA5E9',
  Implement: '#EA580C',
  Prepare: '#10B981',
  Operate: '#0EA5E9',
  'Cross-cutting': '#6B7280',
};

const AUTONOMY_COLOR: Record<Skill['autonomy'], string> = {
  ReadOnly: '#10B981',
  Draft: '#0EA5E9',
  SandboxAutopilot: '#EA580C',
  'Human-in-loop': '#7B61FF',
};

export default function SkillsPage() {
  return (
    <div data-testid="skills-page" style={{ padding: '8px 4px 24px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>
          Skills
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1c1c1e', margin: 0, marginBottom: 6 }}>
          Agent capability kit
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 760, lineHeight: 1.55, margin: 0 }}>
          Each skill is a governed, allow-listed capability that wave tasks dispatch to.
          Skills are read-only by default. Sandbox writes are gated by autonomy policy;
          production changes always require an approved Gate.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 14,
        }}
      >
        {SKILLS.map(skill => (
          <div
            key={skill.id}
            className="glass"
            style={{
              borderRadius: 14,
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              border: '1px solid var(--glass-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  fontSize: 22,
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'rgba(0,122,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {skill.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1c1c1e' }}>{skill.name}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      padding: '2px 7px',
                      borderRadius: 999,
                      color: CATEGORY_COLOR[skill.category],
                      background: `${CATEGORY_COLOR[skill.category]}1A`,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {skill.category}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      padding: '2px 7px',
                      borderRadius: 999,
                      color: AUTONOMY_COLOR[skill.autonomy],
                      background: `${AUTONOMY_COLOR[skill.autonomy]}1A`,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {skill.autonomy}
                  </span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-secondary)', margin: 0 }}>
              {skill.summary}
            </p>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-tertiary)',
                fontFamily: "'JetBrains Mono', monospace",
                paddingTop: 8,
                borderTop: '1px dashed var(--glass-border)',
              }}
            >
              <span style={{ fontWeight: 700, marginRight: 6 }}>Invoked by:</span>
              {skill.invokedBy}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
