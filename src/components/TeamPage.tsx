import type { ProjectMember, MemberRole } from '../types/domain';

interface TeamPageProps {
  members: ProjectMember[];
  loading: boolean;
}

const ROLE_COLORS: Record<MemberRole, string> = {
  DA: 'var(--accent)',
  Consultant: 'var(--completed)',
  SME: 'var(--inprogress)',
  CustomerSponsor: '#c084fc',
  CustomerSME: '#c084fc',
};

const ROLE_LABELS: Record<MemberRole, string> = {
  DA: 'DA',
  Consultant: 'Consultant',
  SME: 'SME',
  CustomerSponsor: 'Customer Sponsor',
  CustomerSME: 'Customer SME',
};

function getInitials(name: string): string {
  return name.split(/\s+/).map(w => w[0] ?? '').slice(0, 2).join('').toUpperCase();
}

const glass = {
  background: '#fff',
  border: '1px solid rgba(0,0,0,0.08)',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

export default function TeamPage({ members, loading }: TeamPageProps) {
  if (loading && members.length === 0) {
    return (
      <div data-testid="team-page" style={{ padding: 24, borderRadius: 18, ...glass }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 600, marginBottom: 12, color: '#1a1a2e' }}>
          Project Team
        </h2>
        <div style={{ fontSize: 13, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", animation: 'pulse 1.2s ease-in-out infinite' }}>
          Loading team…
        </div>
      </div>
    );
  }

  return (
    <div data-testid="team-page" style={{ padding: 24, borderRadius: 18, ...glass }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 600, margin: 0, color: '#1a1a2e' }}>
            Project Team
          </h2>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>
            {members.length} member{members.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Card grid */}
      <div data-testid="team-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {members.map(member => {
          const color = ROLE_COLORS[member.role] ?? 'var(--text-secondary)';
          return (
            <div
              key={member.id}
              data-testid={`member-card-${member.id}`}
              style={{
                borderRadius: 14, padding: '18px 16px',
                background: '#f9fafb',
                border: '1px solid rgba(0,0,0,0.08)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                transition: 'all 0.2s',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: `${color}22`, border: `2px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 700, color,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {getInitials(member.displayName)}
              </div>

              {/* Name */}
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center' }}>
                {member.displayName}
              </div>

              {/* Role badge */}
              <span
                data-testid={`role-badge-${member.id}`}
                style={{
                  padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                  background: `${color}18`, border: `1px solid ${color}40`,
                  color, fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {ROLE_LABELS[member.role] ?? member.role}
              </span>

              {/* Email */}
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all', textAlign: 'center' }}>
                {member.email}
              </div>

              {/* Task count placeholder */}
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace" }}>
                0 tasks
              </div>
            </div>
          );
        })}

        {/* Add Member card */}
        <button
          data-testid="add-member-card"
          style={{
            borderRadius: 14, padding: '18px 16px',
            background: 'transparent',
            border: '2px dashed rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: 'pointer', transition: 'all 0.2s', minHeight: 160,
            fontFamily: 'inherit',
          }}
        >
          <span style={{ fontSize: 28, color: 'var(--text-tertiary)', lineHeight: 1 }}>+</span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>Add Member</span>
        </button>
      </div>
    </div>
  );
}
